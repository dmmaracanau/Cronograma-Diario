import React, { useState } from 'react';
import { 
  X, 
  CalendarClock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Save
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PoliceTask, PoliceTaskStatus } from '../types';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: PoliceTask | null;
  targetStatus: PoliceTaskStatus | null;
  onConfirm: (taskId: string, updates: Partial<PoliceTask>) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  task,
  targetStatus,
  onConfirm,
}) => {
  const [rescheduledDate, setRescheduledDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task || !targetStatus) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: Partial<PoliceTask> = {
        status: targetStatus,
      };

      if (targetStatus === 'concluida') {
        updates.completedAt = new Date().toISOString();
        if (notes.trim()) updates.notes = notes.trim();
        
        // Fire pleasant confetti
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#f59e0b', '#10b981', '#3b82f6']
          });
        } catch (_) {}
      } else if (targetStatus === 'remarcada') {
        updates.rescheduledTo = rescheduledDate;
        updates.reason = reason.trim() || 'Remarcada pelo servidor responsável';
      } else if (targetStatus === 'nao_feita') {
        updates.reason = reason.trim() || undefined;
      }

      await onConfirm(task.id, updates);
      onClose();
    } catch (err) {
      console.error('Error changing task status:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {targetStatus === 'concluida' && (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            {targetStatus === 'remarcada' && (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <CalendarClock className="w-5 h-5" />
              </div>
            )}
            {targetStatus === 'nao_feita' && (
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-white">
                {targetStatus === 'concluida' && 'Concluir Procedimento Policial'}
                {targetStatus === 'remarcada' && 'Remarcar Procedimento / Oitiva'}
                {targetStatus === 'nao_feita' && 'Registrar Procedimento Não Realizado'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">
                {task.procedureNumber ? `${task.procedureNumber} • ` : ''}{task.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-200 text-xs">
          {targetStatus === 'remarcada' && (
            <>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nova Data de Agendamento *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={rescheduledDate}
                    onChange={(e) => setRescheduledDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Motivo da Remarcação
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Testemunha solicitou reagendamento / Mandado a ser cumprido em outra data"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}

          {targetStatus === 'nao_feita' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Justificativa / Motivo do Não Cumprimento (Opcional)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Opcional: Suspeito ausente no endereço / Vítima desistiu / Diligência frustrada... (pode deixar em branco)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>
          )}

          {targetStatus === 'concluida' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Certidão de Cumprimento / Observações Finais (Opcional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Oitiva reduzida a termo e acostada aos autos do IP / Mandado cumprido com êxito..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 font-bold rounded-xl flex items-center gap-1.5 transition shadow-md disabled:opacity-50 ${
                targetStatus === 'concluida'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : targetStatus === 'remarcada'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Confirmar Alteração'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
