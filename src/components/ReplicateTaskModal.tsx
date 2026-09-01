import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Calendar, 
  Clock, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  FolderCheck,
  Shield,
  Layers,
  Sparkles,
  CalendarPlus
} from 'lucide-react';
import { PoliceTask, TaskTemplate, PoliceTaskCategory, PoliceTaskPriority } from '../types';
import { POLICE_TASK_CATEGORIES } from '../data/policeTemplates';

interface ReplicateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: PoliceTask | TaskTemplate | null;
  onReplicate: (dates: string[], customTime?: string) => Promise<void>;
  currentSelectedDate?: string;
}

export const ReplicateTaskModal: React.FC<ReplicateTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  onReplicate,
  currentSelectedDate,
}) => {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [customTime, setCustomTime] = useState(task?.time || '09:00');
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // Range and weekdays helper states
  const [startDate, setStartDate] = useState(
    currentSelectedDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(currentSelectedDate || new Date());
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

  // Reset when opened
  React.useEffect(() => {
    if (isOpen) {
      const initial = new Set<string>();
      if (currentSelectedDate) {
        initial.add(currentSelectedDate);
      }
      setSelectedDates(initial);
      setCustomTime(task?.time || '09:00');
      setCalendarMonthOffset(0);
    }
  }, [isOpen, task, currentSelectedDate]);

  // Calendar month view calculation
  const calendarData = useMemo(() => {
    const base = new Date();
    base.setMonth(base.getMonth() + calendarMonthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(base);

    // Days in current month
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Pad before
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dateStr: '', dayNumber: 0, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ dateStr, dayNumber: d, isCurrentMonth: true });
    }

    return { monthName, days, year, month };
  }, [calendarMonthOffset]);

  // Sorted selected dates
  const sortedSelectedDates: string[] = useMemo(() => {
    return Array.from(selectedDates).sort();
  }, [selectedDates]);

  const toggleDate = (dateStr: string) => {
    if (!dateStr) return;
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const applyRangeWithWeekdays = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    if (start > end) return;

    const newSet = new Set(selectedDates);
    const curr = new Date(start);

    while (curr <= end) {
      const dayOfWeek = (curr.getDay() + 6) % 7 + 1; // 1=Mon, 7=Sun
      if (selectedWeekdays.includes(dayOfWeek)) {
        newSet.add(curr.toISOString().split('T')[0]);
      }
      curr.setDate(curr.getDate() + 1);
    }

    setSelectedDates(newSet);
  };

  const selectNextWorkingDays = (count: number) => {
    const newSet = new Set(selectedDates);
    const curr = new Date(currentSelectedDate || new Date());
    let added = 0;
    let iterations = 0;

    while (added < count && iterations < 60) {
      const dayOfWeek = curr.getDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        newSet.add(curr.toISOString().split('T')[0]);
        added++;
      }
      curr.setDate(curr.getDate() + 1);
      iterations++;
    }

    setSelectedDates(newSet);
  };

  const clearDates = () => {
    setSelectedDates(new Set());
  };

  if (!isOpen || !task) return null;

  const categoryInfo = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];

  const handleConfirm = async () => {
    if (sortedSelectedDates.length === 0) return;
    setLoading(true);
    try {
      await onReplicate(sortedSelectedDates, customTime);
      onClose();
    } catch (err) {
      console.error('Error replicating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekdaysLabels = [
    { id: 1, label: 'Seg' },
    { id: 2, label: 'Ter' },
    { id: 3, label: 'Qua' },
    { id: 4, label: 'Qui' },
    { id: 5, label: 'Sex' },
    { id: 6, label: 'Sáb' },
    { id: 7, label: 'Dom' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Replicar Procedimento nos Dias Escolhidos
              </h2>
              <p className="text-xs text-slate-400">
                Selecione os dias em que deseja agendar este procedimento policial
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Target Task Summary Box */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryInfo.badgeBg} ${categoryInfo.badgeText} ${categoryInfo.border}`}>
                  {categoryInfo.label}
                </span>
                {task.procedureNumber && (
                  <span className="text-xs font-mono text-amber-400 font-semibold">
                    {task.procedureNumber}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white">{task.title}</h3>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-transparent text-xs font-mono text-white focus:outline-none"
                title="Horário para as tarefas replicadas"
              />
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Atalhos de Seleção Rápida
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => selectNextWorkingDays(5)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                + Próximos 5 Dias Úteis
              </button>
              <button
                type="button"
                onClick={() => selectNextWorkingDays(10)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                + Próximos 10 Dias Úteis
              </button>
              <button
                type="button"
                onClick={clearDates}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-medium transition ml-auto"
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Custom Date Range & Weekdays Selector */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Replicar em Intervalo com Dias da Semana</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Data Final:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Weekdays Toggle */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">
                Nos dias da semana:
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {weekdaysLabels.map((w) => {
                  const isChecked = selectedWeekdays.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setSelectedWeekdays((prev) =>
                          isChecked ? prev.filter((d) => d !== w.id) : [...prev, w.id]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        isChecked
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={applyRangeWithWeekdays}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition ml-auto shadow"
                >
                  Aplicar Intervalo
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Multi-Select Calendar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Ou clique diretamente nos dias desejados no calendário:</span>
              </label>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-white capitalize px-2">
                  {calendarData.monthName}
                </span>
                <button
                  type="button"
                  onClick={() => setCalendarMonthOffset((prev) => prev + 1)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
                <div>Dom</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarData.days.map((d, index) => {
                  if (!d.isCurrentMonth) {
                    return <div key={`pad-${index}`} className="h-8" />;
                  }
                  const isSelected = selectedDates.has(d.dateStr);
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => toggleDate(d.dateStr)}
                      className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : isToday
                          ? 'bg-blue-950 text-blue-300 border border-blue-700 hover:bg-blue-900'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {d.dayNumber}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Dates Summary Badge Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>
                Dias Selecionados (<strong className="text-amber-400">{sortedSelectedDates.length}</strong>):
              </span>
            </div>

            {sortedSelectedDates.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Nenhum dia selecionado ainda. Clique nas datas acima ou use os atalhos.
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                {sortedSelectedDates.map((dateStr) => {
                  const [y, m, d] = dateStr.split('-');
                  return (
                    <span
                      key={dateStr}
                      className="inline-flex items-center gap-1 bg-slate-900 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-xs font-mono"
                    >
                      {d}/{m}/{y}
                      <button
                        type="button"
                        onClick={() => toggleDate(dateStr)}
                        className="text-slate-400 hover:text-rose-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || sortedSelectedDates.length === 0}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            <span>
              {loading
                ? 'Replicando...'
                : `Replicar em ${sortedSelectedDates.length} ${
                    sortedSelectedDates.length === 1 ? 'Dia' : 'Dias'
                  }`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
