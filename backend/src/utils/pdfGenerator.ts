import PDFDocument from 'pdfkit';
import { JWTPayload } from '../types/index.js';

export const generatePDFReport = async (
  data: any[],
  user: JWTPayload,
  type: 'tasks' | 'users' = 'tasks'
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Cabeçalho
      const title = type === 'tasks' ? 'Relatório de Tarefas' : 'Relatório de Utilizadores';
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Gerado por: ${user.email}`, { align: 'center' });
      doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, { align: 'center' });
      doc.moveDown();

      if (type === 'tasks') {
        // Tabela de tarefas
        let y = doc.y;
        const startX = 50;
        const rowHeight = 30;
        const colWidths = [80, 200, 100, 80, 80, 100];

        // Cabeçalho da tabela
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Estado', startX, y);
        doc.text('Título', startX + colWidths[0], y, { width: colWidths[1] });
        doc.text('Atribuído a', startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
        doc.text('Prioridade', startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
        doc.text('Prazo', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });
        doc.text('Criado em', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5] });

        y += rowHeight;
        doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();

        // Dados
        doc.font('Helvetica');
        data.forEach((task, index) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          const statusLabels: { [key: string]: string } = {
            pending: 'Pendente',
            in_progress: 'Em Progresso',
            completed: 'Concluída',
          };

          const priorityLabels: { [key: string]: string } = {
            low: 'Baixa',
            medium: 'Média',
            high: 'Alta',
          };

          doc.text(statusLabels[task.status] || task.status, startX, y, { width: colWidths[0] });
          doc.text(task.title.substring(0, 30), startX + colWidths[0], y, { width: colWidths[1] });
          doc.text(task.assigned_to.substring(0, 20), startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
          doc.text(priorityLabels[task.priority] || task.priority, startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
          doc.text(task.deadline, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });
          doc.text(task.created_at, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5] });

          y += rowHeight;
          doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
        });
      } else if (type === 'users') {
        // Tabela de utilizadores
        let y = doc.y;
        const startX = 50;
        const rowHeight = 30;
        const colWidths = [150, 200, 80, 100, 100, 100];

        // Cabeçalho
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Nome', startX, y);
        doc.text('Email', startX + colWidths[0], y, { width: colWidths[1] });
        doc.text('Função', startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
        doc.text('Total Tarefas', startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
        doc.text('Concluídas', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });
        doc.text('Criado em', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5] });

        y += rowHeight;
        doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();

        // Dados
        doc.font('Helvetica');
        data.forEach((user) => {
          if (y > 700) {
            doc.addPage();
            y = 50;
          }

          doc.text(user.name, startX, y, { width: colWidths[0] });
          doc.text(user.email, startX + colWidths[0], y, { width: colWidths[1] });
          doc.text(user.role === 'admin' ? 'Administrador' : 'Utilizador', startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] });
          doc.text(String(user.total_tasks), startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] });
          doc.text(String(user.completed_tasks), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] });
          doc.text(user.created_at, startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], y, { width: colWidths[5] });

          y += rowHeight;
          doc.moveTo(startX, y).lineTo(startX + colWidths.reduce((a, b) => a + b, 0), y).stroke();
        });
      }

      // Rodapé
      doc.fontSize(8).text(`Total de registos: ${data.length}`, 50, doc.page.height - 50, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

