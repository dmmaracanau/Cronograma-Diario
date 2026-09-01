import React from 'react';
import { 
  Clock, 
  FolderCheck, 
  CheckCircle2, 
  CalendarClock, 
  XCircle, 
  PlayCircle, 
  RotateCcw,
  Edit3, 
  Trash2, 
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
    alta: 'text-amber-300 bg-amber-950/40 border-amber-800/60 font-semibold',
    urgente: 'text-rose-300 bg-rose-950/60 border-rose-700/80 font-black animate-pulse',
  };

  // Dedicated status visual theme
  const getStatusTheme = (status: PoliceTaskStatus) => {
    switch (status) {
      case 'concluida':
        return {
          container: 'border-emerald-500/60 bg-emerald-950/20 hover:border-emerald-400 shadow-emerald-950/20',
          indicator: 'bg-emerald-500',
          title: 'line-through text-slate-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'em_andamento':
        return {
          container: 'border-blue-500/80 bg-blue-950/30 hover:border-blue-400 shadow-blue-950/40 ring-1 ring-blue-500/20',
          indicator: 'bg-blue-400 animate-pulse',
          title: 'text-white font-bold',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'remarcada':
        return {
          container: 'border-purple-500/70 bg-purple-950/25 hover:border-purple-400 shadow-purple-950/30',
          indicator: 'bg-purple-400',
          title: 'text-slate-200',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        };
      case 'nao_feita':
        return {
          container: 'border-rose-500/70 bg-rose-950/25 hover:border-rose-400 shadow-rose-950/30',
          indicator: 'bg-rose-400',
          title: 'text-rose-200',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'pendente':
      default:
        return {
          container: 'border-amber-500/40 bg-slate-900/95 hover:border-amber-500/70 shadow-slate-950/50',
          indicator: 'bg-amber-400',
          title: 'text-white',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
    }
  };

  const statusTheme = getStatusTheme(task.status);

  if (compact) {
    return (
      <div 
        className={`p-2.5 rounded-xl border transition-all duration-150 shadow-sm relative overflow-hidden group ${statusTheme.container}`}
      >
        {/* Status Indicator Stripe */}
        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${statusTheme.indicator}`} />

        <div className="pl-1.5">
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.time && (
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                  {task.time}
                </span>
              )}
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${categoryInfo.badgeBg} ${categoryInfo.badgeText} ${categoryInfo.border}`}>
                {categoryInfo.label.split(' ')[0]}
              </span>
            </div>

            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${statusTheme.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusTheme.indicator}`} />
              {statusInfo.label}
            </span>
          </div>

          <h4 className={`text-xs font-semibold leading-snug mb-1 line-clamp-2 ${statusTheme.title}`}>
            {task.title}
          </h4>

          {task.procedureNumber && (
            <div className="text-[10px] font-mono text-amber-400/90 font-medium mb-1.5 truncate flex items-center gap-1">
              <FolderCheck className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{task.procedureNumber}</span>
            </div>
          )}

          {/* Quick Compact Action Buttons */}
          <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/80">
            {/* Status change actions */}
            <div className="flex items-center gap-1 flex-wrap">
              {task.status !== 'concluida' && (
                <button
                  type="button"
                  onClick={() => onQuickStatus(task, 'concluida')}
                  title="Marcar como Concluída"
                  className="p-1 text-emerald-400 hover:text-emerald-200 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded-lg transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
              )}

              {task.status !== 'em_andamento' && (
                <button
                  type="button"
                  onClick={() => onQuickStatus(task, 'em_andamento')}
                  title="Marcar como Em Andamento"
                  className="p-1 text-blue-400 hover:text-blue-200 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 rounded-lg transition"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                </button>
              )}

              {task.status !== 'pendente' && (
                <button
                  type="button"
                  onClick={() => onQuickStatus(task, 'pendente')}
                  title="Recolocar como Pendente"
                  className="p-1 text-amber-400 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-lg transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {task.status !== 'remarcada' && (
                <button
                  type="button"
                  onClick={() => onQuickStatus(task, 'remarcada')}
                  title="Remarcar Atividade"
                  className="p-1 text-purple-400 hover:text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-lg transition"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                </button>
              )}

              {task.status !== 'nao_feita' && (
                <button
                  type="button"
                  onClick={() => onQuickStatus(task, 'nao_feita')}
                  title="Marcar como Não Feita"
                  className="p-1 text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Utility actions */}
            <div className="flex items-center gap-1">
              {onReplicate && (
                <button
                  type="button"
                  onClick={() => onReplicate(task)}
                  title="Replicar em outros dias"
                  className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onEdit(task)}
                title="Editar Tarefa"
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={() => onDelete(task.id)}
                title="Excluir Tarefa"
                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full detailed card
  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-150 shadow-md relative overflow-hidden ${statusTheme.container}`}
    >
      {/* Visual Status Strip */}
      <div className={`absolute top-0 left-0 bottom-0 w-2 ${statusTheme.indicator}`} />

      <div className="pl-2">
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
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusTheme.badge}`}>
            <span className={`w-2 h-2 rounded-full ${statusTheme.indicator}`} />
            {statusInfo.label}
          </span>
        </div>

        {/* Main Title & Procedure */}
        <div className="space-y-1 mb-2.5">
          <h3 className={`text-base font-bold tracking-tight ${statusTheme.title}`}>
            {task.title}
          </h3>

          {task.procedureNumber && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-medium">
              <FolderCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Procedimento: {task.procedureNumber}</span>
            </div>
          )}
        </div>

        {/* Description if present */}
        {task.description && (
          <p className="text-xs text-slate-300 leading-relaxed mb-3 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
            {task.description}
          </p>
        )}

        {/* Special status callouts (Remarcação / Não feita / Concluída) */}
        {task.status === 'remarcada' && (
          <div className="mb-3 p-2.5 bg-purple-950/50 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-start gap-2">
            <CalendarClock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-purple-300">
                Remarcada para: {task.rescheduledTo || 'A definir'}
              </div>
              {task.reason && <div className="text-[11px] text-purple-300/80 mt-0.5">Motivo: {task.reason}</div>}
            </div>
          </div>
        )}

        {task.status === 'nao_feita' && (
          <div className="mb-3 p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-300">Procedimento Não Realizado</div>
              {task.reason && <div className="text-[11px] text-rose-300/80 mt-0.5">Justificativa: {task.reason}</div>}
            </div>
          </div>
        )}

        {task.status === 'concluida' && task.completedAt && (
          <div className="mb-3 p-2 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
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
          {/* Status buttons with distinct colored palettes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Concluir (Emerald) */}
            {task.status !== 'concluida' && (
              <button
                type="button"
                onClick={() => onQuickStatus(task, 'concluida')}
                className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Concluir</span>
              </button>
            )}

            {/* Em Andamento (Blue) */}
            {task.status !== 'em_andamento' && (
              <button
                type="button"
                onClick={() => onQuickStatus(task, 'em_andamento')}
                className="px-2.5 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 hover:text-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Em Andamento</span>
              </button>
            )}

            {/* Recolocar como Pendente (Amber) */}
            {task.status !== 'pendente' && (
              <button
                type="button"
                onClick={() => onQuickStatus(task, 'pendente')}
                className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Pendente</span>
              </button>
            )}

            {/* Remarcar (Purple) */}
            {task.status !== 'remarcada' && (
              <button
                type="button"
                onClick={() => onQuickStatus(task, 'remarcada')}
                className="px-2.5 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 hover:text-purple-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
                <span>Remarcar</span>
              </button>
            )}

            {/* Não Feita (Rose) */}
            {task.status !== 'nao_feita' && (
              <button
                type="button"
                onClick={() => onQuickStatus(task, 'nao_feita')}
                className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Não Feita</span>
              </button>
            )}
          </div>

          {/* Edit, Replicate & Delete tools */}
          <div className="flex items-center gap-1.5 ml-auto">
            {onReplicate && (
              <button
                type="button"
                onClick={() => onReplicate(task)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                title="Replicar Tarefa em Outros Dias"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replicar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition"
              title="Editar Tarefa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-800/60 rounded-xl transition"
              title="Excluir Tarefa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


