import React from 'react';
import { 
  Shield, 
  User as UserIcon, 
  LogOut, 
  Calendar, 
  Clock, 
  Wifi, 
  FileText, 
  CheckCircle2, 
  Layers
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
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  activeView,
  setActiveView,
  selectedDate,
  totalTasksCount,
  completedTasksCount,
}) => {
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Format today date nicely in PT-BR
  const formattedToday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const completionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Police Banner */}
      <div className="w-full px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between py-3 border-b border-slate-800/80 gap-4 flex-wrap">
          {/* Logo & Entity Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  PCCE • 1ª DP
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tempo Real Ativo
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                1ª Delegacia de Polícia de Maracanaú
              </h1>
            </div>
          </div>

          {/* User Profile Card & Quick Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {userProfile && (
              <div className="hidden sm:flex items-center gap-3 bg-slate-800/70 border border-slate-700/80 px-3.5 py-1.5 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-xs">
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>{userProfile.name}</span>
                    <span className="text-[10px] font-mono text-amber-400/90 font-normal">
                      Mat. {userProfile.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span>{userProfile.role}</span>
                    <span>•</span>
                    <span className="text-slate-400">{userProfile.department}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Encerrar Sessão"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition border border-transparent hover:border-slate-700 flex items-center gap-1.5 text-xs font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Diário, Semanal, Mensal, Tabela, Relatórios) */}
        <div className="flex items-center justify-between pt-2 pb-1 overflow-x-auto no-scrollbar gap-2">
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <button
              id="tab-view-diario"
              onClick={() => setActiveView('diario')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeView === 'diario'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Visão Diária</span>
            </button>

            <button
              id="tab-view-semanal"
              onClick={() => setActiveView('semanal')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeView === 'semanal'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Visão Semanal</span>
            </button>

            <button
              id="tab-view-mensal"
              onClick={() => setActiveView('mensal')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeView === 'mensal'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Visão Mensal</span>
            </button>

            <button
              id="tab-view-tabela"
              onClick={() => setActiveView('tabela')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeView === 'tabela'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tabela Operacional</span>
            </button>

            <button
              id="tab-view-relatorios"
              onClick={() => setActiveView('relatorios')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 whitespace-nowrap ${
                activeView === 'relatorios'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Pauta / Relatórios</span>
            </button>
          </nav>

          {/* Quick Realtime Counter Pill */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
            <span className="capitalize">{formattedToday}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
