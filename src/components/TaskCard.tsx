import React from 'react';
import { 
  Clock, 
  FolderCheck, 
  CheckCircle2, 
  CalendarClock, 
  XCircle, 
  PlayCircle, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  FileText,
  Shield,
  Tag,
  Copy
} from 'lucide-react';
import { PoliceTask, PoliceTaskStatus } from '../types';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

interface TaskCardProps {
  task: PoliceTask;
  onEdit: (task: PoliceTask) => void;
  onDelete: (taskId: string) => void;
  onQuickStatus: (task: PoliceTask, status: PoliceTaskStatus) => void;
  onReplicate?: (task: PoliceTask) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onQuickStatus,
  onReplicate,
  compact = false,
}) => {
  const categoryInfo = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category) || POLICE_TASK_CATEGORIES[POLICE_TASK_CATEGORIES.length - 1];
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendente;

  const priorityColors = {
    baixa: 'text-slate-400 bg-slate-800/80 border-slate-700',
    media: 'text-blue-300 bg-blue-950/40 border-blue-800/60',
    alta: 'text-amber-300 bg-amber-950/40 border-amber-800/60',
    urgente: 'text-rose-300 bg-rose-950/50 border-rose-800/80 font-bold',
  };

  if (compact) {
    return (
      <div 
        className={`p-2.5 rounded-xl border transition-all duration-150 bg-slate-900/90 hover:bg-slate-800/90 shadow-sm ${
          task.status === 'concluida' 
            ? 'border-emerald-800/60 opacity-80' 
            : task.status === 'nao_feita'
            ? 'border-rose-800/60'
            : task.status === 'remarcada'
            ? 'border-amber-800/60'
            : 'border-slate-700/80'
        }`}
      >
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {task.time && (
              <span className="text-[10px] font-mono text-amber-400/90 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                {task.time}
              </span>
            )}
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${categoryInfo.badgeBg} ${categoryInfo.badgeText} ${categoryInfo.border}`}>
              {categoryInfo.label.split(' ')[0]}
            </span>
          </div>

          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
            {statusInfo.label}
          </span>
        </div>

        <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-tight mb-1">
          {task.title}
        </h4>

        {task.procedureNumber && (
          <div className="text-[10px] font-mono text-blue-400 mb-1.5 truncate">
            {task.procedureNumber}
          </div>
        )}

        {/* Quick Compact Action Buttons */}
        <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-slate-800/80">
          {task.status !== 'concluida' && (
            <button
              onClick={() => onQuickStatus(task, 'concluida')}
              title="Marcar como Concluída"
              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status !== 'remarcada' && (
            <button
              onClick={() => onQuickStatus(task, 'remarcada')}
              title="Remarcar Tarefa"
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded transition"
            >
              <CalendarClock className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status !== 'nao_feita' && (
            <button
              onClick={() => onQuickStatus(task, 'nao_feita')}
              title="Marcar como Não Feita"
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {onReplicate && (
            <button
              onClick={() => onReplicate(task)}
              title="Replicar Tarefa em Múltiplos Dias"
              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded transition ml-1"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onEdit(task)}
            title="Editar Tarefa"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full detailed card
  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-150 bg-slate-900/90 hover:bg-slate-800/90 shadow-md ${
        task.status === 'concluida'
          ? 'border-emerald-800/60 bg-emerald-950/10'
          : task.status === 'remarcada'
          ? 'border-amber-800/60 bg-amber-950/10'
          : task.status === 'nao_feita'
          ? 'border-rose-800/60 bg-rose-950/10'
          : task.status === 'em_andamento'
          ? 'border-blue-800/60 bg-blue-950/10'
          : 'border-slate-700/80'
      }`}
    >
      {/* Top badges bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {task.time && (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5" />
              {task.time}
            </span>
          )}

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${categoryInfo.badgeBg} ${categoryInfo.badgeText} ${categoryInfo.border}`}>
            {categoryInfo.label}
          </span>

          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-lg border ${priorityColors[task.priority]}`}>
            {task.priority === 'urgente' ? '⚠ Urgente' : `Prioridade ${task.priority}`}
          </span>
        </div>

        {/* Current status pill */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
          <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
          {statusInfo.label}
        </span>
      </div>

      {/* Main Title & Procedure */}
      <div className="space-y-1 mb-2.5">
        <h3 className={`text-base font-bold text-white tracking-tight ${task.status === 'concluida' ? 'line-through text-slate-300' : ''}`}>
          {task.title}
        </h3>

        {task.procedureNumber && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/90 font-medium">
            <FolderCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Procedimento: {task.procedureNumber}</span>
          </div>
        )}
      </div>

      {/* Description if present */}
      {task.description && (
        <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
          {task.description}
        </p>
      )}

      {/* Special status callouts (Remarcação / Não feita / Concluída) */}
      {task.status === 'remarcada' && (
        <div className="mb-3 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-2">
          <CalendarClock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-300">
              Remarcada para: {task.rescheduledTo || 'A definir'}
            </div>
            {task.reason && <div className="text-[11px] text-amber-300/80 mt-0.5">Motivo: {task.reason}</div>}
          </div>
        </div>
      )}

      {task.status === 'nao_feita' && (
        <div className="mb-3 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300">Procedimento Não Realizado</div>
            {task.reason && <div className="text-[11px] text-rose-300/80 mt-0.5">Justificativa: {task.reason}</div>}
          </div>
        </div>
      )}

      {task.status === 'concluida' && task.completedAt && (
        <div className="mb-3 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Concluída em: {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {task.notes && <span className="italic text-emerald-300/80">Certificada</span>}
        </div>
      )}

      {/* Notes / Certidão do servidor */}
      {task.notes && task.status !== 'concluida' && (
        <div className="mb-3 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <span className="font-semibold text-slate-300">Certidão/Obs:</span> {task.notes}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        {/* Quick status changers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.status !== 'concluida' && (
            <button
              type="button"
              onClick={() => onQuickStatus(task, 'concluida')}
              className="px-2.5 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 hover:text-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir</span>
            </button>
          )}

          {task.status !== 'em_andamento' && task.status !== 'concluida' && (
            <button
              type="button"
              onClick={() => onQuickStatus(task, 'em_andamento')}
              className="px-2.5 py-1.5 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-700/60 text-blue-300 hover:text-blue-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Em Andamento</span>
            </button>
          )}

          {task.status !== 'remarcada' && (
            <button
              type="button"
              onClick={() => onQuickStatus(task, 'remarcada')}
              className="px-2.5 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-700/60 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Remarcar</span>
            </button>
          )}

          {task.status !== 'nao_feita' && (
            <button
              type="button"
              onClick={() => onQuickStatus(task, 'nao_feita')}
              className="px-2.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Não Feita</span>
            </button>
          )}
        </div>

        {/* Edit, Replicate & Delete tools */}
        <div className="flex items-center gap-1 ml-auto">
          {onReplicate && (
            <button
              type="button"
              onClick={() => onReplicate(task)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              title="Replicar Tarefa em Outros Dias"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Editar Tarefa"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
            title="Excluir Tarefa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
