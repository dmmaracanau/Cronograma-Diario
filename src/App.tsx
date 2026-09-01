import React, { useState, useEffect, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  auth, 
  subscribeToTasks, 
  subscribeToUserProfile,
  subscribeToTaskTemplates,
  addTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  deleteAllTaskTemplates,
  toggleTaskTemplateFavorite,
  replicateTaskToDates,
  addPoliceTask,
  updatePoliceTask,
  deletePoliceTask,
  batchDeletePoliceTasks,
  batchUpdatePoliceTasks,
  AppUser
} from './lib/firebase';
import { 
  CheckSquare, 
  Trash2, 
  CheckCircle2, 
  X, 
  CheckCheck, 
  AlertTriangle 
} from 'lucide-react';
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
import { ConfirmModal } from './components/ConfirmModal';
import { PdfExportModal } from './components/PdfExportModal';
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

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBatchTaskIds, setSelectedBatchTaskIds] = useState<string[]>([]);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Modals state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PoliceTask | null>(null);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string>(selectedDate);

  // Choose Task Modal state
  const [isChooseModalOpen, setIsChooseModalOpen] = useState(false);
  const [chooseModalTargetDate, setChooseModalTargetDate] = useState<string>(selectedDate);
  const [returnToCatalogAfterTaskModal, setReturnToCatalogAfterTaskModal] = useState(false);

  // Replicate Task Modal state
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [taskToReplicate, setTaskToReplicate] = useState<PoliceTask | TaskTemplate | null>(null);

  // Task deletion confirmation state
  const [taskToDelete, setTaskToDelete] = useState<PoliceTask | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

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
    setReturnToCatalogAfterTaskModal(false);
    setEditingTask(null);
    setTaskModalDefaultDate(date || selectedDate);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: PoliceTask) => {
    setReturnToCatalogAfterTaskModal(false);
    setEditingTask(task);
    setTaskModalDefaultDate(task.date);
    setIsTaskModalOpen(true);
  };

  // Close Task Modal (returns to Catalog if opened from it)
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    if (returnToCatalogAfterTaskModal) {
      setIsChooseModalOpen(true);
      setReturnToCatalogAfterTaskModal(false);
    }
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

  // Save Task (Create or Update), automatically saving into catalog database as well
  const handleSaveTask = async (taskData: Partial<PoliceTask>, isFavorite?: boolean) => {
    if (!user) return;

    if (editingTask) {
      await updatePoliceTask(editingTask.id, taskData);
    } else {
      await addPoliceTask({
        userId: user.uid,
        title: taskData.title || 'Novo Procedimento',
        procedureNumber: taskData.procedureNumber || '',
        category: taskData.category || 'outro',
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

    // Toda entrada já é salva no catálogo por padrão
    if (taskData.title && taskData.title.trim()) {
      const cleanTitle = taskData.title.trim();
      const existingTpl = templates.find((t) => t.title.toLowerCase().trim() === cleanTitle.toLowerCase());
      if (existingTpl) {
        await updateTaskTemplate(existingTpl.id, {
          priority: taskData.priority || existingTpl.priority,
          description: taskData.description !== undefined ? taskData.description : existingTpl.description,
          isFavorite: isFavorite !== undefined ? isFavorite : existingTpl.isFavorite,
        });
      } else {
        await addTaskTemplate({
          userId: user.uid,
          title: cleanTitle,
          procedureNumber: taskData.procedureNumber || '',
          category: taskData.category || 'outro',
          priority: taskData.priority || 'alta',
          time: taskData.time || '09:00',
          description: taskData.description || '',
          isFavorite: Boolean(isFavorite),
        });
      }
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

  // Delete Task with in-app confirmation
  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      await deletePoliceTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setIsDeletingTask(false);
    }
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

  // Move / Reschedule / Reorder Task handler (Drag and Drop)
  const handleMoveTask = async (taskId: string, targetDate: string, targetIndex?: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.date === targetDate && targetIndex !== undefined) {
      // Reordering within the same day
      const dayTasks = tasks.filter((t) => t.date === targetDate && t.id !== taskId);
      dayTasks.splice(targetIndex, 0, task);
      for (let i = 0; i < dayTasks.length; i++) {
        await updatePoliceTask(dayTasks[i].id, { order: i });
      }
    } else {
      // Moving / Rescheduling to a different day
      const dayTasks = tasks.filter((t) => t.date === targetDate && t.id !== taskId);
      const newOrder = targetIndex !== undefined ? targetIndex : dayTasks.length;
      await updatePoliceTask(taskId, {
        date: targetDate,
        order: newOrder,
      });

      if (targetIndex !== undefined) {
        dayTasks.splice(targetIndex, 0, task);
        for (let i = 0; i < dayTasks.length; i++) {
          await updatePoliceTask(dayTasks[i].id, { order: i });
        }
      }
    }
  };

  // Switch to Daily View for a specific day
  const handleSelectDayView = (date: string) => {
    setSelectedDate(date);
    setActiveView('diario');
  };

  // Toggle Batch Mode
  const handleToggleBatchMode = () => {
    setIsBatchMode((prev) => {
      if (prev) {
        setSelectedBatchTaskIds([]);
      }
      return !prev;
    });
  };

  // Toggle individual task selection in batch mode
  const handleToggleSelectTask = (taskId: string) => {
    setSelectedBatchTaskIds((prev) => 
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  // Select all tasks visible in current view/day
  const handleSelectAllBatch = () => {
    if (activeView === 'diario') {
      const dayTaskIds = tasks.filter((t) => t.date === selectedDate).map((t) => t.id);
      setSelectedBatchTaskIds(dayTaskIds);
    } else {
      setSelectedBatchTaskIds(tasks.map((t) => t.id));
    }
  };

  // Deselect all
  const handleDeselectAllBatch = () => {
    setSelectedBatchTaskIds([]);
  };

  // Execute Batch Delete
  const handleConfirmBatchDelete = async () => {
    if (selectedBatchTaskIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      await batchDeletePoliceTasks(selectedBatchTaskIds);
      setSelectedBatchTaskIds([]);
      setIsBatchDeleteModalOpen(false);
      setIsBatchMode(false);
    } catch (err) {
      console.error('Error batch deleting tasks:', err);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Execute Batch Complete
  const handleBatchComplete = async () => {
    if (selectedBatchTaskIds.length === 0) return;
    try {
      await batchUpdatePoliceTasks(selectedBatchTaskIds, {
        status: 'concluida',
        completedAt: new Date().toISOString(),
      });
      try {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch (_) {}
      setSelectedBatchTaskIds([]);
      setIsBatchMode(false);
    } catch (err) {
      console.error('Error batch updating tasks:', err);
    }
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

  // Procedure and completion count taking strictly the selected day into consideration
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const totalTasksCount = dayTasks.length;
  const completedTasksCount = dayTasks.filter((t) => t.status === 'concluida').length;

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
        isBatchMode={isBatchMode}
        onToggleBatchMode={handleToggleBatchMode}
        selectedBatchCount={selectedBatchTaskIds.length}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
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
            onMoveTask={handleMoveTask}
            isBatchMode={isBatchMode}
            selectedBatchTaskIds={selectedBatchTaskIds}
            onToggleSelectTask={handleToggleSelectTask}
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
            onMoveTask={handleMoveTask}
            isBatchMode={isBatchMode}
            selectedBatchTaskIds={selectedBatchTaskIds}
            onToggleSelectTask={handleToggleSelectTask}
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
            onMoveTask={handleMoveTask}
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

      {/* Floating Batch Actions Bar */}
      {isBatchMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="bg-slate-900/95 border border-rose-500/50 backdrop-blur-md rounded-2xl p-3.5 shadow-2xl shadow-rose-950/60 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Modo de Edição em Lote
                </span>
                <span className="text-rose-400 font-semibold">
                  {selectedBatchTaskIds.length} {selectedBatchTaskIds.length === 1 ? 'procedimento selecionado' : 'procedimentos selecionados'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllBatch}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Selecionar Todos
              </button>

              {selectedBatchTaskIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAllBatch}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Limpar
                </button>
              )}

              {selectedBatchTaskIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBatchComplete}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
                  title="Marcar todos os selecionados como concluídos"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir ({selectedBatchTaskIds.length})</span>
                </button>
              )}

              <button
                type="button"
                disabled={selectedBatchTaskIds.length === 0}
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                  selectedBatchTaskIds.length > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
                title="Excluir procedimentos selecionados"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir ({selectedBatchTaskIds.length})</span>
              </button>

              <button
                type="button"
                onClick={handleToggleBatchMode}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
                title="Sair do Modo Lote"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title="Excluir Procedimentos em Lote"
        description={`Deseja realmente excluir permanentemente os ${selectedBatchTaskIds.length} procedimentos selecionados? Esta ação apagará todos os registros selecionados de uma só vez e não poderá ser desfeita.`}
        confirmLabel={`Sim, Excluir ${selectedBatchTaskIds.length} Registros`}
        cancelLabel="Cancelar"
        variant="danger"
        iconType="trash"
        isLoading={isBatchDeleting}
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />

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
        onClose={handleCloseTaskModal}
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
        isFavoriteInitial={
          editingTask
            ? templates.some(
                (t) =>
                  t.title.toLowerCase().trim() === editingTask.title.toLowerCase().trim() &&
                  t.isFavorite
              )
            : false
        }
      />

      {/* Choose Task from Database Catalog Modal */}
      <ChooseTaskModal
        isOpen={isChooseModalOpen}
        onClose={() => {
          setIsChooseModalOpen(false);
          setReturnToCatalogAfterTaskModal(false);
        }}
        targetDate={chooseModalTargetDate}
        templates={templates}
        tasksHistory={tasks}
        onCreateNewEntry={() => {
          setReturnToCatalogAfterTaskModal(true);
          setIsChooseModalOpen(false);
          setEditingTask(null);
          setTaskModalDefaultDate(chooseModalTargetDate || selectedDate);
          setIsTaskModalOpen(true);
        }}
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
        onToggleFavorite={async (templateId, isFavorite) => {
          await toggleTaskTemplateFavorite(templateId, isFavorite);
        }}
        onRestoreDefaults={async () => {
          if (!user) return;
          for (const t of DEFAULT_TASK_TEMPLATES) {
            const alreadyExists = templates.some(
              (existing) => existing.title.trim().toLowerCase() === t.title.trim().toLowerCase()
            );
            if (!alreadyExists) {
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

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        tasks={tasks}
        selectedDate={selectedDate}
        userProfile={userProfile}
      />

      {/* In-app Confirmation Modal for Task Deletions (Never blocked by iframe) */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Excluir Agendamento Policial"
        description={`Deseja realmente remover o agendamento "${taskToDelete?.title}" marcado para ${taskToDelete?.date} às ${taskToDelete?.time || '09:00'}?`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        iconType="trash"
        isLoading={isDeletingTask}
        onConfirm={handleConfirmDeleteTask}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}
