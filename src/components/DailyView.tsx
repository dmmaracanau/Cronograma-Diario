import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  CalendarDays,
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  XCircle, 
  Printer, 
  ShieldAlert,
  FileCheck,
  TrendingUp,
  Bookmark,
  Copy,
  GripVertical
} from 'lucide-react';
import { PoliceTask, PoliceTaskCategory, PoliceTaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

interface DailyViewProps {
  tasks: PoliceTask[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddTask: (date?: string) => void;
  onChooseTask: (date: string) => void;
  onEditTask: (task: PoliceTask) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickStatus: (task: PoliceTask, status: PoliceTaskStatus) => void;
  onReplicateTask: (task: PoliceTask) => void;
  onPrintDocket: () => void;
  onSelectWeeklyView?: () => void;
  onMoveTask?: (taskId: string, targetDate: string, targetIndex?: number) => void;
  isBatchMode?: boolean;
  selectedBatchTaskIds?: string[];
  onToggleSelectTask?: (taskId: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  tasks,
  selectedDate,
  setSelectedDate,
  onAddTask,
  onChooseTask,
  onEditTask,
  onDeleteTask,
  onQuickStatus,
  onReplicateTask,
  onPrintDocket,
  onSelectWeeklyView,
  onMoveTask,
  isBatchMode = false,
  selectedBatchTaskIds = [],
  onToggleSelectTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');

  // Day navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Formatted date string in PT-BR
  const formattedDayTitle = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  }, [selectedDate]);

  // Tasks strictly for the selected date
  const dayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Filtered tasks by search, status, and category
  const filteredTasks = useMemo(() => {
    return dayTasks.filter((t) => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.procedureNumber && t.procedureNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = selectedStatusFilter === 'todos' || t.status === selectedStatusFilter;
      const matchesCategory = selectedCategoryFilter === 'todos' || t.category === selectedCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [dayTasks, searchQuery, selectedStatusFilter, selectedCategoryFilter]);

  // Daily statistics - strictly for the selected day
  const stats = useMemo(() => {
    const total = dayTasks.length;
    const concluidas = dayTasks.filter((t) => t.status === 'concluida').length;
    const emAndamento = dayTasks.filter((t) => t.status === 'em_andamento').length;
    const pendentes = dayTasks.filter((t) => t.status === 'pendente').length;
    const remarcadas = dayTasks.filter((t) => t.status === 'remarcada').length;
    const naoFeitas = dayTasks.filter((t) => t.status === 'nao_feita').length;
    const rate = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, emAndamento, pendentes, remarcadas, naoFeitas, rate };
  }, [dayTasks]);

  const handleDropOnTask = (sourceTaskId: string, targetTaskId: string) => {
    if (!onMoveTask) return;
    const targetTask = tasks.find((t) => t.id === targetTaskId);
    if (!targetTask) return;

    const list = tasks.filter((t) => t.date === targetTask.date);
    const targetIndex = list.findIndex((t) => t.id === targetTaskId);

    onMoveTask(sourceTaskId, targetTask.date, targetIndex);
  };

  const selectedSet = useMemo(() => new Set(selectedBatchTaskIds), [selectedBatchTaskIds]);

  return (
    <div className="space-y-4">
      {/* Daily View Header Bar (Matching Weekly View Header Style) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={handlePrevDay}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-semibold text-amber-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Hoje</span>
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Próximo Dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white font-bold capitalize">
              {formattedDayTitle}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              title="Escolher data específica"
            />
          </div>
        </div>

        {/* Daily Aggregate Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
            {stats.total} {stats.total === 1 ? 'procedimento' : 'procedimentos'}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-bold">
            {stats.concluidas} concl. ({stats.rate}%)
          </span>
          {stats.emAndamento > 0 && (
            <span className="px-2 py-1 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300 font-bold">
              {stats.emAndamento} andamento
            </span>
          )}
          {stats.pendentes > 0 && (
            <span className="px-2 py-1 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 font-bold">
              {stats.pendentes} pend.
            </span>
          )}
          {stats.remarcadas > 0 && (
            <span className="px-2 py-1 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 font-bold">
              {stats.remarcadas} remarc.
            </span>
          )}
          {stats.naoFeitas > 0 && (
            <span className="px-2 py-1 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 font-bold">
              {stats.naoFeitas} ñ feitas
            </span>
          )}

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={onPrintDocket}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition"
              title="Imprimir Pauta de Oitivas e Expedientes do Dia"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <button
              onClick={() => onChooseTask(selectedDate)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Escolher do Catálogo"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-950" />
              <span>Catálogo</span>
            </button>
            <button
              onClick={() => onAddTask(selectedDate)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              title="Criar Nova Tarefa"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por procedimento (IP, TCO), título ou descrição..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="todos">Todas Categorias</option>
              {POLICE_TASK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedStatusFilter('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              selectedStatusFilter === 'todos'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todos ({dayTasks.length})
          </button>

          {(Object.keys(STATUS_CONFIG) as PoliceTaskStatus[]).map((stKey) => {
            const cfg = STATUS_CONFIG[stKey];
            const count = dayTasks.filter((t) => t.status === stKey).length;
            const isSelected = selectedStatusFilter === stKey;

            return (
              <button
                key={stKey}
                onClick={() => setSelectedStatusFilter(stKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-amber-400/40`
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List Timeline */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
            <FileCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhum procedimento agendado para este dia</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Crie uma nova tarefa policial ou escolha um procedimento salvo no catálogo do banco de dados.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => onChooseTask(selectedDate)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>Escolher Tarefa do Catálogo</span>
            </button>
            <button
              onClick={() => onAddTask(selectedDate)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Tarefa</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onQuickStatus={onQuickStatus}
              onReplicate={onReplicateTask}
              onDropOnTask={handleDropOnTask}
              isBatchMode={isBatchMode}
              isSelected={selectedSet.has(task.id)}
              onToggleSelect={onToggleSelectTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

