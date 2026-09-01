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
  Copy
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

  // Tasks for the selected date
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

  // Daily statistics
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

  return (
    <div className="space-y-6">
      {/* Date Navigation & Actions Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevDay}
              title="Dia Anterior"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-800 rounded-lg transition"
            >
              Hoje
            </button>
            <button
              onClick={handleNextDay}
              title="Próximo Dia"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white font-medium focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="text-sm sm:text-base font-bold text-white capitalize pl-2">
            {formattedDayTitle}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {onSelectWeeklyView && (
            <button
              onClick={onSelectWeeklyView}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              title="Voltar para a Visão Semanal"
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Visão Semanal</span>
            </button>
          )}

          <button
            onClick={onPrintDocket}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            title="Imprimir pauta de oitivas e expedientes do dia"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Imprimir Pauta</span>
          </button>

          <button
            onClick={() => onChooseTask(selectedDate)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
            title="Escolher procedimento existente no catálogo ou cadastrar novo modelo"
          >
            <Bookmark className="w-4 h-4 text-slate-950" />
            <span>Escolher do Catálogo</span>
          </button>
        </div>
      </div>

      {/* Daily Metrics Dashboard Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-slate-400 text-xs font-medium">Total de Tarefas</div>
          <div className="text-xl font-bold text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Procedimentos do dia</div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-800/40 p-3.5 rounded-2xl">
          <div className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluídas
          </div>
          <div className="text-xl font-bold text-emerald-300 mt-1">{stats.concluidas}</div>
          <div className="text-[10px] text-emerald-400/70 mt-0.5">{stats.rate}% de eficiência</div>
        </div>

        <div className="bg-blue-950/20 border border-blue-800/40 p-3.5 rounded-2xl">
          <div className="text-blue-400 text-xs font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Em Andamento
          </div>
          <div className="text-xl font-bold text-blue-300 mt-1">{stats.emAndamento}</div>
          <div className="text-[10px] text-blue-400/70 mt-0.5">Em diligência</div>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/40 p-3.5 rounded-2xl">
          <div className="text-slate-400 text-xs font-semibold">Pendentes</div>
          <div className="text-xl font-bold text-slate-200 mt-1">{stats.pendentes}</div>
          <div className="text-[10px] text-slate-400/70 mt-0.5">Aguardando início</div>
        </div>

        <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-2xl">
          <div className="text-amber-400 text-xs font-semibold flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" />
            Remarcadas
          </div>
          <div className="text-xl font-bold text-amber-300 mt-1">{stats.remarcadas}</div>
          <div className="text-[10px] text-amber-400/70 mt-0.5">Reagendadas</div>
        </div>

        <div className="bg-rose-950/20 border border-rose-800/40 p-3.5 rounded-2xl">
          <div className="text-rose-400 text-xs font-semibold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            Não Feitas
          </div>
          <div className="text-xl font-bold text-rose-300 mt-1">{stats.naoFeitas}</div>
          <div className="text-[10px] text-rose-400/70 mt-0.5">Com justificativa</div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

