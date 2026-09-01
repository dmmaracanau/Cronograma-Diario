import React, { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  XCircle, 
  Bookmark,
  ArrowRight,
  Copy
} from 'lucide-react';
import { PoliceTask, PoliceTaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface WeeklyViewProps {
  tasks: PoliceTask[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddTask: (date?: string) => void;
  onChooseTask: (date: string) => void;
  onEditTask: (task: PoliceTask) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickStatus: (task: PoliceTask, status: PoliceTaskStatus) => void;
  onReplicateTask: (task: PoliceTask) => void;
  onSelectDayView: (date: string) => void;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  tasks,
  selectedDate,
  setSelectedDate,
  onAddTask,
  onChooseTask,
  onEditTask,
  onDeleteTask,
  onQuickStatus,
  onReplicateTask,
  onSelectDayView,
}) => {
  // Calculate the 7 days (Monday to Sunday) of the week containing selectedDate
  const weekDays = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const curr = new Date(year, month - 1, day);
    
    // In JS: 0 is Sunday, 1 is Monday ... 6 is Saturday
    const dayOfWeek = curr.getDay(); // 0-6
    // We want Monday (1) as the first day: offset
    const distanceToMonday = (dayOfWeek + 6) % 7;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const days: {
      dateStr: string;
      dayNumber: number;
      monthName: string;
      weekdayName: string;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      const weekdayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
      const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d);

      days.push({
        dateStr,
        dayNumber: d.getDate(),
        monthName,
        weekdayName: weekdayName.replace('.', ''),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    return days;
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Weekly aggregate metrics
  const weekTasks = useMemo(() => {
    const weekDateSet = new Set(weekDays.map((d) => d.dateStr));
    return tasks.filter((t) => weekDateSet.has(t.date));
  }, [tasks, weekDays]);

  const stats = useMemo(() => {
    const total = weekTasks.length;
    const concluidas = weekTasks.filter((t) => t.status === 'concluida').length;
    const emAndamento = weekTasks.filter((t) => t.status === 'em_andamento').length;
    const pendentes = weekTasks.filter((t) => t.status === 'pendente').length;
    const remarcadas = weekTasks.filter((t) => t.status === 'remarcada').length;
    const naoFeitas = weekTasks.filter((t) => t.status === 'nao_feita').length;
    const rate = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return { total, concluidas, emAndamento, pendentes, remarcadas, naoFeitas, rate };
  }, [weekTasks]);

  const firstDay = weekDays[0];
  const lastDay = weekDays[6];

  return (
    <div className="space-y-6">
      {/* Week Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevWeek}
              title="Semana Anterior"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-800 rounded-lg transition"
            >
              Esta Semana
            </button>
            <button
              onClick={handleNextWeek}
              title="Próxima Semana"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>
              Semana: {firstDay.dayNumber} {firstDay.monthName} a {lastDay.dayNumber} {lastDay.monthName}
            </span>
          </div>
        </div>

        {/* Weekly stats pill & Daily View quick button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onSelectDayView(selectedDate)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            title="Alternar para a Visão Diária do dia selecionado"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Alternar p/ Visão Diária</span>
          </button>

          <div className="flex items-center gap-3 text-xs bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">
              Total na Semana: <span className="text-white font-bold">{stats.total}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-800" />
            <div className="text-emerald-400 font-semibold">
              Concluídas: <span className="font-bold">{stats.concluidas}</span> ({stats.rate}%)
            </div>
            <div className="w-px h-3.5 bg-slate-800 hidden md:block" />
            <div className="text-amber-400 font-semibold hidden md:block">
              Remarcadas: <span className="font-bold">{stats.remarcadas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 items-start">
        {weekDays.map((day) => {
          const dayTasksList = tasks.filter((t) => t.date === day.dateStr);
          const completedCount = dayTasksList.filter((t) => t.status === 'concluida').length;
          const dayRate = dayTasksList.length > 0 ? Math.round((completedCount / dayTasksList.length) * 100) : 0;

          return (
            <div
              key={day.dateStr}
              className={`bg-slate-900/95 rounded-2xl border transition-all duration-200 flex flex-col min-h-[450px] shadow-md overflow-hidden ${
                day.isSelected
                  ? 'border-amber-400/80 ring-1 ring-amber-400/30'
                  : day.isToday
                  ? 'border-blue-500/60'
                  : 'border-slate-800'
              }`}
            >
              {/* Day Column Header */}
              <div 
                onClick={() => setSelectedDate(day.dateStr)}
                className={`p-3 border-b cursor-pointer transition ${
                  day.isSelected 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : day.isToday
                    ? 'bg-blue-950/40 border-blue-800/40'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-400">
                    {day.weekdayName}
                  </span>
                  {day.isToday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500 text-slate-950 px-1.5 py-0.5 rounded">
                      Hoje
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-lg font-extrabold text-white">
                    {day.dayNumber} <span className="text-xs font-normal text-slate-400">{day.monthName}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-300">
                    {dayTasksList.length} {dayTasksList.length === 1 ? 'tarefa' : 'tarefas'}
                  </div>
                </div>

                {/* Mini Completion Progress */}
                {dayTasksList.length > 0 && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dayRate}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Task Items inside Day */}
              <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[600px] no-scrollbar">
                {dayTasksList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 space-y-2">
                    <div className="text-xs text-slate-400">Sem tarefas</div>
                    <button
                      onClick={() => onChooseTask(day.dateStr)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline block mx-auto"
                    >
                      + Escolher do Banco
                    </button>
                  </div>
                ) : (
                  dayTasksList.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact={true}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                      onQuickStatus={onQuickStatus}
                      onReplicate={onReplicateTask}
                    />
                  ))
                )}
              </div>

              {/* Column Footer: Quick add, choose & open daily */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => onChooseTask(day.dateStr)}
                  title="Escolher tarefa do catálogo"
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-amber-400 rounded-lg text-[11px] transition"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onAddTask(day.dateStr)}
                  className="flex-1 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Criar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectDayView(day.dateStr)}
                  title="Focar no dia completo"
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
