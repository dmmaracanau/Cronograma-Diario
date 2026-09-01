import React from 'react';
import { 
  Shield, 
  LogOut, 
  Calendar, 
  Clock, 
  Bookmark,
  Edit3,
  FileText
} from 'lucide-react';
import { UserProfile, ViewMode } from '../types';
import { signOut } from '../lib/firebase';

interface HeaderProps {
  userProfile: UserProfile | null;
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
  selectedDate: string;
  totalTasksCount: number;
  completedTasksCount: number;
  onOpenCatalog?: () => void;
  isBatchMode?: boolean;
  onToggleBatchMode?: () => void;
  selectedBatchCount?: number;
  onOpenPdfModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  activeView,
  setActiveView,
  selectedDate,
  totalTasksCount,
  completedTasksCount,
  onOpenCatalog,
  isBatchMode = false,
  onToggleBatchMode,
  selectedBatchCount = 0,
  onOpenPdfModal,
}) => {
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isWeekly = activeView === 'semanal';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="w-full px-3 sm:px-5 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Logo & Entity Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center text-amber-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  PCCE • 1ª DP
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sincronizado
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                1ª Delegacia de Polícia de Maracanaú
              </h1>
            </div>
          </div>

          {/* Center/Right: Primary View Toggle + User Actions + Batch Edit + PDF Export */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Primary Toggle: Semanal / Diário */}
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <button
                id="btn-toggle-semanal"
                onClick={() => setActiveView('semanal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isWeekly
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Visualização da Semana Completa"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Visão Semanal</span>
              </button>

              <button
                id="btn-toggle-diario"
                onClick={() => setActiveView('diario')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  !isWeekly
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Visualização Detalhada do Dia"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Visão Diária</span>
              </button>
            </div>

            {/* Quick Catalog Opener */}
            {onOpenCatalog && (
              <button
                onClick={onOpenCatalog}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
                title="Abrir Catálogo de Procedimentos"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                <span>Catálogo</span>
              </button>
            )}

            {/* User Profile Pill */}
            {userProfile && (
              <div className="hidden lg:flex items-center gap-2.5 bg-slate-800/70 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                <div className="w-6 h-6 rounded-md bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-[11px]">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="text-left text-[11px] leading-tight">
                  <div className="font-semibold text-slate-100 flex items-center gap-1">
                    <span>{userProfile.name}</span>
                    <span className="text-[10px] font-mono text-amber-400">
                      ({userProfile.badge})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PDF Export Icon Button - Located right beside user name */}
            {onOpenPdfModal && (
              <button
                id="btn-open-pdf-modal"
                onClick={onOpenPdfModal}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-xl transition shadow-sm flex items-center justify-center"
                title="Gerar e Exportar Cronograma em PDF (Diário, Semanal ou Mensal)"
              >
                <FileText className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Batch Edit Action Icon-Only Button - Located right beside user name */}
            {onToggleBatchMode && (
              <button
                id="btn-toggle-batch-mode"
                onClick={onToggleBatchMode}
                className={`p-2 rounded-xl transition border shadow-sm relative flex items-center justify-center ${
                  isBatchMode
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-950 ring-2 ring-rose-400/50 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                }`}
                title={
                  isBatchMode 
                    ? `Modo Edição em Lote Ativo (${selectedBatchCount} selecionados) - Clique para desativar` 
                    : 'Editar em Lote (seleção múltipla para concluir ou excluir)'
                }
              >
                <Edit3 className={`w-4 h-4 ${isBatchMode ? 'text-white' : 'text-amber-400'}`} />
                {isBatchMode && selectedBatchCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center border border-slate-900 shadow">
                    {selectedBatchCount}
                  </span>
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Encerrar Sessão"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 flex items-center gap-1 text-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


