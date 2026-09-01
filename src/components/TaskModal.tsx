import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  AlertTriangle, 
  Flame, 
  Trash2, 
  Save, 
  Shield, 
  Star,
  BookmarkCheck
} from 'lucide-react';
import { PoliceTask, PoliceTaskPriority } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<PoliceTask>, isFavorite?: boolean) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onOpenReplicate?: (taskData: Partial<PoliceTask>) => void;
  initialData?: PoliceTask | null;
  defaultDate?: string;
  isFavoriteInitial?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultDate,
  isFavoriteInitial = false,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PoliceTaskPriority>('alta');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setPriority(initialData.priority || 'alta');
      setDescription(initialData.description || '');
      setDate(initialData.date || defaultDate || new Date().toISOString().split('T')[0]);
      setIsFavorite(isFavoriteInitial);
    } else {
      setTitle('');
      setPriority('alta');
      setDescription('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setIsFavorite(isFavoriteInitial);
    }
  }, [initialData, defaultDate, isFavoriteInitial, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        priority,
        description: description.trim() || '',
        date,
        procedureNumber: initialData?.procedureNumber || '',
        category: initialData?.category || 'outro',
        time: initialData?.time || '09:00',
        status: initialData?.status || 'pendente',
        notes: initialData?.notes || '',
        rescheduledTo: initialData?.rescheduledTo,
        reason: initialData?.reason,
        completedAt: initialData?.completedAt,
      }, isFavorite);
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    setLoading(true);
    try {
      await onDelete(initialData.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Editar Procedimento' : 'Novo Procedimento / Tarefa'}
              </h2>
              <p className="text-xs text-slate-400">
                1ª Delegacia de Polícia de Maracanaú • PCCE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Simplified Modal */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-200 overflow-y-auto max-h-[80vh]">
          {/* 1. Nome / Título */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Nome do Procedimento / Diligência *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Oitiva de Testemunha / Mandado de Busca / Inquérito Policial"
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* 2. Grau de Prioridade */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>Grau de Prioridade & Brilho</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {priority === 'baixa' && 'Borda lisa sem brilho'}
                {priority === 'media' && 'Borda suave'}
                {priority === 'alta' && 'Borda destacada iluminada'}
                {priority === 'urgente' && 'Borda com brilho pulsante'}
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPriority('baixa')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'baixa'
                    ? 'bg-slate-800 text-slate-200 border-slate-500 ring-2 ring-slate-500 shadow-none'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>Baixa</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('media')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'media'
                    ? 'bg-blue-950 text-blue-300 border-blue-500 ring-2 ring-blue-500/50 shadow-md shadow-blue-950'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-blue-300'
                }`}
              >
                <span>Média</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('alta')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  priority === 'alta'
                    ? 'bg-amber-950 text-amber-300 border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-950'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-amber-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Alta</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgente')}
                className={`py-2 px-3 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 ${
                  priority === 'urgente'
                    ? 'bg-rose-950 text-rose-200 border-rose-400 ring-2 ring-rose-400 shadow-xl shadow-rose-950 animate-pulse'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Urgente</span>
              </button>
            </div>
          </div>

          {/* 3. Descrição */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Descrição / Instruções da Diligência
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções para o cumprimento, endereço, testemunhas, pontos a esclarecer ou roteiro da diligência..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* 4. Data Agendada */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Data Agendada *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* 5. Opção: Marcar como Favorito */}
          <div 
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
              isFavorite 
                ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/30' 
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl border transition ${
                isFavorite 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm' 
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-slate-950' : ''}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Marcar como Favorito</span>
                  {isFavorite && (
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                      Ativo
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  Destaque com estrela dourada no topo do catálogo e proteção contra exclusão.
                </p>
              </div>
            </div>

            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
              isFavorite ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-slate-700 bg-slate-900'
            }`}>
              {isFavorite && <Star className="w-3.5 h-3.5 fill-slate-950" />}
            </div>
          </div>

          {/* Aviso do Catálogo: Toda entrada já é salva no catálogo por padrão */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <BookmarkCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Salvo automaticamente no <strong>Catálogo de Modelos</strong> da delegacia por padrão.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            {initialData?.id && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Salvar Entrada'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for deletion */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Agendamento"
        description={`Deseja realmente remover o procedimento "${initialData?.title}" agendado para ${initialData?.date}?`}
        confirmLabel="Sim, Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        iconType="trash"
        isLoading={loading}
        onConfirm={handleConfirmDelete}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
