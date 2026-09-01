import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  FolderCheck, 
  CheckCircle2, 
  Clock, 
  CalendarClock, 
  XCircle, 
  Edit3, 
  Trash2, 
  ArrowUpDown,
  Plus,
  Copy
} from 'lucide-react';
import { PoliceTask, PoliceTaskCategory, PoliceTaskPriority, PoliceTaskStatus } from '../types';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

interface TableViewProps {
  tasks: PoliceTask[];
  onAddTask: () => void;
  onEditTask: (task: PoliceTask) => void;
  onDeleteTask: (taskId: string) => void;
  onQuickStatus: (task: PoliceTask, status: PoliceTaskStatus) => void;
  onReplicateTask?: (task: PoliceTask) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onQuickStatus,
  onReplicateTask,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('todos');
  const [sortField, setSortField] = useState<'date' | 'title' | 'status' | 'category'>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.procedureNumber && t.procedureNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'todos' || t.status === statusFilter;
      const matchCategory = categoryFilter === 'todos' || t.category === categoryFilter;
      const matchPriority = priorityFilter === 'todos' || t.priority === priorityFilter;

      return matchSearch && matchStatus && matchCategory && matchPriority;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const dateA = `${a.date} ${a.time || '00:00'}`;
        const dateB = `${b.date} ${b.time || '00:00'}`;
        comparison = dateA.localeCompare(dateB);
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [tasks, searchQuery, statusFilter, categoryFilter, priorityFilter, sortField, sortAsc]);

  const toggleSort = (field: 'date' | 'title' | 'status' | 'category') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const headers = ['Data', 'Horario', 'Procedimento', 'Titulo', 'Categoria', 'Prioridade', 'Status', 'Remarcada_Para', 'Motivo', 'Observacoes'];
    const rows = filteredTasks.map((t) => [
      t.date,
      t.time || '',
      `"${(t.procedureNumber || '').replace(/"/g, '""')}"`,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      t.rescheduledTo || '',
      `"${(t.reason || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cronograma_1dp_maracanau_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Controls & Search Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por IP, TCO, título, vítima/testemunha..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onAddTask}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluída</option>
              <option value="remarcada">Remarcada</option>
              <option value="nao_feita">Não Feita</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="todos">Todas Categorias</option>
              {POLICE_TASK_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
            >
              <option value="todos">Todas Prioridades</option>
              <option value="urgente">Urgente / Flagrante</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operational Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th
                  onClick={() => toggleSort('date')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Data / Hora</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5">Procedimento</th>
                <th
                  onClick={() => toggleSort('title')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Título & Diligência</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('category')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoria</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="px-4 py-3.5 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">Ações Operacionais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Nenhum registro correspondente aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category) || POLICE_TASK_CATEGORIES[0];
                  const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendente;

                  return (
                    <tr key={task.id} className="hover:bg-slate-800/50 transition duration-150">
                      {/* Date & Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {task.date.split('-').reverse().join('/')}
                        </div>
                        <div className="text-[10px] font-mono text-amber-400/90 font-medium">
                          {task.time || '--:--'}
                        </div>
                      </td>

                      {/* Procedure */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.procedureNumber ? (
                          <span className="font-mono font-semibold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {task.procedureNumber}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">--</span>
                        )}
                      </td>

                      {/* Title & Description */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-100 line-clamp-1">{task.title}</div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                        {task.reason && (
                          <div className="text-[10px] text-amber-300/80 italic mt-0.5">
                            Obs: {task.reason}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.badgeBg} ${cat.badgeText} ${cat.border}`}>
                          {cat.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status !== 'concluida' && (
                            <button
                              onClick={() => onQuickStatus(task, 'concluida')}
                              title="Marcar como Concluída"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {task.status !== 'remarcada' && (
                            <button
                              onClick={() => onQuickStatus(task, 'remarcada')}
                              title="Remarcar Tarefa"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded-lg transition"
                            >
                              <CalendarClock className="w-4 h-4" />
                            </button>
                          )}
                          {task.status !== 'nao_feita' && (
                            <button
                              onClick={() => onQuickStatus(task, 'nao_feita')}
                              title="Marcar como Não Feita"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {onReplicateTask && (
                            <button
                              onClick={() => onReplicateTask(task)}
                              title="Replicar Tarefa para Outros Dias"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded-lg transition"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditTask(task)}
                            title="Editar Tarefa"
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            title="Excluir Tarefa"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer count */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div>Exibindo {filteredTasks.length} de {tasks.length} registros cadastrados</div>
          <div className="text-[11px] text-slate-500">1ª Delegacia de Polícia de Maracanaú • PCCE</div>
        </div>
      </div>
    </div>
  );
};
