import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  Calendar,
  CalendarDays,
  CalendarRange,
  Shield,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PoliceTask, UserProfile } from '../types';
import {
  exportDailySchedulePdf,
  exportWeeklySchedulePdf,
  exportMonthlySchedulePdf,
  formatPtBrDate,
  formatShortDate
} from '../utils/pdfExport';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PoliceTask[];
  selectedDate: string;
  userProfile?: UserProfile | null;
}

type ExportType = 'diario' | 'semanal' | 'mensal';

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  selectedDate,
  userProfile,
}) => {
  const [exportType, setExportType] = useState<ExportType>('diario');
  const [customDate, setCustomDate] = useState(selectedDate);
  const [customMonth, setCustomMonth] = useState(() => {
    const [, m] = selectedDate.split('-').map(Number);
    return m ? m - 1 : new Date().getMonth();
  });
  const [customYear, setCustomYear] = useState(() => {
    const [y] = selectedDate.split('-').map(Number);
    return y || new Date().getFullYear();
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute stats based on current export type
  let countToExport = 0;
  let periodDescription = '';

  if (exportType === 'diario') {
    const dayTasks = tasks.filter((t) => t.date === customDate);
    countToExport = dayTasks.length;
    periodDescription = formatPtBrDate(customDate);
  } else if (exportType === 'semanal') {
    const [year, month, day] = customDate.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);
    const dayOfWeek = baseDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    countToExport = tasks.filter((t) => weekDays.includes(t.date)).length;
    periodDescription = `Semana de ${formatShortDate(weekDays[0])} a ${formatShortDate(weekDays[6])}`;
  } else if (exportType === 'mensal') {
    const monthPrefix = `${customYear}-${String(customMonth + 1).padStart(2, '0')}`;
    countToExport = tasks.filter((t) => t.date.startsWith(monthPrefix)).length;
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    periodDescription = `${monthNames[customMonth]} de ${customYear}`;
  }

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    setTimeout(() => {
      try {
        if (exportType === 'diario') {
          exportDailySchedulePdf(customDate, tasks, userProfile);
        } else if (exportType === 'semanal') {
          exportWeeklySchedulePdf(customDate, tasks, userProfile);
        } else if (exportType === 'mensal') {
          exportMonthlySchedulePdf(customYear, customMonth, tasks, userProfile);
        }
        setSuccessMessage('PDF gerado e exportado com sucesso!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 4000);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-slate-950/80">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Exportar Cronograma em PDF</span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  PCCE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere documentos oficiais formatados, sem cortes e com dados completos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Type Selector (Diário / Semanal / Mensal) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Selecione o Tipo de Cronograma
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('diario')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  exportType === 'diario'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 shadow-md shadow-amber-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold">Diário</span>
                <span className="text-[10px] opacity-70">Pauta do Dia</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('semanal')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  exportType === 'semanal'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 shadow-md shadow-amber-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs font-bold">Semanal</span>
                <span className="text-[10px] opacity-70">7 Dias Agrupados</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('mensal')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  exportType === 'mensal'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30 shadow-md shadow-amber-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                <span className="text-xs font-bold">Mensal</span>
                <span className="text-[10px] opacity-70">Mês Completo</span>
              </button>
            </div>
          </div>

          {/* Date Picker Controls */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. Período de Referência
            </label>

            {exportType === 'diario' && (
              <div>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {exportType === 'semanal' && (
              <div>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  title="Selecione qualquer dia da semana desejada"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  O relatório abrangerá automaticamente de segunda-feira a domingo da semana selecionada.
                </p>
              </div>
            )}

            {exportType === 'mensal' && (
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={customMonth}
                  onChange={(e) => setCustomMonth(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {[
                    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ].map((mName, idx) => (
                    <option key={idx} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={customYear}
                  onChange={(e) => setCustomYear(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Preview Details Box */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Período Selecionado:</span>
              <span className="text-white font-bold capitalize">{periodDescription}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Procedimentos Incluídos:</span>
              <span className="text-amber-400 font-bold font-mono">
                {countToExport} {countToExport === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 font-medium">Policial Responsável:</span>
              <span className="text-slate-200 font-semibold">
                {userProfile?.name || 'Não identificado'} ({userProfile?.badge || 'S/M'})
              </span>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGeneratePdf}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Gerar e Salvar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
