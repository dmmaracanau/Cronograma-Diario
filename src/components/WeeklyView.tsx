import React, { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Bookmark,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { PoliceTask, PoliceTaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface WeeklyViewProps {
  tasks: PoliceTask[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddTask?: (date?: string) => void;
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

  // Weekdays (Monday - Friday) and Weekend (Saturday, Sunday)
  const weekdaysList = useMemo(() => weekDays.slice(0, 5), [weekDays]);
  const saturday = weekDays[5];
  const sunday = weekDays[6];

  const saturdayTasks = useMemo(() => tasks.filter((t) => t.date === saturday.dateStr), [tasks, saturday]);
  const sundayTasks = useMemo(() => tasks.filter((t) => t.date === sunday.dateStr), [tasks, sunday]);
  const weekendTasks = useMemo(() => [...saturdayTasks, ...sundayTasks], [saturdayTasks, sundayTasks]);

  const weekendCompletedCount = weekendTasks.filter((t) => t.status === 'concluida').length;
  const weekendRate = weekendTasks.length > 0 ? Math.round((weekendCompletedCount / weekendTasks.length) * 100) : 0;
  const isWeekendSelected = selectedDate === saturday.dateStr || selectedDate === sunday.dateStr;
  const isWeekendToday = saturday.isToday || sunday.isToday;

  return (
    <div className="space-y-4">
      {/* Week Navigation Header Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Navigation Arrows */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevWeek}
              title="Semana Anterior"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1 text-xs font-bold text-amber-400 hover:bg-slate-800 rounded-lg transition"
            >
              Esta Semana
            </button>
            <button
              onClick={handleNextWeek}
              title="Próxima Semana"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Label */}
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>
              Semana: {firstDay.dayNumber} {firstDay.monthName} a {lastDay.dayNumber} {lastDay.monthName}
            </span>
          </div>
        </div>

        {/* Weekly Stats Bar */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <div className="flex items-center gap-2.5 text-xs bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
            <div className="text-slate-400 font-medium">
              Total: <span className="text-white font-bold">{stats.total}</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="text-emerald-400 font-semibold">
              Concluídas: <span className="font-bold">{stats.concluidas}</span> ({stats.rate}%)
            </div>
            <div className="w-px h-3 bg-slate-800 hidden md:block" />
            <div className="text-blue-400 font-semibold hidden md:block">
              Em Andamento: <span className="font-bold">{stats.emAndamento}</span>
            </div>
            <div className="w-px h-3 bg-slate-800 hidden md:block" />
            <div className="text-purple-400 font-semibold hidden md:block">
              Remarcadas: <span className="font-bold">{stats.remarcadas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Column Weekly Grid: 5 wider columns for Mon-Fri + 1 standard column for Sab/Dom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1.2fr))_minmax(0,1fr)] gap-3 items-stretch">
        
        {/* Monday to Friday Columns */}
        {weekdaysList.map((day) => {
          const dayTasksList = tasks.filter((t) => t.date === day.dateStr);
          const completedCount = dayTasksList.filter((t) => t.status === 'concluida').length;
          const dayRate = dayTasksList.length > 0 ? Math.round((completedCount / dayTasksList.length) * 100) : 0;

          return (
            <div
              key={day.dateStr}
              className={`bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] shadow-sm overflow-hidden ${
                day.isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : day.isToday
                  ? 'border-blue-500/80 ring-1 ring-blue-500/20'
                  : 'border-slate-800/90 hover:border-slate-700'
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
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] uppercase font-black tracking-wider ${
                    day.isToday ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {day.weekdayName}
                  </span>
                  {day.isToday && (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-500 text-slate-950 px-1.5 py-0.2 rounded">
                      Hoje
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-xl font-black text-white">
                    {day.dayNumber}{' '}
                    <span className="text-xs font-normal text-slate-400">{day.monthName}</span>
                  </div>
                  <div className="text-[11px] font-bold text-amber-400/90">
                    {dayTasksList.length} {dayTasksList.length === 1 ? 'item' : 'itens'}
                  </div>
                </div>

                {/* Progress bar */}
                {dayTasksList.length > 0 && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dayRate}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Task Cards list */}
              <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[640px] no-scrollbar">
                {dayTasksList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <Bookmark className="w-6 h-6 text-slate-600 mx-auto" />
                    <div className="text-xs text-slate-400">Nenhum agendamento</div>
                    <button
                      onClick={() => onChooseTask(day.dateStr)}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition inline-flex items-center gap-1 mt-1"
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>Escolher do Catálogo</span>
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

              {/* Column Footer: Escolher do Catálogo button only */}
              <div className="p-2.5 border-t border-slate-800/90 bg-slate-950/60 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => onChooseTask(day.dateStr)}
                  title="Escolher do Catálogo de Procedimentos"
                  className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Escolher do Catálogo</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectDayView(day.dateStr)}
                  title="Abrir Visão Diária deste dia"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Combined Saturday & Sunday Column (SÁB / DOM) */}
        <div
          className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] shadow-sm overflow-hidden ${
            isWeekendSelected
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : isWeekendToday
              ? 'border-blue-500/80 ring-1 ring-blue-500/20'
              : 'border-slate-800/90 hover:border-slate-700 bg-slate-950/30'
          }`}
        >
          {/* Sáb / Dom Header */}
          <div 
            onClick={() => setSelectedDate(saturday.dateStr)}
            className={`p-3 border-b cursor-pointer transition ${
              isWeekendSelected 
                ? 'bg-amber-500/10 border-amber-500/30' 
                : isWeekendToday
                ? 'bg-blue-950/40 border-blue-800/40'
                : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase font-black tracking-wider text-slate-400">
                  Sáb / Dom
                </span>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-1 rounded">
                  Plantão
                </span>
              </div>
              {isWeekendToday && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider bg-blue-500 text-slate-950 px-1.5 py-0.2 rounded">
                  Hoje
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div className="text-base sm:text-lg font-black text-white">
                {saturday.dayNumber} <span className="text-xs font-semibold text-slate-400">Sáb</span> • {sunday.dayNumber} <span className="text-xs font-semibold text-slate-400">Dom</span>
              </div>
              <div className="text-[11px] font-bold text-amber-400/90">
                {weekendTasks.length} {weekendTasks.length === 1 ? 'item' : 'itens'}
              </div>
            </div>

            {/* Progress bar */}
            {weekendTasks.length > 0 && (
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${weekendRate}%` }}
                />
              </div>
            )}
          </div>

          {/* Sáb / Dom Task Cards List */}
          <div className="p-2 flex-1 space-y-2.5 overflow-y-auto max-h-[640px] no-scrollbar">
            {weekendTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto" />
                <div className="text-xs text-slate-400">Sem expediente regular</div>
                <div className="text-[11px] text-slate-500">Plantão ou ocorrências</div>
                <div className="pt-2 flex flex-col gap-1.5 max-w-[170px] mx-auto">
                  <button
                    onClick={() => onChooseTask(saturday.dateStr)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition inline-flex items-center justify-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Agendar no Sábado</span>
                  </button>
                  <button
                    onClick={() => onChooseTask(sunday.dateStr)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition inline-flex items-center justify-center gap-1"
                  >
                    <Bookmark className="w-3 h-3" />
                    <span>Agendar no Domingo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Saturday Section */}
                {saturdayTasks.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 flex items-center justify-between">
                      <span>Sábado ({saturday.dayNumber}/{saturday.monthName})</span>
                      <span className="text-slate-500 font-normal">{saturdayTasks.length}</span>
                    </div>
                    {saturdayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        compact={true}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onQuickStatus={onQuickStatus}
                        onReplicate={onReplicateTask}
                      />
                    ))}
                  </div>
                )}

                {/* Sunday Section */}
                {sundayTasks.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80 flex items-center justify-between">
                      <span>Domingo ({sunday.dayNumber}/{sunday.monthName})</span>
                      <span className="text-slate-500 font-normal">{sundayTasks.length}</span>
                    </div>
                    {sundayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        compact={true}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        onQuickStatus={onQuickStatus}
                        onReplicate={onReplicateTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sáb / Dom Footer with quick buttons for both days */}
          <div className="p-2.5 border-t border-slate-800/90 bg-slate-950/80 flex items-center justify-between gap-1.5">
            <div className="grid grid-cols-2 gap-1 flex-1">
              <button
                type="button"
                onClick={() => onChooseTask(saturday.dateStr)}
                title="Escolher do Catálogo para o Sábado"
                className="py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>+ Sáb</span>
              </button>

              <button
                type="button"
                onClick={() => onChooseTask(sunday.dateStr)}
                title="Escolher do Catálogo para o Domingo"
                className="py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-sm"
              >
                <Bookmark className="w-3 h-3 text-amber-400" />
                <span>+ Dom</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onSelectDayView(saturday.dateStr)}
              title="Abrir Visão Diária do fim de semana"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-slate-800"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
