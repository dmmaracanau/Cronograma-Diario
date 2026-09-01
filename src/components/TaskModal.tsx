import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  FileText, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Save, 
  HelpCircle,
  FolderCheck,
  Shield,
  Layers,
  Bookmark,
  Copy
} from 'lucide-react';
import { PoliceTask, PoliceTaskCategory, PoliceTaskPriority, PoliceTaskStatus } from '../types';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<PoliceTask>, saveAsTemplate?: boolean) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
  onOpenReplicate?: (taskData: Partial<PoliceTask>) => void;
  initialData?: PoliceTask | null;
  defaultDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenReplicate,
  initialData,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [procedureNumber, setProcedureNumber] = useState('');
  const [category, setCategory] = useState<PoliceTaskCategory>('oitiva');
  const [priority, setPriority] = useState<PoliceTaskPriority>('alta');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [status, setStatus] = useState<PoliceTaskStatus>('pendente');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [rescheduledTo, setRescheduledTo] = useState('');
  const [reason, setReason] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setProcedureNumber(initialData.procedureNumber || '');
      setCategory(initialData.category || 'oitiva');
      setPriority(initialData.priority || 'alta');
      setDate(initialData.date || defaultDate || new Date().toISOString().split('T')[0]);
      setTime(initialData.time || '');
      setStatus(initialData.status || 'pendente');
      setDescription(initialData.description || '');
      setNotes(initialData.notes || '');
      setRescheduledTo(initialData.rescheduledTo || '');
      setReason(initialData.reason || '');
      setSaveAsTemplate(false);
    } else {
      setTitle('');
      setProcedureNumber('');
      setCategory('oitiva');
      setPriority('alta');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setStatus('pendente');
      setDescription('');
      setNotes('');
      setRescheduledTo('');
      setReason('');
      setSaveAsTemplate(false);
    }
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        procedureNumber: procedureNumber.trim() || undefined,
        category,
        priority,
        date,
        time: time || undefined,
        status,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        rescheduledTo: status === 'remarcada' ? rescheduledTo : undefined,
        reason: (status === 'remarcada' || status === 'nao_feita') ? reason.trim() : undefined,
        completedAt: status === 'concluida' ? (initialData?.completedAt || new Date().toISOString()) : undefined,
      }, saveAsTemplate);
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReplicate = () => {
    if (!title.trim()) return;
    if (onOpenReplicate) {
      onOpenReplicate({
        title: title.trim(),
        procedureNumber: procedureNumber.trim() || undefined,
        category,
        priority,
        date,
        time: time || undefined,
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    if (window.confirm('Deseja realmente remover esta tarefa do cronograma policial?')) {
      setLoading(true);
      try {
        await onDelete(initialData.id);
        onClose();
      } catch (err) {
        console.error('Error deleting task:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialData ? 'Editar Procedimento / Tarefa' : 'Novo Procedimento Policial'}
              </h2>
              <p className="text-xs text-slate-400">
                1ª Delegacia de Polícia de Maracanaú • Cronograma
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-200">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Título da Tarefa / Diligência *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Oitiva de testemunha presencial / Despacho de Inquérito"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Procedure Number & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nº do Procedimento (IP, TCO, BO, Ofício)
              </label>
              <div className="relative">
                <FolderCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={procedureNumber}
                  onChange={(e) => setProcedureNumber(e.target.value)}
                  placeholder="Ex: IP nº 104/2026 ou BO 883/2026"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Categoria Policial
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PoliceTaskCategory)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                >
                  {POLICE_TASK_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date, Time, Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Horário Previsto
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PoliceTaskPriority)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente / Flagrante</option>
              </select>
            </div>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status da Tarefa
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(STATUS_CONFIG) as PoliceTaskStatus[]).map((stKey) => {
                const cfg = STATUS_CONFIG[stKey];
                const isSelected = status === stKey;
                return (
                  <button
                    key={stKey}
                    type="button"
                    onClick={() => setStatus(stKey)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition flex items-center gap-2 ${
                      isSelected
                        ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-amber-400/50 shadow-sm`
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Rescheduled Date */}
          {status === 'remarcada' && (
            <div className="p-3.5 bg-amber-950/30 border border-amber-800/50 rounded-xl space-y-3">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Dados da Remarcação
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Remarcada Para a Data:
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduledTo}
                    onChange={(e) => setRescheduledTo(e.target.value)}
                    className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Motivo da Remarcação:
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Testemunha solicitou alteração"
                    className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Reason for 'nao_feita' */}
          {status === 'nao_feita' && (
            <div className="p-3.5 bg-rose-950/30 border border-rose-800/50 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-rose-300">
                Justificativa / Motivo do Não Cumprimento:
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Endereço não localizado / Ausência de comparecimento / Diligência frustrada"
                className="w-full bg-slate-900 border border-rose-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Descrição / Instruções da Autoridade Policial
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções para o cumprimento, endereço, dados da testemunha, pontos a esclarecer..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Anotações / Certidão do Servidor
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações de cumprimento, certidão do escrivão/inspetor, número de folhas..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none"
            />
          </div>

          {/* Save to Catalog Checkbox & Replicate Link */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                Salvar também no Catálogo de Modelos da Delegacia (Database)
              </span>
            </label>

            {onOpenReplicate && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Deseja repetir esta tarefa em vários dias específicos?
                </span>
                <button
                  type="button"
                  onClick={handleTriggerReplicate}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Replicar em Múltiplos Dias</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {initialData?.id && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
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
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Salvar no Cronograma'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
