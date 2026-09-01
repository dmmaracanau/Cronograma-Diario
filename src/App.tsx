import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  auth, 
  subscribeToTasks, 
  subscribeToUserProfile,
  subscribeToTaskTemplates,
  addTaskTemplate,
  deleteTaskTemplate,
  deleteAllTaskTemplates,
  replicateTaskToDates,
  addPoliceTask,
  updatePoliceTask,
  deletePoliceTask,
  AppUser
} from './lib/firebase';
import { PoliceTask, PoliceTaskStatus, UserProfile, ViewMode, TaskTemplate } from './types';
import { DEFAULT_TASK_TEMPLATES } from './data/policeTemplates';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { DailyView } from './components/DailyView';
import { WeeklyView } from './components/WeeklyView';
import { MonthlyView } from './components/MonthlyView';
import { TableView } from './components/TableView';
import { ProductivityReports } from './components/ProductivityReports';
import { TaskModal } from './components/TaskModal';
import { StatusChangeModal } from './components/StatusChangeModal';
import { ChooseTaskModal } from './components/ChooseTaskModal';
import { ReplicateTaskModal } from './components/ReplicateTaskModal';
import confetti from 'canvas-confetti';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Real-time tasks & templates state
  const [tasks, setTasks] = useState<PoliceTask[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // App Navigation & Selected Date - Default to 'semanal'
  const [activeView, setActiveView] = useState<ViewMode>('semanal');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PoliceTask | null>(null);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string>(selectedDate);

  // Choose Task Modal state
  const [isChooseModalOpen, setIsChooseModalOpen] = useState(false);
  const [chooseModalTargetDate, setChooseModalTargetDate] = useState<string>(selectedDate);

  // Replicate Task Modal state
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [taskToReplicate, setTaskToReplicate] = useState<PoliceTask | TaskTemplate | null>(null);

  const [statusModalState, setStatusModalState] = useState<{
    isOpen: boolean;
    task: PoliceTask | null;
    targetStatus: PoliceTaskStatus | null;
  }>({
    isOpen: false,
    task: null,
    targetStatus: null,
  });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen to User Profile, Tasks & Templates from Firestore
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setTasks([]);
      setTemplates([]);
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);

    const unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
      if (profile) {
        setUserProfile(profile);
      } else {
        // Fallback profile if none stored in firestore
        setUserProfile({
          userId: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Servidor Policial',
          email: user.email || '',
          badge: '300.' + user.uid.substring(0, 3).toUpperCase() + '-1-A',
          role: 'Servidor Policial',
          department: '1ª Delegacia de Polícia de Maracanaú',
          createdAt: new Date().toISOString(),
        });
      }
    });

    const unsubscribeTasks = subscribeToTasks(user.uid, (syncedTasks) => {
      setTasks(syncedTasks);
      setTasksLoading(false);
    });

    const unsubscribeTemplates = subscribeToTaskTemplates(user.uid, async (syncedTemplates) => {
      setTemplates(syncedTemplates);

      // Check if this user account has ever initialized default templates
      const seedKey = `pcce_catalog_initialized_${user.uid}`;
      const hasSeededLocally = localStorage.getItem(seedKey);

      if (!hasSeededLocally && syncedTemplates.length === 0) {
        localStorage.setItem(seedKey, 'true');
        for (const t of DEFAULT_TASK_TEMPLATES) {
          await addTaskTemplate({
            userId: user.uid,
            title: t.title,
            procedureNumber: t.procedureNumber || '',
            category: t.category,
            priority: t.priority,
            description: t.description || '',
            time: '09:00',
          });
        }
      } else if (!hasSeededLocally && syncedTemplates.length > 0) {
        localStorage.setItem(seedKey, 'true');
      }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeTasks();
      unsubscribeTemplates();
    };
  }, [user]);

  // Open Task Creation Modal
  const handleOpenAddTask = (date?: string) => {
    setEditingTask(null);
    setTaskModalDefaultDate(date || selectedDate);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: PoliceTask) => {
    setEditingTask(task);
    setTaskModalDefaultDate(task.date);
    setIsTaskModalOpen(true);
  };

  // Open Choose Task Modal
  const handleOpenChooseTask = (date: string) => {
    setChooseModalTargetDate(date || selectedDate);
    setIsChooseModalOpen(true);
  };

  // Open Replicate Modal for a task
  const handleOpenReplicateTask = (task: PoliceTask | TaskTemplate) => {
    setTaskToReplicate(task);
    setIsReplicateModalOpen(true);
  };

  // Save Task (Create or Update), optionally saving as catalog template
  const handleSaveTask = async (taskData: Partial<PoliceTask>, saveAsTemplate?: boolean) => {
    if (!user) return;

    if (editingTask) {
      await updatePoliceTask(editingTask.id, taskData);
    } else {
      await addPoliceTask({
        userId: user.uid,
        title: taskData.title || 'Novo Procedimento',
        procedureNumber: taskData.procedureNumber || '',
        category: taskData.category || 'oitiva',
        priority: taskData.priority || 'alta',
        date: taskData.date || selectedDate,
        time: taskData.time || '09:00',
        status: taskData.status || 'pendente',
        description: taskData.description || '',
        notes: taskData.notes || '',
        rescheduledTo: taskData.rescheduledTo,
        reason: taskData.reason,
        completedAt: taskData.completedAt,
      });
    }

    if (saveAsTemplate && taskData.title) {
      await addTaskTemplate({
        userId: user.uid,
        title: taskData.title,
        procedureNumber: taskData.procedureNumber || '',
        category: taskData.category || 'oitiva',
        priority: taskData.priority || 'alta',
        time: taskData.time || '09:00',
        description: taskData.description || '',
      });
    }
  };

  // Add a task chosen from the catalog to the calendar
  const handleScheduleFromCatalog = async (
    taskData: Omit<PoliceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (!user) return;
    await addPoliceTask({
      userId: user.uid,
      title: taskData.title,
      procedureNumber: taskData.procedureNumber || '',
      category: taskData.category,
      priority: taskData.priority,
      date: taskData.date,
      time: taskData.time || '09:00',
      status: 'pendente',
      description: taskData.description || '',
      notes: taskData.notes || '',
    });
  };

  // Replicate task to selected dates
  const handleExecuteReplication = async (dates: string[], customTime?: string) => {
    if (!user || !taskToReplicate) return;
    await replicateTaskToDates(
      {
        title: taskToReplicate.title,
        procedureNumber: taskToReplicate.procedureNumber || '',
        category: taskToReplicate.category,
        priority: taskToReplicate.priority,
        time: customTime || taskToReplicate.time || '09:00',
        description: taskToReplicate.description || '',
        notes: taskToReplicate.notes || '',
      },
      dates,
      user.uid
    );

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#3b82f6', '#10b981'],
      });
    } catch (_) {}
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    await deletePoliceTask(taskId);
  };

  // Quick Status Transition Handler
  const handleQuickStatus = async (task: PoliceTask, targetStatus: PoliceTaskStatus) => {
    // If status is 'remarcada' or 'nao_feita', open helper modal for dates/reasons
    if (targetStatus === 'remarcada' || targetStatus === 'nao_feita') {
      setStatusModalState({
        isOpen: true,
        task,
        targetStatus,
      });
      return;
    }

    // Direct transition for 'concluida', 'em_andamento', 'pendente', 'cancelada'
    if (targetStatus === 'concluida') {
      try {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch (_) {}

      await updatePoliceTask(task.id, {
        status: 'concluida',
        completedAt: new Date().toISOString(),
      });
    } else {
      await updatePoliceTask(task.id, {
        status: targetStatus,
      });
    }
  };

  // Switch to Daily View for a specific day
  const handleSelectDayView = (date: string) => {
    setSelectedDate(date);
    setActiveView('diario');
  };

  // If Auth checking
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Carregando 1ª DP de Maracanaú...
        </div>
      </div>
    );
  }

  // If not logged in
  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === 'concluida').length;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <Header
        userProfile={userProfile}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedDate={selectedDate}
        totalTasksCount={totalTasksCount}
        completedTasksCount={completedTasksCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 py-4">
        {activeView === 'diario' && (
          <DailyView
            tasks={tasks}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddTask={handleOpenAddTask}
            onChooseTask={handleOpenChooseTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatus={handleQuickStatus}
            onReplicateTask={handleOpenReplicateTask}
            onPrintDocket={() => setActiveView('relatorios')}
            onSelectWeeklyView={() => setActiveView('semanal')}
          />
        )}

        {activeView === 'semanal' && (
          <WeeklyView
            tasks={tasks}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddTask={handleOpenAddTask}
            onChooseTask={handleOpenChooseTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatus={handleQuickStatus}
            onReplicateTask={handleOpenReplicateTask}
            onSelectDayView={handleSelectDayView}
          />
        )}

        {activeView === 'mensal' && (
          <MonthlyView
            tasks={tasks}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onAddTask={handleOpenAddTask}
            onChooseTask={handleOpenChooseTask}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatus={handleQuickStatus}
            onReplicateTask={handleOpenReplicateTask}
            onSelectDayView={handleSelectDayView}
          />
        )}

        {activeView === 'tabela' && (
          <TableView
            tasks={tasks}
            onAddTask={() => handleOpenAddTask(selectedDate)}
            onEditTask={handleOpenEditTask}
            onDeleteTask={handleDeleteTask}
            onQuickStatus={handleQuickStatus}
            onReplicateTask={handleOpenReplicateTask}
          />
        )}

        {activeView === 'relatorios' && (
          <ProductivityReports
            tasks={tasks}
            selectedDate={selectedDate}
            userProfile={userProfile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>1ª Delegacia de Polícia de Maracanaú • Polícia Civil do Estado do Ceará (PCCE)</span>
          <span className="text-[11px] text-slate-400">Banco de Dados em Tempo Real • Firestore</span>
        </div>
      </footer>

      {/* Task Create/Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onOpenReplicate={(taskPartial) => {
          setTaskToReplicate({
            id: 'temp',
            userId: user.uid,
            title: taskPartial.title || '',
            procedureNumber: taskPartial.procedureNumber || '',
            category: taskPartial.category || 'oitiva',
            priority: taskPartial.priority || 'alta',
            date: taskPartial.date || selectedDate,
            time: taskPartial.time || '09:00',
            status: 'pendente',
            description: taskPartial.description || '',
            notes: taskPartial.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          setIsReplicateModalOpen(true);
        }}
        initialData={editingTask}
        defaultDate={taskModalDefaultDate}
      />

      {/* Choose Task from Database Catalog Modal */}
      <ChooseTaskModal
        isOpen={isChooseModalOpen}
        onClose={() => setIsChooseModalOpen(false)}
        targetDate={chooseModalTargetDate}
        templates={templates}
        tasksHistory={tasks}
        onSelectTaskToSchedule={handleScheduleFromCatalog}
        onSelectTaskToReplicate={(t) => {
          setTaskToReplicate(t);
          setIsChooseModalOpen(false);
          setIsReplicateModalOpen(true);
        }}
        onAddNewTemplate={async (templateData) => {
          if (!user) return;
          await addTaskTemplate({
            ...templateData,
            userId: user.uid,
          });
        }}
        onDeleteTemplate={async (templateId) => {
          await deleteTaskTemplate(templateId);
        }}
        onRestoreDefaults={async () => {
          if (!user) return;
          for (const t of DEFAULT_TASK_TEMPLATES) {
            await addTaskTemplate({
              userId: user.uid,
              title: t.title,
              procedureNumber: t.procedureNumber || '',
              category: t.category,
              priority: t.priority,
              description: t.description || '',
              time: '09:00',
            });
          }
        }}
        onDeleteAllTemplates={async () => {
          if (!user) return;
          await deleteAllTaskTemplates(user.uid);
        }}
      />

      {/* Replicate Task across Multiple Dates Modal */}
      <ReplicateTaskModal
        isOpen={isReplicateModalOpen}
        onClose={() => {
          setIsReplicateModalOpen(false);
          setTaskToReplicate(null);
        }}
        task={taskToReplicate}
        currentSelectedDate={selectedDate}
        onReplicate={handleExecuteReplication}
      />

      {/* Status Change Modal (for Remarcar & Justificativa de Não Feita) */}
      <StatusChangeModal
        isOpen={statusModalState.isOpen}
        onClose={() => setStatusModalState({ isOpen: false, task: null, targetStatus: null })}
        task={statusModalState.task}
        targetStatus={statusModalState.targetStatus}
        onConfirm={async (taskId, updates) => {
          await updatePoliceTask(taskId, updates);
        }}
      />
    </div>
  );
}
