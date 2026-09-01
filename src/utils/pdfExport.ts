import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PoliceTask, UserProfile } from '../types';
import { POLICE_TASK_CATEGORIES, STATUS_CONFIG } from '../data/policeTemplates';

// Helper to format date in Brazilian format
export const formatPtBrDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatShortDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

// Status Colors for PDF (RGB)
const STATUS_COLORS: Record<string, { bg: [number, number, number]; text: [number, number, number]; label: string }> = {
  concluida: { bg: [209, 250, 229], text: [6, 95, 70], label: 'CONCLUÍDA' },
  em_andamento: { bg: [219, 234, 254], text: [30, 64, 175], label: 'EM ANDAMENTO' },
  pendente: { bg: [254, 243, 199], text: [146, 64, 14], label: 'PENDENTE' },
  remarcada: { bg: [243, 232, 255], text: [107, 33, 168], label: 'REMARCADA' },
  nao_feita: { bg: [254, 226, 226], text: [153, 27, 27], label: 'NÃO REALIZADA' },
  cancelada: { bg: [241, 245, 249], text: [71, 85, 105], label: 'CANCELADA' },
};

const PRIORITY_LABELS: Record<string, string> = {
  alta: 'ALTA',
  media: 'MÉDIA',
  baixa: 'BAIXA',
};

// Add standard Police header to doc
const addPoliceHeader = (doc: jsPDF, title: string, subtitle: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent line
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('POLÍCIA CIVIL DO ESTADO DO CEARÁ', pageWidth / 2, 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('1ª DELEGACIA DE POLÍCIA DE MARACANAÚ — SISTEMA DE GESTÃO OPERACIONAL', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(title.toUpperCase(), pageWidth / 2, 22, { align: 'center' });

  // Subtitle / Period line
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(subtitle, 14, 36);
};

// Add footer with timestamp and page numbers
const addPageNumbersAndFooter = (doc: jsPDF) => {
  const totalPages = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const formattedNow = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // slate-500

    doc.text(
      `Documento oficial gerado em ${formattedNow} | 1ª DP de Maracanaú / PCCE`,
      14,
      pageHeight - 7
    );

    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 7,
      { align: 'right' }
    );
  }
};

// Add officer signature block at the bottom of the last page
const addSignatureBlock = (doc: jsPDF, userProfile?: UserProfile | null) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 14 : 200;

  let startY = currentY;
  // If not enough room for signature block on current page, add new page
  if (startY > pageHeight - 40) {
    doc.addPage();
    startY = 35;
  }

  const officerName = userProfile?.name || 'Policial Civil Responsável';
  const officerBadge = userProfile?.badge ? `Matrícula / ID: ${userProfile.badge}` : '1ª DP de Maracanaú';

  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.6);

  // Left signature (Officer)
  const leftX = 25;
  const sigWidth = 65;
  doc.line(leftX, startY + 12, leftX + sigWidth, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(officerName, leftX + sigWidth / 2, startY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(officerBadge, leftX + sigWidth / 2, startY + 21, { align: 'center' });

  // Right signature (Authority)
  const rightX = pageWidth - 25 - sigWidth;
  doc.line(rightX, startY + 12, rightX + sigWidth, startY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Autoridade Policial / Delegado', rightX + sigWidth / 2, startY + 17, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Titular da 1ª DP de Maracanaú', rightX + sigWidth / 2, startY + 21, { align: 'center' });
};

// ==========================================
// 1. EXPORT CRONOGRAMA DIÁRIO
// ==========================================
export const exportDailySchedulePdf = (
  dateStr: string,
  tasks: PoliceTask[],
  userProfile?: UserProfile | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dayTasks = tasks.filter((t) => t.date === dateStr);
  const formattedDate = formatPtBrDate(dateStr);
  const total = dayTasks.length;
  const concluidas = dayTasks.filter((t) => t.status === 'concluida').length;
  const emAndamento = dayTasks.filter((t) => t.status === 'em_andamento').length;
  const pendentes = dayTasks.filter((t) => t.status === 'pendente').length;
  const remarcadas = dayTasks.filter((t) => t.status === 'remarcada').length;
  const naoFeitas = dayTasks.filter((t) => t.status === 'nao_feita').length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  addPoliceHeader(
    doc,
    'CRONOGRAMA E PAUTA OPERACIONAL DIÁRIA',
    `Data de Referência: ${formattedDate}`
  );

  // Summary Metrics Box
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(14, 40, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`POLICIAL: ${userProfile?.name || 'Não identificado'} (${userProfile?.badge || 'S/M'})`, 18, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total de Atividades: ${total} | Concluídas: ${concluidas} (${taxaConclusao}%) | Andamento: ${emAndamento} | Pendentes: ${pendentes} | Remarcadas: ${remarcadas} | Não Feitas: ${naoFeitas}`,
    18,
    52
  );

  // Prepare table data
  const tableData = dayTasks.map((task, index) => {
    const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category)?.label || task.category;
    const stConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendente;
    const priority = PRIORITY_LABELS[task.priority] || 'ALTA';
    
    let details = `${task.title}`;
    if (task.procedureNumber) {
      details += `\n[Procedimento: ${task.procedureNumber}]`;
    }
    if (task.description) {
      details += `\n${task.description}`;
    }
    if (task.status === 'remarcada' && task.rescheduledTo) {
      details += `\n* Remarcado para: ${formatShortDate(task.rescheduledTo)} ${task.reason ? `(Motivo: ${task.reason})` : ''}`;
    }
    if (task.status === 'nao_feita' && task.reason) {
      details += `\n* Justificativa: ${task.reason}`;
    }
    if (task.notes) {
      details += `\n* Observação: ${task.notes}`;
    }

    return [
      String(index + 1).padStart(2, '0'),
      priority,
      cat,
      details,
      stConfig.label.toUpperCase(),
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', '-', 'Nenhum procedimento ou expediente agendado para esta data.', '-']);
  }

  autoTable(doc, {
    startY: 60,
    head: [['#', 'PRIORIDADE', 'CATEGORIA', 'PROCEDIMENTO / DESCRIÇÃO COMPLETA', 'STATUS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      valign: 'top',
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Colorize Status column cells
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw || '').toLowerCase();
        if (text.includes('conclu')) {
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fillColor = [209, 250, 229];
        } else if (text.includes('andamento')) {
          data.cell.styles.textColor = [30, 64, 175];
          data.cell.styles.fillColor = [219, 234, 254];
        } else if (text.includes('pendente')) {
          data.cell.styles.textColor = [146, 64, 14];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (text.includes('remarcada')) {
          data.cell.styles.textColor = [107, 33, 168];
          data.cell.styles.fillColor = [243, 232, 255];
        } else if (text.includes('não') || text.includes('nao')) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { top: 32, bottom: 18, left: 14, right: 14 },
  });

  addSignatureBlock(doc, userProfile);
  addPageNumbersAndFooter(doc);

  const fileName = `Cronograma_Diario_${dateStr}_PCCE.pdf`;
  doc.save(fileName);
};

// ==========================================
// 2. EXPORT CRONOGRAMA SEMANAL
// ==========================================
export const exportWeeklySchedulePdf = (
  selectedDate: string,
  tasks: PoliceTask[],
  userProfile?: UserProfile | null
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const [year, month, day] = selectedDate.split('-').map(Number);
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

  const startDayFormatted = formatShortDate(weekDays[0]);
  const endDayFormatted = formatShortDate(weekDays[6]);

  const weekTasks = tasks.filter((t) => weekDays.includes(t.date));
  const total = weekTasks.length;
  const concluidas = weekTasks.filter((t) => t.status === 'concluida').length;
  const emAndamento = weekTasks.filter((t) => t.status === 'em_andamento').length;
  const pendentes = weekTasks.filter((t) => t.status === 'pendente').length;
  const remarcadas = weekTasks.filter((t) => t.status === 'remarcada').length;
  const naoFeitas = weekTasks.filter((t) => t.status === 'nao_feita').length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  addPoliceHeader(
    doc,
    'CRONOGRAMA E PAUTA OPERACIONAL SEMANAL',
    `Semana Operacional: ${startDayFormatted} a ${endDayFormatted}`
  );

  // Summary Metrics Box
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 40, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`POLICIAL: ${userProfile?.name || 'Não identificado'} (${userProfile?.badge || 'S/M'})`, 18, 45.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Total na Semana: ${total} itens | Concluídas: ${concluidas} (${taxaConclusao}%) | Em Andamento: ${emAndamento} | Pendentes: ${pendentes} | Remarcadas: ${remarcadas} | Não Feitas: ${naoFeitas}`,
    18,
    50.5
  );

  // Table rows with date grouping
  const tableData: any[] = [];
  const weekDaysLabels = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

  weekDays.forEach((dateStr, idx) => {
    const dayList = tasks.filter((t) => t.date === dateStr);
    const dayLabel = `${weekDaysLabels[idx]} (${formatShortDate(dateStr)})`;

    if (dayList.length === 0) {
      tableData.push([
        dayLabel,
        '-',
        '-',
        '-',
        'Nenhum procedimento agendado',
        '-',
      ]);
    } else {
      dayList.forEach((task, tIdx) => {
        const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category)?.label || task.category;
        const stConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendente;
        const priority = PRIORITY_LABELS[task.priority] || 'ALTA';

        let details = `${task.title}`;
        if (task.procedureNumber) details += `\n[Procedimento: ${task.procedureNumber}]`;
        if (task.description) details += `\n${task.description}`;
        if (task.status === 'remarcada' && task.rescheduledTo) {
          details += `\n* Remarcado p/: ${formatShortDate(task.rescheduledTo)} ${task.reason ? `(${task.reason})` : ''}`;
        }
        if (task.status === 'nao_feita' && task.reason) {
          details += `\n* Justificativa: ${task.reason}`;
        }
        if (task.notes) {
          details += `\n* Obs: ${task.notes}`;
        }

        tableData.push([
          tIdx === 0 ? dayLabel : '',
          String(tIdx + 1).padStart(2, '0'),
          priority,
          cat,
          details,
          stConfig.label.toUpperCase(),
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: 58,
    head: [['DIA / DATA', '#', 'PRIORIDADE', 'CATEGORIA', 'PROCEDIMENTO / DESCRIÇÃO DETALHADA', 'STATUS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'top',
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 26, halign: 'left', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw || '').toLowerCase();
        if (text.includes('conclu')) {
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fillColor = [209, 250, 229];
        } else if (text.includes('andamento')) {
          data.cell.styles.textColor = [30, 64, 175];
          data.cell.styles.fillColor = [219, 234, 254];
        } else if (text.includes('pendente')) {
          data.cell.styles.textColor = [146, 64, 14];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (text.includes('remarcada')) {
          data.cell.styles.textColor = [107, 33, 168];
          data.cell.styles.fillColor = [243, 232, 255];
        } else if (text.includes('não') || text.includes('nao')) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { top: 32, bottom: 18, left: 14, right: 14 },
  });

  addSignatureBlock(doc, userProfile);
  addPageNumbersAndFooter(doc);

  const fileName = `Cronograma_Semanal_${weekDays[0]}_a_${weekDays[6]}_PCCE.pdf`;
  doc.save(fileName);
};

// ==========================================
// 3. EXPORT CRONOGRAMA MENSAL
// ==========================================
export const exportMonthlySchedulePdf = (
  year: number,
  monthIndex: number, // 0-11
  tasks: PoliceTask[],
  userProfile?: UserProfile | null
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  const monthTasks = tasks
    .filter((t) => t.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const total = monthTasks.length;
  const concluidas = monthTasks.filter((t) => t.status === 'concluida').length;
  const emAndamento = monthTasks.filter((t) => t.status === 'em_andamento').length;
  const pendentes = monthTasks.filter((t) => t.status === 'pendente').length;
  const remarcadas = monthTasks.filter((t) => t.status === 'remarcada').length;
  const naoFeitas = monthTasks.filter((t) => t.status === 'nao_feita').length;
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  addPoliceHeader(
    doc,
    'RELATÓRIO E CRONOGRAMA OPERACIONAL MENSAL',
    `Mês de Referência: ${monthNames[monthIndex].toUpperCase()} DE ${year}`
  );

  // Summary Metrics Box
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 40, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`POLICIAL: ${userProfile?.name || 'Não identificado'} (${userProfile?.badge || 'S/M'})`, 18, 45.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Consolidado Mensal: ${total} procedimentos | Concluídos: ${concluidas} (${taxaConclusao}%) | Andamento: ${emAndamento} | Pendentes: ${pendentes} | Remarcados: ${remarcadas} | Não Realizados: ${naoFeitas}`,
    18,
    50.5
  );

  // Prepare table data
  const tableData = monthTasks.map((task, index) => {
    const cat = POLICE_TASK_CATEGORIES.find((c) => c.id === task.category)?.label || task.category;
    const stConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pendente;
    const priority = PRIORITY_LABELS[task.priority] || 'ALTA';
    const dateFmt = formatShortDate(task.date);

    let details = `${task.title}`;
    if (task.procedureNumber) details += `\n[Procedimento: ${task.procedureNumber}]`;
    if (task.description) details += `\n${task.description}`;
    if (task.status === 'remarcada' && task.rescheduledTo) {
      details += `\n* Remarcado para: ${formatShortDate(task.rescheduledTo)} ${task.reason ? `(${task.reason})` : ''}`;
    }
    if (task.status === 'nao_feita' && task.reason) {
      details += `\n* Justificativa: ${task.reason}`;
    }
    if (task.notes) {
      details += `\n* Obs: ${task.notes}`;
    }

    return [
      String(index + 1).padStart(2, '0'),
      dateFmt,
      priority,
      cat,
      details,
      stConfig.label.toUpperCase(),
    ];
  });

  if (tableData.length === 0) {
    tableData.push(['-', '-', '-', '-', `Nenhum procedimento cadastrado para o mês de ${monthNames[monthIndex]} de ${year}.`, '-']);
  }

  autoTable(doc, {
    startY: 58,
    head: [['#', 'DATA', 'PRIORIDADE', 'CATEGORIA', 'PROCEDIMENTO / DESCRIÇÃO DETALHADA', 'STATUS']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      valign: 'top',
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 26, halign: 'left', fontStyle: 'bold' },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const text = String(data.cell.raw || '').toLowerCase();
        if (text.includes('conclu')) {
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fillColor = [209, 250, 229];
        } else if (text.includes('andamento')) {
          data.cell.styles.textColor = [30, 64, 175];
          data.cell.styles.fillColor = [219, 234, 254];
        } else if (text.includes('pendente')) {
          data.cell.styles.textColor = [146, 64, 14];
          data.cell.styles.fillColor = [254, 243, 199];
        } else if (text.includes('remarcada')) {
          data.cell.styles.textColor = [107, 33, 168];
          data.cell.styles.fillColor = [243, 232, 255];
        } else if (text.includes('não') || text.includes('nao')) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fillColor = [254, 226, 226];
        }
      }
    },
    margin: { top: 32, bottom: 18, left: 14, right: 14 },
  });

  addSignatureBlock(doc, userProfile);
  addPageNumbersAndFooter(doc);

  const fileName = `Cronograma_Mensal_${monthNames[monthIndex]}_${year}_PCCE.pdf`;
  doc.save(fileName);
};
