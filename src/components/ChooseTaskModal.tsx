import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Calendar, 
  Clock, 
  FolderCheck, 
  Copy, 
  Trash2, 
  Bookmark,
  CalendarCheck2,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  FilePlus,
  Check,
  Star
} from 'lucide-react';
import { PoliceTask, TaskTemplate, PoliceTaskCategory, PoliceTaskPriority } from '../types';
import { POLICE_TASK_CATEGORIES } from '../data/policeTemplates';
import { ConfirmModal } from './ConfirmModal';

interface ChooseTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  templates: TaskTemplate[];
  tasksHistory: PoliceTask[];
  onSelectTaskToSchedule: (taskData: Omit<PoliceTask, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  onSelectTaskToReplicate: (task: TaskTemplate | PoliceTask) => void;
  onAddNewTemplate: (templateData: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onToggleFavorite?: (templateId: string, isFavorite: boolean) => Promise<void>;
  onRestoreDefaults?: () => Promise<void>;
  onDeleteAllTemplates?: () => Promise<void>;
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'catalogo' | 'historico'>('catalogo');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // In-app Confirmation Modal States (never blocked by iframes)
  const [templateToDelete, setTemplateToDelete] = useState<TaskTemplate | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New entry / template form state
  const [newTitle, setNewTitle] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  const [newCategory, setNewCategory] = useState<PoliceTaskCategory>('oitiva');
  const [newPriority, setNewPriority] = useState<PoliceTaskPriority>('alta');
  const [newTime, setNewTime] = useState('09:00');
  const [newDescription, setNewDescription] = useState('');
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

  // Filter and sort templates (favorites pinned to the top)
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

  const handleScheduleTemplate = async (template: TaskTemplate | PoliceTask) => {
    setSchedulingId(template.id);
    try {
      await onSelectTaskToSchedule({
        userId: template.userId,
        title: template.title,
        procedureNumber: template.procedureNumber || '',
        category: template.category,
        priority: template.priority,
        date: targetDate,
        time: template.time || '09:00',
        description: template.description || '',
        notes: template.notes || '',
      });
      onClose();
    } catch (err) {
      console.error('Error scheduling chosen task:', err);
    } finally {
      setSchedulingId(null);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!templateToDelete) return;
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

  const handleCreateNewEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Save to templates catalog with favorite flag
      await onAddNewTemplate({
        userId: '',
        title: newTitle.trim(),
        procedureNumber: newProcedure.trim() || '',
        category: newCategory,
        priority: newPriority,
        time: newTime || '09:00',
        description: newDescription.trim() || '',
        isFavorite: newIsFavorite,
      });

      // 2. If user chose to schedule on target date immediately
      if (alsoScheduleDirectly) {
        await onSelectTaskToSchedule({
          userId: '',
          title: newTitle.trim(),
          procedureNumber: newProcedure.trim() || '',
          category: newCategory,
          priority: newPriority,
          date: targetDate,
          time: newTime || '09:00',
          description: newDescription.trim() || '',
          notes: '',
        });
        onClose();
        return;
      }

      // Reset form
      setNewTitle('');
      setNewProcedure('');
      setNewDescription('');
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
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Catálogo de Procedimentos e Modelos
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                  PCCE • 1ª DP
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Dia selecionado para agendamento:</span>
                <strong className="text-amber-300 capitalize">{formattedTargetDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Create New Entry Button */}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                showCreateForm
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
            >
              {showCreateForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Fechar Formulário</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Criar Nova Entrada / Modelo</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700"
              title="Fechar Catálogo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Block 2: Sub-Bar (Search, Filter Categories & Tabs) */}
        <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 space-y-2.5 shrink-0">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar modelo por título, nº do procedimento ou roteiro..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* View Tabs (Modelos vs Histórico) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'catalogo'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Modelos Salvos ({filteredTemplates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('historico')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'historico'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Histórico de Tarefas ({uniqueHistoricalTasks.length})</span>
              </button>
            </div>

            {/* Management Actions */}
            {activeTab === 'catalogo' && (
              <div className="flex items-center gap-2 text-xs">
                {onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={actionLoading}
                    title="Restaurar os modelos padrão da Polícia Civil"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Restaurar Padrões</span>
                  </button>
                )}
                {onDeleteAllTemplates && templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllConfirm(true)}
                    disabled={actionLoading}
                    title="Limpar todos os modelos salvos"
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category & Favorites Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                selectedCategory === 'todos'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todas as Categorias
            </button>

            {/* Favorite Filter Chip */}
            <button
              onClick={() => setSelectedCategory('favoritos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap flex items-center gap-1 border ${
                selectedCategory === 'favoritos'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                  : 'bg-slate-900 text-amber-400 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <Star className="w-3 h-3 fill-amber-400" />
              <span>Favoritos ({favoritesCount})</span>
            </button>

            {POLICE_TASK_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap border ${
                  selectedCategory === c.id
                    ? `${c.badgeBg} ${c.badgeText} ${c.border} ring-1 ring-amber-400/40`
                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Block 3: Inline Creation Form (When Toggled) */}
        {showCreateForm && (
          <form 
            onSubmit={handleCreateNewEntry} 
            className="p-5 bg-slate-950 border-b border-amber-500/30 space-y-3.5 shrink-0 animate-fadeIn shadow-inner"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <FilePlus className="w-4 h-4" />
                <span>Criar Nova Entrada de Procedimento / Novo Modelo no Catálogo</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Os dados serão salvos no banco de dados da delegacia.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Título da Entrada / Procedimento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Oitiva de Testemunha / Cumprimento de Mandado"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="md:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nº do Procedimento / Inquérito (Opcional)
                </label>
                <input
                  type="text"
                  value={newProcedure}
                  onChange={(e) => setNewProcedure(e.target.value)}
                  placeholder="Ex: IP nº 123-456/2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PoliceTaskCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {POLICE_TASK_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Prioridade
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PoliceTaskPriority)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Horário Padrão
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Descrição & Roteiro de Instrução
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Detalhes, testemunhas, roteiro ou checklist do procedimento..."
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
                    <span>Marcar como Favorito (sempre no topo)</span>
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
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Entrada / Modelo'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Block 4: Multi-Column Catalog Cards Grid (Filling 85% screen space) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 no-scrollbar">
          {activeTab === 'catalogo' ? (
            filteredTemplates.length === 0 ? (
              <div className="text-center py-16 space-y-3 border border-dashed border-slate-800 rounded-2xl p-8 max-w-xl mx-auto">
                <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
                <div className="text-base font-bold text-white">
                  Nenhum modelo encontrado no catálogo
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você pode criar uma nova entrada/modelo com o botão acima ou restaurar o catálogo padrão de procedimentos da Polícia Civil.
                </p>
                {onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={() => setShowRestoreConfirm(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 mt-2"
                  >
                    <Sparkles className="w-4 h-4" />
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
                          ? 'border-amber-500/50 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/20'
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
                                <span>Favorito</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {template.time && (
                              <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {template.time}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {template.priority}
                            </span>

                            {/* Favorite Toggle Button */}
                            {onToggleFavorite && (
                              <button
                                type="button"
                                onClick={() => onToggleFavorite(template.id, !template.isFavorite)}
                                title={template.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito (fixa no topo)'}
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

                          <button
                            type="button"
                            onClick={() => setTemplateToDelete(template)}
                            title="Excluir modelo do catálogo"
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

                        <h4 className="text-sm font-bold text-white mb-1.5">{t.title}</h4>

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

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => onSelectTaskToReplicate(t)}
                          title="Replicar em vários dias"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Replicar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleScheduleTemplate(t)}
                          disabled={isScheduling}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                        >
                          <CalendarCheck2 className="w-3.5 h-3.5" />
                          <span>{isScheduling ? 'Agendando...' : 'Agendar'}</span>
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
            Selecione qualquer procedimento do catálogo para agendar no dia <strong className="text-amber-300">{targetDate}</strong> ou marque com estrela para fixar no topo.
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
        description="Deseja restaurar os modelos oficiais de procedimentos da Polícia Civil (Oitivas, Mandados, Inquéritos, Audiências)? Seus modelos criados serão preservados."
        confirmLabel="Sim, Restaurar Modelos"
        cancelLabel="Cancelar"
        variant="primary"
        iconType="restore"
        isLoading={actionLoading}
        onConfirm={handleConfirmRestoreDefaults}
        onClose={() => setShowRestoreConfirm(false)}
      />

      {/* Confirmation Modal 3: Delete All Templates */}
      <ConfirmModal
        isOpen={showDeleteAllConfirm}
        title="Limpar Todo o Catálogo"
        description="Atenção: Esta ação excluirá permanentemente todos os modelos salvos no banco de dados. Deseja prosseguir?"
        confirmLabel="Sim, Limpar Catálogo"
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
