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
  Edit3, 
  Check, 
  Layers, 
  Tag, 
  Shield, 
  Bookmark,
  CalendarCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PoliceTask, TaskTemplate, PoliceTaskCategory, PoliceTaskPriority } from '../types';
import { POLICE_TASK_CATEGORIES } from '../data/policeTemplates';

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
  onRestoreDefaults,
  onDeleteAllTemplates,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'catalogo' | 'historico'>('catalogo');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // New Template form state
  const [newTitle, setNewTitle] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  const [newCategory, setNewCategory] = useState<PoliceTaskCategory>('oitiva');
  const [newPriority, setNewPriority] = useState<PoliceTaskPriority>('alta');
  const [newTime, setNewTime] = useState('09:00');
  const [newDescription, setNewDescription] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Scheduling state
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  // Extract unique historical tasks by title & category
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

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.procedureNumber && t.procedureNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCat = selectedCategory === 'todos' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

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

  const handleDeleteSingle = async (templateId: string) => {
    if (deletingId) return;
    setDeletingId(templateId);
    try {
      await onDeleteTemplate(templateId);
    } catch (err) {
      console.error('Erro ao excluir modelo:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!onRestoreDefaults || isRestoring) return;
    setIsRestoring(true);
    try {
      await onRestoreDefaults();
    } catch (err) {
      console.error('Erro ao restaurar modelos:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!onDeleteAllTemplates || isDeletingAll) return;
    if (templates.length === 0) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllTemplates();
    } catch (err) {
      console.error('Erro ao limpar modelos:', err);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSavingTemplate(true);
    try {
      await onAddNewTemplate({
        userId: '',
        title: newTitle.trim(),
        procedureNumber: newProcedure.trim() || '',
        category: newCategory,
        priority: newPriority,
        time: newTime,
        description: newDescription.trim() || '',
      });

      // Reset form
      setNewTitle('');
      setNewProcedure('');
      setNewDescription('');
      setIsCreatingTemplate(false);
    } catch (err) {
      console.error('Error adding template:', err);
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Escolher Tarefa do Banco de Dados
              </h2>
              <p className="text-xs text-slate-400">
                Dia de destino: <strong className="text-amber-300 capitalize">{formattedTargetDate}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter & Tabs Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tarefa no catálogo..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="todos">Todas Categorias</option>
              {POLICE_TASK_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Add New Template Button */}
            <button
              onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingTemplate ? 'Fechar Formulário' : 'Novo Modelo'}</span>
            </button>
          </div>

          {/* Tabs and Quick Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('catalogo')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'catalogo'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Modelos Salvos ({filteredTemplates.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('historico')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'historico'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Tarefas Anteriores ({uniqueHistoricalTasks.length})</span>
              </button>
            </div>

            {activeTab === 'catalogo' && (
              <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                {onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    disabled={isRestoring}
                    title="Restaurar os 8 modelos padrão da Polícia Civil"
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/30 rounded-lg text-[11px] font-medium flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isRestoring ? 'Restaurando...' : 'Restaurar Padrões'}</span>
                  </button>
                )}
                {onDeleteAllTemplates && templates.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={isDeletingAll}
                    title="Remover todos os modelos salvos"
                    className="px-2.5 py-1 bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 rounded-lg text-[11px] font-medium flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isDeletingAll ? 'Limpando...' : 'Limpar Catálogo'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Template Inline Form */}
        {isCreatingTemplate && (
          <form onSubmit={handleSaveNewTemplate} className="p-4 bg-slate-950 border-b border-slate-800 space-y-3 animate-fadeIn">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Cadastrar Novo Modelo no Banco de Dados da Delegacia</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Título do Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Oitiva de Testemunha / Mandado de Busca"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nº de Procedimento Padrão (Opcional)
                </label>
                <input
                  type="text"
                  value={newProcedure}
                  onChange={(e) => setNewProcedure(e.target.value)}
                  placeholder="Ex: IP nº ___/2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Descrição / Instruções Padrão
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Detalhes e roteiro do procedimento..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingTemplate(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingTemplate}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <span>{savingTemplate ? 'Salvando...' : 'Salvar Modelo no Banco'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Task List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {activeTab === 'catalogo' ? (
            filteredTemplates.length === 0 ? (
              <div className="text-center py-12 space-y-3 border border-dashed border-slate-800 rounded-2xl p-6">
                <Bookmark className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">
                  Nenhum modelo cadastrado no catálogo
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Seu catálogo de modelos está limpo. Você pode cadastrar modelos personalizados ou restaurar os modelos padrão da 1ª DP.
                </p>
                {onRestoreDefaults && (
                  <button
                    type="button"
                    onClick={handleRestoreDefaults}
                    disabled={isRestoring}
                    className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isRestoring ? 'Restaurando...' : 'Restaurar 8 Modelos Padrão'}</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTemplates.map((template) => {
                const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === template.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];
                const isScheduling = schedulingId === template.id;
                const isDeleting = deletingId === template.id;

                return (
                  <div
                    key={template.id}
                    className={`p-4 bg-slate-950 border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${
                      isDeleting ? 'opacity-40 border-rose-900/50' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.badgeBg} ${cat.badgeText} ${cat.border}`}>
                          {cat.label}
                        </span>

                        {template.time && (
                          <span className="text-[10px] font-mono text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {template.time}
                          </span>
                        )}

                        {template.procedureNumber && (
                          <span className="text-xs font-mono text-slate-300 font-semibold">
                            {template.procedureNumber}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white">{template.title}</h4>

                      {template.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {template.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectTaskToReplicate(template)}
                        title="Replicar em vários dias"
                        disabled={isDeleting}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Replicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScheduleTemplate(template)}
                        disabled={isScheduling || isDeleting}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>{isScheduling ? 'Agendando...' : 'Agendar Neste Dia'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(template.id)}
                        disabled={isDeleting}
                        title="Excluir do catálogo"
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            uniqueHistoricalTasks.length === 0 ? (
              <div className="text-center py-12 space-y-3 border border-dashed border-slate-800 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">
                  Nenhuma tarefa anterior encontrada
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tarefas que você criar no cronograma ficarão disponíveis aqui para reutilização rápida.
                </p>
              </div>
            ) : (
              uniqueHistoricalTasks.map((t) => {
                const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === t.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];
                const isScheduling = schedulingId === t.id;

                return (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.badgeBg} ${cat.badgeText} ${cat.border}`}>
                          {cat.label}
                        </span>

                        {t.time && (
                          <span className="text-[10px] font-mono text-amber-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {t.time}
                          </span>
                        )}

                        {t.procedureNumber && (
                          <span className="text-xs font-mono text-slate-300 font-semibold">
                            {t.procedureNumber}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white">{t.title}</h4>

                      {t.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                          {t.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectTaskToReplicate(t)}
                        title="Replicar em vários dias"
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Replicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScheduleTemplate(t)}
                        disabled={isScheduling}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" />
                        <span>{isScheduling ? 'Agendando...' : 'Agendar Neste Dia'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Dica: você pode escolher um modelo e agendar para <span className="text-amber-400 font-semibold">{targetDate}</span> ou clicar em <strong className="text-white">Replicar</strong> para múltiplos dias.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
