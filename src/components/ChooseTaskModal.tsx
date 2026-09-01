import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Star, 
  FilePlus, 
  FolderCheck, 
  Clock, 
  RotateCcw, 
  CalendarCheck2, 
  Copy, 
  Trash2,
  Lock,
  Sparkles,
  Flame,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { PoliceTask, PoliceTaskCategory, PoliceTaskPriority, TaskTemplate } from '../types';
import { POLICE_TASK_CATEGORIES } from '../data/policeTemplates';
import { ConfirmModal } from './ConfirmModal';

interface ChooseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  templates: TaskTemplate[];
  tasksHistory: PoliceTask[];
  onSelectTaskToSchedule: (task: Omit<PoliceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  onSelectTaskToReplicate: (template: TaskTemplate) => void;
  onAddNewTemplate: (template: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onToggleFavorite?: (templateId: string, isFavorite: boolean) => Promise<void>;
  onRestoreDefaults?: () => Promise<void>;
  onDeleteAllTemplates?: () => Promise<void>;
  onCreateNewEntry?: () => void;
}

export const ChooseTaskModal: React.FC<ChooseTaskModalProps> = ({
  isOpen,
  onClose,
  targetDate,
  templates,
  tasksHistory,
  onSelectTaskToSchedule,
  onSelectTaskToReplicate,
  onAddNewTemplate,
  onDeleteTemplate,
  onToggleFavorite,
  onRestoreDefaults,
  onDeleteAllTemplates,
  onCreateNewEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'catalogo' | 'historico'>('catalogo');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // In-app Confirmation Modal States
  const [templateToDelete, setTemplateToDelete] = useState<TaskTemplate | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Simplified creation form state: Title, Description, Priority only
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<PoliceTaskPriority>('alta');
  const [newIsFavorite, setNewIsFavorite] = useState(false);
  const [alsoScheduleDirectly, setAlsoScheduleDirectly] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scheduling state
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  // Extract unique historical tasks
  const uniqueHistoricalTasks = useMemo(() => {
    if (!isOpen) return [];
    const seen = new Set<string>();
    const list: PoliceTask[] = [];

    for (const t of tasksHistory) {
      const key = `${t.title.trim().toLowerCase()}_${t.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(t);
      }
    }
    return list.filter((t) => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.procedureNumber && t.procedureNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'todos' || t.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [isOpen, tasksHistory, searchQuery, selectedCategory]);

  // Favorites count
  const favoritesCount = useMemo(() => {
    return templates.filter((t) => t.isFavorite).length;
  }, [templates]);

  // Filter and sort templates (favorites strictly pinned to the top)
  const filteredTemplates = useMemo(() => {
    const list = templates.filter((t) => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.procedureNumber && t.procedureNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCat = 
        selectedCategory === 'todos' || 
        (selectedCategory === 'favoritos' ? t.isFavorite : t.category === selectedCategory);

      return matchesSearch && matchesCat;
    });

    // Always sort favorites at the top, then alphabetically by title
    return list.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [templates, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  // Formatted date string in PT-BR
  const formattedTargetDate = (() => {
    if (!targetDate) return '';
    const [year, month, day] = targetDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  })();

  const handleScheduleTemplate = async (template: TaskTemplate) => {
    setSchedulingId(template.id);
    try {
      await onSelectTaskToSchedule({
        userId: template.userId,
        title: template.title,
        procedureNumber: template.procedureNumber || '',
        category: template.category || 'outro',
        priority: template.priority || 'media',
        date: targetDate,
        time: template.time || '09:00',
        description: template.description || '',
        notes: '',
      });
      onClose();
    } catch (err) {
      console.error('Error scheduling chosen task:', err);
    } finally {
      setSchedulingId(null);
    }
  };

  const handleScheduleHistorical = async (task: PoliceTask) => {
    setSchedulingId(task.id);
    try {
      await onSelectTaskToSchedule({
        userId: task.userId,
        title: task.title,
        procedureNumber: task.procedureNumber || '',
        category: task.category,
        priority: task.priority,
        date: targetDate,
        time: task.time || '09:00',
        description: task.description || '',
        notes: '',
      });
      onClose();
    } catch (err) {
      console.error('Error scheduling chosen task:', err);
    } finally {
      setSchedulingId(null);
    }
  };

  // Safe delete handler: Favorite templates are strictly protected
  const handleConfirmDeleteSingle = async () => {
    if (!templateToDelete || templateToDelete.isFavorite) return;
    setActionLoading(true);
    try {
      await onDeleteTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRestoreDefaults = async () => {
    if (!onRestoreDefaults) return;
    setActionLoading(true);
    try {
      await onRestoreDefaults();
      setShowRestoreConfirm(false);
    } catch (err) {
      console.error('Erro ao restaurar modelos:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    if (!onDeleteAllTemplates) return;
    setActionLoading(true);
    try {
      await onDeleteAllTemplates();
      setShowDeleteAllConfirm(false);
    } catch (err) {
      console.error('Erro ao limpar modelos:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Simplified creation handler (Title, Description, Priority)
  const handleCreateNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Save to templates catalog with favorite flag
      await onAddNewTemplate({
        userId: '',
        title: newTitle.trim(),
        procedureNumber: '',
        category: 'outro',
        priority: newPriority,
        time: '09:00',
        description: newDescription.trim() || '',
        isFavorite: newIsFavorite,
      });

      // 2. If user chose to schedule on target date immediately
      if (alsoScheduleDirectly) {
        await onSelectTaskToSchedule({
          userId: '',
          title: newTitle.trim(),
          procedureNumber: '',
          category: 'outro',
          priority: newPriority,
          date: targetDate,
          time: '09:00',
          description: newDescription.trim() || '',
          notes: '',
        });
        onClose();
        return;
      }

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewPriority('alta');
      setNewIsFavorite(false);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error adding template / entry:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      {/* 85% Screen Dimensions Container */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-[95vw] lg:w-[85vw] max-w-[85vw] h-[90vh] lg:h-[85vh] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Block 1: Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Catálogo de Procedimentos
                </h3>
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full capitalize">
                  {formattedTargetDate || targetDate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione um modelo oficial, reutilize procedimentos ou cadastre uma nova entrada simplificada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Create entry button inside the modal */}
            <button
              id="btn-choose-modal-create-new"
              type="button"
              onClick={() => {
                if (onCreateNewEntry) {
                  onCreateNewEntry();
                } else {
                  setShowCreateForm(!showCreateForm);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Criar Nova Entrada</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Block 2: Search, Category Filters & Actions Bar */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* View Tabs & Category Filters */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto no-scrollbar">
            <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('catalogo')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'catalogo'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Catálogo ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('historico')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'historico'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tarefas Anteriores ({uniqueHistoricalTasks.length})
              </button>
            </div>

            {/* Favorite Filter Chip */}
            <button
              type="button"
              onClick={() => setSelectedCategory(selectedCategory === 'favoritos' ? 'todos' : 'favoritos')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border shrink-0 ${
                selectedCategory === 'favoritos'
                  ? 'bg-amber-500/30 text-amber-300 border-amber-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${selectedCategory === 'favoritos' ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
              <span>Favoritos ({favoritesCount})</span>
            </button>

            {/* Quick Catalog Reset / Clear Actions */}
            {onRestoreDefaults && (
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(true)}
                title="Restaurar modelos padrão da Polícia Civil (seus favoritos serão mantidos)"
                className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-950 border border-slate-800 rounded-xl transition text-xs flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xl:inline">Restaurar Padrões</span>
              </button>
            )}

            {onDeleteAllTemplates && templates.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(true)}
                title="Limpar modelos comuns (modelos favoritos continuam salvos e protegidos)"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-950 border border-slate-800 rounded-xl transition text-xs flex items-center gap-1 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Limpar Comuns</span>
              </button>
            )}
          </div>
        </div>

        {/* Block 3: Simplified Creation Form (Title, Description, Priority) */}
        {showCreateForm && (
          <form 
            onSubmit={handleCreateNewEntry} 
            className="p-4 bg-slate-950 border-b border-amber-500/30 space-y-3 shrink-0 animate-fadeIn shadow-inner"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <FilePlus className="w-4 h-4" />
                <span>Nova Entrada Simplificada (Título, Descrição e Prioridade)</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Preenchimento rápido e direto para agendamento policial.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* 1. Title */}
              <div className="md:col-span-7">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Título da Entrada / Procedimento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Oitiva de Testemunha / Cumprimento de Mandado / Perícia"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* 2. Priority Selection with Visual Feedback */}
              <div className="md:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Prioridade & Brilho do Card
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewPriority('baixa')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      newPriority === 'baixa'
                        ? 'bg-slate-800 text-slate-200 border-slate-600 ring-1 ring-slate-500'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    Baixa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('media')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      newPriority === 'media'
                        ? 'bg-blue-950 text-blue-300 border-blue-600 ring-1 ring-blue-500 shadow-sm shadow-blue-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-blue-300'
                    }`}
                  >
                    Média
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('alta')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1 ${
                      newPriority === 'alta'
                        ? 'bg-amber-950 text-amber-300 border-amber-500 ring-1 ring-amber-400 shadow-md shadow-amber-950'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Alta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('urgente')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black border transition text-center flex items-center justify-center gap-1 ${
                      newPriority === 'urgente'
                        ? 'bg-rose-950 text-rose-200 border-rose-500 ring-2 ring-rose-400 shadow-lg shadow-rose-950 animate-pulse'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-rose-300'
                    }`}
                  >
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>Urgente</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Descrição / Instruções / Observações
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Roteiro de diligência, dados da testemunha, checklist ou anotações..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={alsoScheduleDirectly}
                    onChange={(e) => setAlsoScheduleDirectly(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400 focus:ring-offset-slate-950"
                  />
                  <span>Agendar imediatamente para <strong className="text-amber-300">{formattedTargetDate}</strong></span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400">
                  <input
                    type="checkbox"
                    checked={newIsFavorite}
                    onChange={(e) => setNewIsFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-400 focus:ring-offset-slate-950"
                  />
                  <span className="flex items-center gap-1 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Marcar como Favorito (sempre no topo e protegido)</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Entrada'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Block 4: Responsive Grid Container (85% Screen View) */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-900">
          {activeTab === 'catalogo' ? (
            filteredTemplates.length === 0 ? (
              <div className="text-center py-16 space-y-3 border border-dashed border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
                <FolderCheck className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-base font-bold text-white">
                  Nenhum modelo encontrado no catálogo
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Crie novos modelos com o botão acima ou restaure os modelos oficiais padrão da Polícia Civil.
                </p>
                {onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar 8 Modelos Padrão</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === template.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];
                  const isScheduling = schedulingId === template.id;

                  return (
                    <div
                      key={template.id}
                      className={`bg-slate-950/80 border rounded-2xl p-4 flex flex-col justify-between transition-all duration-150 relative overflow-hidden group ${
                        template.isFavorite
                          ? 'border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30'
                          : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
                      }`}
                    >
                      {/* Top pinned stripe for favorites */}
                      {template.isFavorite && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                      )}

                      <div>
                        {/* Badges bar */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cat.badgeBg} ${cat.badgeText} ${cat.border}`}>
                              {cat.label}
                            </span>

                            {template.isFavorite && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>Favorito (Protegido)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {template.priority === 'urgente' ? (
                              <span className="text-[10px] uppercase font-black text-rose-200 bg-rose-950/80 border border-rose-600/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Flame className="w-3 h-3 text-rose-400" />
                                <span>Urgente</span>
                              </span>
                            ) : template.priority === 'alta' ? (
                              <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/60 border border-amber-600/60 px-1.5 py-0.5 rounded">
                                Alta
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {template.priority}
                              </span>
                            )}

                            {/* Favorite Toggle Button */}
                            {onToggleFavorite && (
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(template.id, !template.isFavorite)}
                                title={template.isFavorite ? 'Favorito fixado no topo (protegido)' : 'Marcar como favorito (fixa no topo e protege)'}
                                className={`p-1 rounded-lg transition border ${
                                  template.isFavorite
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30'
                                    : 'text-slate-500 hover:text-amber-400 bg-slate-900 hover:bg-slate-800 border-slate-800'
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${template.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Procedure */}
                        <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                          {template.title}
                        </h4>

                        {template.procedureNumber && (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/90 font-medium mb-2">
                            <FolderCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{template.procedureNumber}</span>
                          </div>
                        )}

                        {/* Description */}
                        {template.description && (
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                            {template.description}
                          </p>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onSelectTaskToReplicate(template)}
                          title="Replicar este modelo em múltiplos dias"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Replicar</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleScheduleTemplate(template)}
                            disabled={isScheduling}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                          >
                            <CalendarCheck2 className="w-3.5 h-3.5" />
                            <span>{isScheduling ? 'Agendando...' : 'Agendar'}</span>
                          </button>

                          {/* Protected Favorites cannot be deleted */}
                          {template.isFavorite ? (
                            <span 
                              title="Modelo favorito protegido contra exclusão acidental"
                              className="p-1.5 text-amber-400/70 bg-amber-950/40 border border-amber-500/20 rounded-lg cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTemplateToDelete(template)}
                              title="Excluir modelo do catálogo"
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            uniqueHistoricalTasks.length === 0 ? (
              <div className="text-center py-16 space-y-3 border border-dashed border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
                <Clock className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-base font-bold text-white">
                  Nenhuma tarefa anterior encontrada
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  As tarefas que você agendar no cronograma ficarão salvas para reutilização ágil a qualquer momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {uniqueHistoricalTasks.map((t) => {
                  const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === t.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];
                  const isScheduling = schedulingId === t.id;

                  return (
                    <div
                      key={t.id}
                      className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1.5 mb-2.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${cat.badgeBg} ${cat.badgeText} ${cat.border}`}>
                            {cat.label}
                          </span>

                          {t.time && (
                            <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {t.time}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">
                          {t.title}
                        </h4>

                        {t.procedureNumber && (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/90 font-medium mb-2">
                            <FolderCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{t.procedureNumber}</span>
                          </div>
                        )}

                        {t.description && (
                          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                            {t.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleScheduleHistorical(t)}
                          disabled={isScheduling}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5" />
                          <span>{isScheduling ? 'Agendando...' : 'Reutilizar'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Block 5: Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            Selecione qualquer procedimento do catálogo para agendar no dia <strong className="text-amber-300">{formattedTargetDate || targetDate}</strong> ou marque com estrela para fixar no topo e proteger contra exclusão.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition ml-auto"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Confirmation Modal 1: Delete Single Template */}
      <ConfirmModal
        isOpen={Boolean(templateToDelete)}
        title="Excluir Modelo do Catálogo"
        description={`Deseja realmente remover o modelo "${templateToDelete?.title}" do catálogo de procedimentos da delegacia?`}
        confirmLabel="Sim, Excluir Modelo"
        cancelLabel="Cancelar"
        variant="danger"
        iconType="trash"
        isLoading={actionLoading}
        onConfirm={handleConfirmDeleteSingle}
        onClose={() => setTemplateToDelete(null)}
      />

      {/* Confirmation Modal 2: Restore Defaults */}
      <ConfirmModal
        isOpen={showRestoreConfirm}
        title="Restaurar Catálogo Padrão"
        description="Deseja restaurar os modelos oficiais de procedimentos da Polícia Civil (Oitivas, Mandados, Inquéritos, Audiências)? Seus modelos marcados como favoritos permanecerão salvos e protegidos."
        confirmLabel="Sim, Restaurar Modelos"
        cancelLabel="Cancelar"
        variant="primary"
        iconType="restore"
        isLoading={actionLoading}
        onConfirm={handleConfirmRestoreDefaults}
        onClose={() => setShowRestoreConfirm(false)}
      />

      {/* Confirmation Modal 3: Delete Non-Favorite Templates */}
      <ConfirmModal
        isOpen={showDeleteAllConfirm}
        title="Limpar Modelos Não Favoritados"
        description="Atenção: Esta ação excluirá os modelos não favoritados. Seus modelos marcados como favoritos (⭐) estão protegidos e permanecerão salvos no catálogo. Deseja prosseguir?"
        confirmLabel="Sim, Limpar Modelos Comuns"
        cancelLabel="Cancelar"
        variant="danger"
        iconType="warning"
        isLoading={actionLoading}
        onConfirm={handleConfirmDeleteAll}
        onClose={() => setShowDeleteAllConfirm(false)}
      />
    </div>
  );
};
