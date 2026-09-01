import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbCreateUser, 
  signOut as fbSignOut, 
  onAuthStateChanged as onFbAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  initializeFirestore,
  setLogLevel,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { PoliceTask, UserProfile, TaskTemplate } from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Suppress transient internal WebChannel transport connection logs
try {
  setLogLevel('silent');
} catch (_) {}

// Initialize Firestore with long-polling for stable connection across proxies/iframes
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false,
  },
  firebaseConfigData.firestoreDatabaseId || '(default)'
);

// Unified App User Interface
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Session Auth State Management (Fallback when Firebase Auth Email provider is disabled)
const LOCAL_USER_KEY = 'pcce_1dp_auth_user';
const authListeners: Set<(user: AppUser | null) => void> = new Set();

function getStoredLocalUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredLocalUser(user: AppUser | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  } catch {}
  notifyAuthListeners(user);
}

function notifyAuthListeners(user: AppUser | null) {
  authListeners.forEach((listener) => {
    try {
      listener(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Subscribe to auth state changes (Firebase + Local Session)
export const onAuthStateChanged = (
  _authInstance: any,
  callback: (user: AppUser | null) => void
) => {
  authListeners.add(callback);

  // Check if Firebase Auth has a user or emits one
  const fbUnsub = onFbAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
      };
      callback(appUser);
    } else {
      const localUser = getStoredLocalUser();
      callback(localUser);
    }
  });

  // Initial immediate call with local user if already stored
  const currentLocal = getStoredLocalUser();
  if (currentLocal && !auth.currentUser) {
    callback(currentLocal);
  }

  return () => {
    authListeners.delete(callback);
    fbUnsub();
  };
};

export const signInWithEmailAndPassword = async (email: string, pass: string): Promise<{ user: AppUser }> => {
  try {
    const cred = await fbSignIn(auth, email, pass);
    const user: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
    };
    setStoredLocalUser(user);
    return { user };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
      console.warn('Firebase email auth not enabled on console, using persistent session auth fallback.');
      // Create deterministic UID for this email so their profile & tasks persist
      const cleanEmail = email.toLowerCase().trim();
      const safeId = 'dp1_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const fallbackUser: AppUser = {
        uid: safeId,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
      };
      setStoredLocalUser(fallbackUser);
      return { user: fallbackUser };
    }
    throw err;
  }
};

export const createUserWithEmailAndPassword = async (email: string, pass: string): Promise<{ user: AppUser }> => {
  try {
    const cred = await fbCreateUser(auth, email, pass);
    const user: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName,
    };
    setStoredLocalUser(user);
    return { user };
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
      console.warn('Firebase email auth not enabled on console, using persistent session auth fallback.');
      const cleanEmail = email.toLowerCase().trim();
      const safeId = 'dp1_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
      const fallbackUser: AppUser = {
        uid: safeId,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
      };
      setStoredLocalUser(fallbackUser);
      return { user: fallbackUser };
    }
    throw err;
  }
};

export const signOut = async () => {
  try {
    await fbSignOut(auth);
  } catch (_) {}
  setStoredLocalUser(null);
};

export type { User };

// Helper to sanitize objects for Firestore (removes undefined fields which cause Firestore errors)
function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = sanitizeForFirestore(val);
      } else {
        clean[key] = val;
      }
    }
  });
  return clean;
}

// User Profile Firestore Methods
export async function saveUserProfile(userProfile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', userProfile.userId);
  const cleanData = sanitizeForFirestore({
    ...userProfile,
    updatedAt: new Date().toISOString()
  });
  await setDoc(userRef, cleanData, { merge: true });
}

export function subscribeToUserProfile(userId: string, onUpdate: (profile: UserProfile | null) => void) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as UserProfile);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('Error fetching user profile:', err);
    onUpdate(null);
  });
}

// Real-time Police Tasks Firestore Methods
const TASKS_CACHE_PREFIX = 'pcce_tasks_cache_';
const TEMPLATES_CACHE_PREFIX = 'pcce_templates_cache_';

export function subscribeToTasks(userId: string, onUpdate: (tasks: PoliceTask[]) => void) {
  // Emit locally cached data immediately if available
  try {
    const cached = localStorage.getItem(TASKS_CACHE_PREFIX + userId);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      }
    }
  } catch (_) {}

  const tasksRef = collection(db, 'tasks');
  const q = query(tasksRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const tasks: PoliceTask[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      tasks.push({
        id: docSnap.id,
        userId: data.userId,
        title: data.title || '',
        description: data.description || '',
        procedureNumber: data.procedureNumber || '',
        category: data.category || 'outro',
        priority: data.priority || 'media',
        date: data.date || '',
        time: data.time || '',
        status: data.status || 'pendente',
        rescheduledTo: data.rescheduledTo || '',
        reason: data.reason || '',
        notes: data.notes || '',
        assignedBadge: data.assignedBadge || '',
        completedAt: data.completedAt || '',
        order: typeof data.order === 'number' ? data.order : undefined,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    // Sort by date, then by custom order if set, then by time
    tasks.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      if (typeof a.order === 'number' && typeof b.order === 'number') {
        return a.order - b.order;
      }
      if (typeof a.order === 'number') return -1;
      if (typeof b.order === 'number') return 1;
      return (a.time || '99:99').localeCompare(b.time || '99:99');
    });

    try {
      localStorage.setItem(TASKS_CACHE_PREFIX + userId, JSON.stringify(tasks));
    } catch (_) {}

    onUpdate(tasks);
  }, (error) => {
    console.warn('Real-time task synchronization offline or reconnecting:', error?.message || error);
    // On error, try to serve cache
    try {
      const cached = localStorage.getItem(TASKS_CACHE_PREFIX + userId);
      if (cached) {
        onUpdate(JSON.parse(cached));
      }
    } catch (_) {}
  });
}

export async function addPoliceTask(task: Omit<PoliceTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const tasksRef = collection(db, 'tasks');
  const newDocRef = doc(tasksRef);
  const now = new Date().toISOString();
  
  const payload = sanitizeForFirestore({
    title: task.title || '',
    procedureNumber: task.procedureNumber || '',
    category: task.category || 'outro',
    priority: task.priority || 'media',
    date: task.date || '',
    time: task.time || '',
    status: task.status || 'pendente',
    description: task.description || '',
    notes: task.notes || '',
    rescheduledTo: task.rescheduledTo || '',
    reason: task.reason || '',
    assignedBadge: task.assignedBadge || '',
    completedAt: task.completedAt || '',
    order: typeof task.order === 'number' ? task.order : Date.now(),
    userId: task.userId,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

export async function updatePoliceTask(taskId: string, updates: Partial<PoliceTask>): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: new Date().toISOString()
  });
  await updateDoc(taskRef, cleanUpdates);
}

export async function deletePoliceTask(taskId: string): Promise<void> {
  const taskRef = doc(db, 'tasks', taskId);
  await deleteDoc(taskRef);
}

export async function batchDeletePoliceTasks(taskIds: string[]): Promise<void> {
  if (!taskIds || taskIds.length === 0) return;
  const batch = writeBatch(db);
  taskIds.forEach((id) => {
    const taskRef = doc(db, 'tasks', id);
    batch.delete(taskRef);
  });
  await batch.commit();
}

export async function batchUpdatePoliceTasks(taskIds: string[], updates: Partial<PoliceTask>): Promise<void> {
  if (!taskIds || taskIds.length === 0) return;
  const batch = writeBatch(db);
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  taskIds.forEach((id) => {
    const taskRef = doc(db, 'tasks', id);
    batch.update(taskRef, cleanUpdates);
  });
  await batch.commit();
}

export async function duplicateTaskToDate(task: PoliceTask, newDate: string): Promise<void> {
  const tasksRef = collection(db, 'tasks');
  const newDocRef = doc(tasksRef);
  const now = new Date().toISOString();

  const payload = sanitizeForFirestore({
    ...task,
    id: newDocRef.id,
    date: newDate,
    status: 'pendente',
    rescheduledTo: '',
    reason: '',
    completedAt: '',
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(newDocRef, payload);
}

// Replicate a Task to multiple chosen dates in Firestore
export async function replicateTaskToDates(
  taskData: Partial<Omit<PoliceTask, 'id' | 'createdAt' | 'updatedAt' | 'date'>> & { title: string },
  dates: string[],
  userId: string
): Promise<string[]> {
  const tasksRef = collection(db, 'tasks');
  const createdIds: string[] = [];
  const now = new Date().toISOString();

  for (const date of dates) {
    const newDocRef = doc(tasksRef);
    const payload = sanitizeForFirestore({
      title: taskData.title || 'Procedimento Policial',
      procedureNumber: taskData.procedureNumber || '',
      category: taskData.category || 'outro',
      priority: taskData.priority || 'media',
      date: date,
      time: taskData.time || '',
      status: 'pendente',
      description: taskData.description || '',
      notes: taskData.notes || '',
      rescheduledTo: '',
      reason: '',
      assignedBadge: taskData.assignedBadge || '',
      completedAt: '',
      userId: userId,
      id: newDocRef.id,
      createdAt: now,
      updatedAt: now,
    });

    await setDoc(newDocRef, payload);
    createdIds.push(newDocRef.id);
  }

  return createdIds;
}

// ==========================================
// Task Templates / Catálogo de Modelos no Database
// ==========================================

export function subscribeToTaskTemplates(userId: string, onUpdate: (templates: TaskTemplate[]) => void) {
  // Emit locally cached data immediately if available
  try {
    const cached = localStorage.getItem(TEMPLATES_CACHE_PREFIX + userId);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onUpdate(parsed);
      }
    }
  } catch (_) {}

  const templatesRef = collection(db, 'task_templates');
  const q = query(templatesRef, where('userId', '==', userId));

  return onSnapshot(q, (snapshot) => {
    const templates: TaskTemplate[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      templates.push({
        id: docSnap.id,
        userId: data.userId,
        title: data.title || '',
        description: data.description || '',
        procedureNumber: data.procedureNumber || '',
        category: data.category || 'outro',
        priority: data.priority || 'media',
        time: data.time || '',
        notes: data.notes || '',
        isFavorite: data.isFavorite === true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });

    // Sort favorites first, then alphabetically by title
    templates.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.title.localeCompare(b.title);
    });

    try {
      localStorage.setItem(TEMPLATES_CACHE_PREFIX + userId, JSON.stringify(templates));
    } catch (_) {}

    onUpdate(templates);
  }, (error) => {
    console.warn('Task templates synchronization offline or reconnecting:', error?.message || error);
    try {
      const cached = localStorage.getItem(TEMPLATES_CACHE_PREFIX + userId);
      if (cached) {
        onUpdate(JSON.parse(cached));
      }
    } catch (_) {}
  });
}

export async function addTaskTemplate(template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const templatesRef = collection(db, 'task_templates');
  const newDocRef = doc(templatesRef);
  const now = new Date().toISOString();

  const payload = sanitizeForFirestore({
    id: newDocRef.id,
    userId: template.userId,
    title: template.title || '',
    procedureNumber: template.procedureNumber || '',
    category: template.category || 'outro',
    priority: template.priority || 'media',
    time: template.time || '',
    description: template.description || '',
    notes: template.notes || '',
    isFavorite: template.isFavorite === true,
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(newDocRef, payload);
  return newDocRef.id;
}

export async function toggleTaskTemplateFavorite(templateId: string, isFavorite: boolean): Promise<void> {
  const templateRef = doc(db, 'task_templates', templateId);
  const cleanUpdates = sanitizeForFirestore({
    isFavorite,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(templateRef, cleanUpdates);
}

export async function updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
  const templateRef = doc(db, 'task_templates', templateId);
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  await updateDoc(templateRef, cleanUpdates);
}

export async function deleteTaskTemplate(templateId: string): Promise<void> {
  const templateRef = doc(db, 'task_templates', templateId);
  await deleteDoc(templateRef);
}

// Delete non-favorite task templates (Favorite templates are NEVER deleted by reset/clear tools)
export async function deleteAllTaskTemplates(userId: string): Promise<void> {
  const templatesRef = collection(db, 'task_templates');
  const q = query(templatesRef, where('userId', '==', userId));
  const snapshot = await new Promise<any>((resolve, reject) => {
    const unsub = onSnapshot(q, (snap) => {
      unsub();
      resolve(snap);
    }, reject);
  });

  const deletePromises: Promise<void>[] = [];
  snapshot.forEach((docSnap: any) => {
    const data = docSnap.data();
    // Protect favorites: DO NOT DELETE if isFavorite is true
    if (!data.isFavorite) {
      deletePromises.push(deleteDoc(doc(db, 'task_templates', docSnap.id)));
    }
  });

  await Promise.all(deletePromises);
}
