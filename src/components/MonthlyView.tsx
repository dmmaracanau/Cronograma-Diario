import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  XCircle, 
  ArrowRight,
  FolderCheck,
  Shield,
  Bookmark,
  Copy
} from 'lucide-react';
import { PoliceTask, PoliceTaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface MonthlyViewProps {
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

export const MonthlyView: React.FC<MonthlyViewProps> = ({
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
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y || new Date().getFullYear();
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return (m ? m - 1 : new Date().getMonth());
  });

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now.toISOString().split('T')[0]);
  };

  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);
  }, [currentYear, currentMonth]);

  // Calendar cells calculation
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Day of week for 1st day (0 = Sun, 1 = Mon ... 6 = Sat)
    // Offset for Monday first:
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDays = lastDayOfMonth.getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    const cells: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Preceding month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      const dateStr = prevDate.toISOString().split('T')[0];
      cells.push({
        dateStr,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(currentYear, currentMonth, day);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    // Trailing next month days to complete 35 or 42 grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(currentYear, currentMonth + 1, day);
      const dateStr = d.toISOString().split('T')[0];
      cells.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDate]);

  // Tasks of the selected day for the side drawer
  const selectedDayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  const weekDayHeaders = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="space-y-6">
      {/* Month Navigation Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Mês Anterior"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-slate-800 rounded-lg transition"
            >
              Mês Atual
            </button>
            <button
              onClick={handleNextMonth}
              title="Próximo Mês"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg capitalize">
            <CalendarIcon className="w-5 h-5 text-amber-400" />
            <span>{monthName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChooseTask(selectedDate)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span>Escolher Tarefa</span>
          </button>

          <button
            onClick={() => onAddTask(selectedDate)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Tarefa</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Month Grid + Selected Day Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Matrix (8 cols on lg) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDayHeaders.map((head, idx) => (
              <div
                key={head}
                className={`text-xs font-bold uppercase tracking-wider py-2 rounded-lg ${
                  idx >= 5 ? 'text-amber-400/80 bg-amber-500/5' : 'text-slate-400 bg-slate-950/60'
                }`}
              >
                {head}
              </div>
            ))}
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarGrid.map((cell) => {
              const dayTasks = tasks.filter((t) => t.date === cell.dateStr);
              const completedCount = dayTasks.filter((t) => t.status === 'concluida').length;
              const pendingCount = dayTasks.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length;
              const rescheduledCount = dayTasks.filter((t) => t.status === 'remarcada').length;
              const notDoneCount = dayTasks.filter((t) => t.status === 'nao_feita').length;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDate(cell.dateStr)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    cell.isSelected
                      ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/50 shadow-md'
                      : cell.isToday
                      ? 'bg-blue-950/40 border-blue-600/70 hover:border-blue-400'
                      : cell.isCurrentMonth
                      ? 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      : 'bg-slate-950/20 border-slate-800/30 text-slate-600 opacity-40 hover:opacity-80'
                  }`}
                >
                  {/* Top Day Number & Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        cell.isToday
                          ? 'bg-blue-500 text-slate-950'
                          : cell.isSelected
                          ? 'text-amber-400 font-extrabold'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded-full">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task Indicators */}
                  <div className="space-y-1 my-1">
                    {dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded truncate ${
                          t.status === 'concluida'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 line-through opacity-75'
                            : t.status === 'remarcada'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/50'
                            : t.status === 'nao_feita'
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/50'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {t.time ? `${t.time} ` : ''}{t.title}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-amber-400 font-semibold pl-0.5">
                        +{dayTasks.length - 2} mais
                      </div>
                    )}
                  </div>

                  {/* Status dots row */}
                  {dayTasks.length > 0 && (
                    <div className="flex items-center gap-1 mt-auto pt-1">
                      {completedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={`${completedCount} concluídas`} />}
                      {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" title={`${pendingCount} pendentes`} />}
                      {rescheduledCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${rescheduledCount} remarcadas`} />}
                      {notDoneCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title={`${notDoneCount} não feitas`} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-[11px] uppercase font-bold text-amber-400">
                Pauta do Dia Selecionado
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {new Intl.DateTimeFormat('pt-BR', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }).format(new Date(selectedDate + 'T00:00:00'))}
              </h3>
            </div>

            <button
              onClick={() => onSelectDayView(selectedDate)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              title="Abrir no modo diário completo"
            >
              <span>Ver Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Day tasks in inspector */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            {selectedDayTasks.length === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="text-xs">Nenhum compromisso marcado para este dia.</div>
                <button
                  onClick={() => onAddTask(selectedDate)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar Tarefa</span>
                </button>
              </div>
            ) : (
              selectedDayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  compact={false}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onQuickStatus={onQuickStatus}
                  onReplicate={onReplicateTask}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
