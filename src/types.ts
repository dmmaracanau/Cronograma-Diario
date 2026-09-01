export type PoliceTaskStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'remarcada'
  | 'nao_feita'
  | 'cancelada';

export type PoliceTaskCategory =
  | 'oitiva'
  | 'inquerito'
  | 'mandado'
  | 'relatorio'
  | 'plantao'
  | 'expediente'
  | 'pericia'
  | 'audiencia'
  | 'urgente'
  | 'outro';

export type PoliceTaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface TaskTemplate {
  id: string;
  userId: string;
  title: string;
  description?: string;
  procedureNumber?: string;
  category: PoliceTaskCategory;
  priority: PoliceTaskPriority;
  time?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PoliceTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  procedureNumber?: string; // Ex: IP nº 123/2026, TCO 45/2026, BO 789/2026, Ofício 112/2026
  category: PoliceTaskCategory;
  priority: PoliceTaskPriority;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  status: PoliceTaskStatus;
  rescheduledTo?: string; // YYYY-MM-DD if status is 'remarcada'
  reason?: string; // Motivo de remarcação ou de não ter sido feita
  notes?: string; // Anotações do cumprimento / diligência
  assignedBadge?: string; // Matrícula ou nome do agente responsável
  completedAt?: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  badge: string; // Matrícula funcional (ex: 301.992-1-X)
  role: string; // Delegado(a), Inspetor(a), Escrivão/Escrivã, Agente, Operacional, Estagiário
  department: string; // Cartório 1, Cartório 2, Setor de Investigações (GIE), Plantão, Chefia, Expediente
  createdAt: string;
  templatesSeeded?: boolean;
}

export type ViewMode = 'diario' | 'semanal' | 'mensal' | 'tabela' | 'relatorios';
