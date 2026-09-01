import React, { useMemo } from 'react';
import { 
  Printer, 
  Shield, 
  FileText, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  XCircle, 
  TrendingUp,
  Award,
  Layers,
  FileCheck
} from 'lucide-react';
import { PoliceTask, UserProfile } from '../types';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

interface ProductivityReportsProps {
  tasks: PoliceTask[];
  selectedDate: string;
  userProfile: UserProfile | null;
}

export const ProductivityReports: React.FC<ProductivityReportsProps> = ({
  tasks,
  selectedDate,
  userProfile,
}) => {
  // Tasks for the selected date (for the daily docket)
  const dayTasks = useMemo(() => {
    return tasks.filter((t) => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const concluidas = tasks.filter((t) => t.status === 'concluida').length;
    const emAndamento = tasks.filter((t) => t.status === 'em_andamento').length;
    const pendentes = tasks.filter((t) => t.status === 'pendente').length;
    const remarcadas = tasks.filter((t) => t.status === 'remarcada').length;
    const naoFeitas = tasks.filter((t) => t.status === 'nao_feita').length;
    const rate = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    // Category distribution
    const categoryCounts: Record<string, number> = {};
    POLICE_TASK_CATEGORIES.forEach((c) => {
      categoryCounts[c.id] = tasks.filter((t) => t.category === c.id).length;
    });

    return { total, concluidas, emAndamento, pendentes, remarcadas, naoFeitas, rate, categoryCounts };
  }, [tasks]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(selectedDate + 'T00:00:00'));

  return (
    <div className="space-y-6">
      {/* Top Banner with Print Trigger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Pauta Oficial & Relatório de Produtividade</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pauta diária de expedientes e métricas consolidadas do servidor na 1ª DP de Maracanaú
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Gerar PDF da Pauta</span>
        </button>
      </div>

      {/* Productivity Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Global Efficiency Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Taxa Geral de Eficiência</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">
              {stats.rate}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stats.concluidas} procedimentos concluídos de {stats.total} cadastrados no cronograma.
            </p>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        {/* Procedures Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Status dos Procedimentos</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Concluídas
              </span>
              <span className="font-bold text-white">{stats.concluidas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <Clock className="w-3.5 h-3.5" /> Em Andamento / Diligência
              </span>
              <span className="font-bold text-white">{stats.emAndamento}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <CalendarClock className="w-3.5 h-3.5" /> Remarcadas
              </span>
              <span className="font-bold text-white">{stats.remarcadas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Não Feitas
              </span>
              <span className="font-bold text-white">{stats.naoFeitas}</span>
            </div>
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Principais Categorias</span>
            <FileCheck className="w-4 h-4 text-purple-400" />
          </div>

          <div className="space-y-2 text-xs max-h-36 overflow-y-auto no-scrollbar">
            {POLICE_TASK_CATEGORIES.map((cat) => {
              const count = stats.categoryCounts[cat.id] || 0;
              if (count === 0) return null;
              return (
                <div key={cat.id} className="flex items-center justify-between">
                  <span className="text-slate-300 truncate max-w-[140px]">{cat.label}</span>
                  <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Printable Official Police Docket (Pauta do Dia) */}
      <div 
        id="printable-docket" 
        className="bg-white text-slate-950 rounded-2xl p-8 shadow-2xl border border-slate-200 print:m-0 print:p-0 print:border-none print:shadow-none"
      >
        {/* Official Header */}
        <div className="text-center pb-6 border-b-2 border-slate-900 mb-6 space-y-1">
          <div className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
            ESTADO DO CEARÁ • SECRETARIA DA SEGURANÇA PÚBLICA E DEFESA SOCIAL
          </div>
          <div className="text-sm font-black uppercase tracking-wider text-slate-900">
            POLÍCIA CIVIL DO ESTADO DO CEARÁ • PCCE
          </div>
          <div className="text-base font-extrabold text-blue-950">
            1ª DELEGACIA DE POLÍCIA DE MARACANAÚ
          </div>
          <div className="text-xs font-bold text-amber-800 uppercase tracking-wide pt-1">
            PAUTA DIÁRIA DE OITIVAS, AUDIÊNCIAS E EXPEDIENTES
          </div>
        </div>

        {/* Docket Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-xl mb-6 text-xs border border-slate-300">
          <div>
            <span className="font-bold text-slate-700 block">Data da Pauta:</span>
            <span className="font-extrabold text-slate-900 capitalize">{formattedDate}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700 block">Servidor Responsável:</span>
            <span className="font-extrabold text-slate-900">{userProfile?.name || 'Servidor Policial'}</span>
          </div>
          <div>
            <span className="font-bold text-slate-700 block">Cargo / Matrícula:</span>
            <span className="font-extrabold text-slate-900">{userProfile?.role} (Mat. {userProfile?.badge})</span>
          </div>
          <div>
            <span className="font-bold text-slate-700 block">Lotação / Setor:</span>
            <span className="font-extrabold text-slate-900">{userProfile?.department}</span>
          </div>
        </div>

        {/* Docket Tasks Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px]">
                <th className="border border-slate-300 px-3 py-2 text-center w-16">Horário</th>
                <th className="border border-slate-300 px-3 py-2 w-32">Procedimento</th>
                <th className="border border-slate-300 px-3 py-2">Diligência / Descrição da Tarefa</th>
                <th className="border border-slate-300 px-3 py-2 w-28">Categoria</th>
                <th className="border border-slate-300 px-3 py-2 text-center w-24">Status</th>
                <th className="border border-slate-300 px-3 py-2 w-32">Certidão / Rubrica</th>
              </tr>
            </thead>
            <tbody>
              {dayTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-slate-300 px-4 py-8 text-center text-slate-500 italic">
                    Nenhuma diligência agendada na pauta deste dia.
                  </td>
                </tr>
              ) : (
                dayTasks.map((t, idx) => (
                  <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 px-3 py-2.5 font-mono font-bold text-center">
                      {t.time || '--:--'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 font-mono font-bold text-slate-900">
                      {t.procedureNumber || 'S/N'}
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5">
                      <div className="font-bold text-slate-900">{t.title}</div>
                      {t.description && <div className="text-[11px] text-slate-600 mt-0.5">{t.description}</div>}
                      {t.reason && <div className="text-[10px] text-amber-800 italic mt-0.5">Obs: {t.reason}</div>}
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 font-semibold text-slate-700 capitalize">
                      {t.category}
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 text-center font-bold">
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded border border-slate-400 bg-slate-100">
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="border border-slate-300 px-3 py-2.5 text-slate-400 text-center">
                      _________________
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-800 pt-2 font-bold">
              {userProfile?.name || 'Servidor Responsável'}
            </div>
            <div className="text-[11px] text-slate-600">
              {userProfile?.role || 'Servidor Policial'} • 1ª DP Maracanaú
            </div>
          </div>

          <div>
            <div className="border-t border-slate-800 pt-2 font-bold">
              Autoridade Policial / Delegado Titular
            </div>
            <div className="text-[11px] text-slate-600">
              1ª Delegacia de Polícia de Maracanaú - PCCE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
