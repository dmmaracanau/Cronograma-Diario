import { PoliceTaskCategory, PoliceTaskPriority } from '../types';

export interface QuickTaskTemplate {
  title: string;
  category: PoliceTaskCategory;
  priority: PoliceTaskPriority;
  time: string;
  description: string;
  procedureNumber?: string;
}

export const POLICE_TASK_CATEGORIES: {
  id: PoliceTaskCategory;
  label: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  iconName: string;
}[] = [
  {
    id: 'oitiva',
    label: 'Oitiva / Depoimento',
    color: '#2563eb',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    iconName: 'Users',
  },
  {
    id: 'inquerito',
    label: 'Inquérito Policial (IP)',
    color: '#4f46e5',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconName: 'FolderCheck',
  },
  {
    id: 'mandado',
    label: 'Mandado / Diligência',
    color: '#dc2626',
    badgeBg: 'bg-red-50 dark:bg-red-950/40',
    badgeText: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    iconName: 'ShieldAlert',
  },
  {
    id: 'relatorio',
    label: 'Relatório Policial',
    color: '#0891b2',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    iconName: 'FileText',
  },
  {
    id: 'plantao',
    label: 'Plantão / Atendimento',
    color: '#d97706',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    iconName: 'Clock',
  },
  {
    id: 'pericia',
    label: 'Perícia / PEFOCE',
    color: '#9333ea',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    iconName: 'Microscope',
  },
  {
    id: 'audiencia',
    label: 'Audiência / Fórum',
    color: '#059669',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconName: 'Scale',
  },
  {
    id: 'expediente',
    label: 'Expediente / Despacho',
    color: '#475569',
    badgeBg: 'bg-slate-50 dark:bg-slate-800/40',
    badgeText: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    iconName: 'Briefcase',
  },
  {
    id: 'urgente',
    label: 'Urgência / Flagrante',
    color: '#e11d48',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40',
    badgeText: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    iconName: 'AlertTriangle',
  },
  {
    id: 'outro',
    label: 'Geral / Outros',
    color: '#64748b',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800',
    badgeText: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-200 dark:border-zinc-700',
    iconName: 'CheckSquare',
  },
];

export const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: string; dot: string }> = {
  pendente: {
    label: 'Pendente',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: 'Circle',
    dot: 'bg-slate-400',
  },
  em_andamento: {
    label: 'Em Andamento',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    icon: 'PlayCircle',
    dot: 'bg-blue-500',
  },
  concluida: {
    label: 'Concluída',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: 'CheckCircle2',
    dot: 'bg-emerald-500',
  },
  remarcada: {
    label: 'Remarcada',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-700',
    icon: 'CalendarClock',
    dot: 'bg-amber-500',
  },
  nao_feita: {
    label: 'Não Feita',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-700',
    icon: 'XCircle',
    dot: 'bg-rose-500',
  },
  cancelada: {
    label: 'Cancelada',
    bg: 'bg-zinc-100 dark:bg-zinc-800/60',
    text: 'text-zinc-500 dark:text-zinc-400',
    border: 'border-zinc-300 dark:border-zinc-700',
    icon: 'Ban',
    dot: 'bg-zinc-400',
  },
};

export const DEFAULT_TASK_TEMPLATES: Omit<QuickTaskTemplate, 'time'>[] = [
  {
    title: 'Oitiva de testemunha / vítima',
    category: 'oitiva',
    priority: 'alta',
    procedureNumber: 'IP nº ___/2026',
    description: 'Tomada de declarações e termo de depoimento formal no cartório policial da 1ª DP.',
  },
  {
    title: 'Interrogatório de investigado / suspeito',
    category: 'oitiva',
    priority: 'urgente',
    procedureNumber: 'IP nº ___/2026',
    description: 'Interrogatório formal de qualificação e declarações do indiciado com termo cartorário.',
  },
  {
    title: 'Despacho ordinatório e juntada de peças',
    category: 'inquerito',
    priority: 'media',
    procedureNumber: 'IP nº ___/2026',
    description: 'Conclusão dos autos à autoridade policial para despacho de diligências ou remessa.',
  },
  {
    title: 'Cumprimento de mandado de busca e apreensão',
    category: 'mandado',
    priority: 'urgente',
    procedureNumber: 'Mandado nº ___/2026',
    description: 'Operação de campo pelo setor de investigações (GIE) com auto de apreensão circunstanciado.',
  },
  {
    title: 'Elaboração de Relatório Policial de Investigação',
    category: 'relatorio',
    priority: 'alta',
    procedureNumber: 'IP nº ___/2026',
    description: 'Relatório conclusivo circunstanciado de diligências com elementos informativos.',
  },
  {
    title: 'Remessa de autos ao Poder Judiciário / MPCE',
    category: 'expediente',
    priority: 'alta',
    procedureNumber: 'Ofício nº ___/2026',
    description: 'Remessa e carga eletrônica via sistema judiciário da Comarca de Maracanaú.',
  },
  {
    title: 'Requisição / Acompanhamento de Perícia PEFOCE',
    category: 'pericia',
    priority: 'media',
    procedureNumber: 'IP nº ___/2026',
    description: 'Cobrança e juntada de laudo pericial (balística, DNA, traumatológico, necroscópico).',
  },
  {
    title: 'Audiência Judicial na Vara Criminal de Maracanaú',
    category: 'audiencia',
    priority: 'alta',
    procedureNumber: 'Proc. nº ___/2026',
    description: 'Comparecimento de policiais civis para depoimento judicial no Fórum.',
  },
];
