import React, { useMemo, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Bookmark,
  ArrowRight,
  ShieldAlert,
  GripVertical
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
  onMoveTask?: (taskId: string, targetDate: string, targetIndex?: number) => void;
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
  onMoveTask,
}) => {
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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
  const weekStats = useMemo(() => {
    const weekDates = new Set(weekDays.map((d) => d.dateStr));
    const weekTasks = tasks.filter((t) => weekDates.has(t.date));
    
    const total = weekTasks.length;
    const completed = weekTasks.filter((t) => t.status === 'concluida').length;
    const inProgress = weekTasks.filter((t) => t.status === 'em_andamento').length;
    const pending = weekTasks.filter((t) => t.status === 'pendente').length;
    const rescheduled = weekTasks.filter((t) => t.status === 'remarcada').length;
    const notDone = weekTasks.filter((t) => t.status === 'nao_feita').length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, pending, rescheduled, notDone, rate };
  }, [tasks, weekDays]);

  // Weekdays (Mon-Fri) and Weekend (Sat-Sun)
  const weekdaysList = useMemo(() => weekDays.slice(0, 5), [weekDays]);
  const saturday = weekDays[5];
  const sunday = weekDays[6];

  const saturdayTasks = useMemo(() => tasks.filter((t) => t.date === saturday?.dateStr), [tasks, saturday]);
  const sundayTasks = useMemo(() => tasks.filter((t) => t.date === sunday?.dateStr), [tasks, sunday]);
  const weekendTasksTotal = saturdayTasks.length + sundayTasks.length;

  const isWeekendSelected = selectedDate === saturday?.dateStr || selectedDate === sunday?.dateStr;
  const isWeekendToday = saturday?.isToday || sunday?.isToday;

  // Drag and Drop Helpers
  const handleDragOverColumn = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    // Only reset if leaving the column boundary
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDate(null);
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && onMoveTask) {
      onMoveTask(taskId, dateStr);
    }
  };

  const handleDropOnTask = (sourceTaskId: string, targetTaskId: string) => {
    if (!onMoveTask) return;
    const targetTask = tasks.find((t) => t.id === targetTaskId);
    if (!targetTask) return;

    // Get list of tasks on target date
    const dayTasks = tasks.filter((t) => t.date === targetTask.date);
    const targetIndex = dayTasks.findIndex((t) => t.id === targetTaskId);

    onMoveTask(sourceTaskId, targetTask.date, targetIndex);
  };

  return (
    <div className="space-y-4">
      {/* Weekly View Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1 text-xs font-semibold text-amber-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semana Atual</span>
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Próxima Semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            <span className="text-white font-bold">{weekDays[0]?.dayNumber} {weekDays[0]?.monthName}</span>
            {' — '}
            <span className="text-white font-bold">{weekDays[6]?.dayNumber} {weekDays[6]?.monthName}</span>
          </div>
        </div>

        {/* Drag & Drop Hint & Weekly Aggregate Metric Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] text-slate-400 hidden xl:flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
            <GripVertical className="w-3 h-3 text-amber-400" />
            <span>Arraste os cards para reorganizar ou mudar o dia</span>
          </span>

          <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold">
            {weekStats.total} {weekStats.total === 1 ? 'procedimento' : 'procedimentos'}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-bold">
            {weekStats.completed} concl. ({weekStats.rate}%)
          </span>
          {weekStats.inProgress > 0 && (
            <span className="px-2 py-1 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300 font-bold">
              {weekStats.inProgress} andamento
            </span>
          )}
          {weekStats.pending > 0 && (
            <span className="px-2 py-1 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 font-bold">
              {weekStats.pending} pend.
            </span>
          )}
          {weekStats.rescheduled > 0 && (
            <span className="px-2 py-1 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 font-bold">
              {weekStats.rescheduled} remarc.
            </span>
          )}
          {weekStats.notDone > 0 && (
            <span className="px-2 py-1 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 font-bold">
              {weekStats.notDone} ñ feitas
            </span>
          )}
        </div>
      </div>

      {/* 6-Column Layout: Mon, Tue, Wed, Thu, Fri get expanded width; Sat/Dom is combined */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1.2fr))_minmax(0,1fr)] gap-3.5 items-start">
        
        {/* Monday to Friday (Dias de Expediente) */}
        {weekdaysList.map((day) => {
          const dayTasksList = tasks.filter((t) => t.date === day.dateStr);
          const completedCount = dayTasksList.filter((t) => t.status === 'concluida').length;
          const dayRate = dayTasksList.length > 0 ? Math.round((completedCount / dayTasksList.length) * 100) : 0;
          const isDragHover = dragOverDate === day.dateStr;

          return (
            <div
              key={day.dateStr}
              onDragOver={(e) => handleDragOverColumn(e, day.dateStr)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, day.dateStr)}
              className={`bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col min-h-[520px] shadow-sm overflow-hidden ${
                isDragHover
                  ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-500/5 shadow-lg'
                  : day.isSelected
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
                      onDropOnTask={handleDropOnTask}
                    />
                  ))
                )}

                {/* Drop placeholder visual indicator */}
                {isDragHover && (
                  <div className="p-3 border-2 border-dashed border-amber-400/80 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-bold text-center animate-pulse">
                    Soltar aqui para agendar em {day.weekdayName} ({day.dayNumber}/{day.monthName})
                  </div>
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
              <div className="text-lg font-black text-slate-300">
                {saturday?.dayNumber} <span className="text-xs font-normal text-slate-500">e</span> {sunday?.dayNumber}{' '}
                <span className="text-xs font-normal text-slate-400">{saturday?.monthName}</span>
              </div>
              <div className="text-[11px] font-bold text-amber-400/90">
                {weekendTasksTotal} {weekendTasksTotal === 1 ? 'item' : 'itens'}
              </div>
            </div>
          </div>

          {/* Sáb / Dom Task Lists */}
          <div className="p-2 flex-1 space-y-3 overflow-y-auto max-h-[640px] no-scrollbar">
            {/* Sábado Section */}
            <div 
              onDragOver={(e) => handleDragOverColumn(e, saturday.dateStr)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, saturday.dateStr)}
              className={`space-y-1.5 p-2 rounded-xl border transition ${
                dragOverDate === saturday.dateStr
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-800/70 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1">
                  <span>Sábado ({saturday?.dayNumber}/{saturday?.monthName})</span>
                  {saturday?.isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </span>
                <button
                  type="button"
                  onClick={() => onChooseTask(saturday.dateStr)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                >
                  <Bookmark className="w-2.5 h-2.5" />
                  <span>Catálogo</span>
                </button>
              </div>

              {saturdayTasks.length === 0 ? (
                <div className="py-3 text-center text-slate-600 text-[11px]">
                  Sem plantão no sábado
                </div>
              ) : (
                saturdayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact={true}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onQuickStatus={onQuickStatus}
                    onReplicate={onReplicateTask}
                    onDropOnTask={handleDropOnTask}
                  />
                ))
              )}
            </div>

            {/* Domingo Section */}
            <div 
              onDragOver={(e) => handleDragOverColumn(e, sunday.dateStr)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={(e) => handleDropOnColumn(e, sunday.dateStr)}
              className={`space-y-1.5 p-2 rounded-xl border transition ${
                dragOverDate === sunday.dateStr
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-800/70 bg-slate-950/40'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1">
                  <span>Domingo ({sunday?.dayNumber}/{sunday?.monthName})</span>
                  {sunday?.isToday && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                </span>
                <button
                  type="button"
                  onClick={() => onChooseTask(sunday.dateStr)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                >
                  <Bookmark className="w-2.5 h-2.5" />
                  <span>Catálogo</span>
                </button>
              </div>

              {sundayTasks.length === 0 ? (
                <div className="py-3 text-center text-slate-600 text-[11px]">
                  Sem plantão no domingo
                </div>
              ) : (
                sundayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    compact={true}
                    onEdit={onEditTask}
                    onDelete={onDeleteTask}
                    onQuickStatus={onQuickStatus}
                    onReplicate={onReplicateTask}
                    onDropOnTask={handleDropOnTask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sáb / Dom Footer */}
          <div className="p-2.5 border-t border-slate-800/90 bg-slate-950/60 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => onChooseTask(saturday.dateStr)}
              title="Escolher do Catálogo de Procedimentos"
              className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Catálogo Fim de Semana</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectDayView(saturday.dateStr)}
              title="Abrir Visão Diária do Sábado"
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
