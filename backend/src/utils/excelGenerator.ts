import ExcelJS from 'exceljs';
import { JWTPayload } from '../types/index.js';

export const generateExcelReport = async (
  data: any[],
  user: JWTPayload,
  type: 'tasks' | 'users' = 'tasks'
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório');

  if (type === 'tasks') {
    // Cabeçalho
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'Relatório de Tarefas';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = `Gerado por: ${user.email}`;
    worksheet.getCell('A3').value = `Data: ${new Date().toLocaleDateString('pt-PT')}`;

    // Cabeçalhos da tabela
    const headers = ['Estado', 'Título', 'Descrição', 'Atribuído a', 'Prioridade', 'Prazo', 'Criado em'];
    worksheet.addRow(headers);

    // Estilizar cabeçalhos
    const headerRow = worksheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Dados
    data.forEach((task) => {
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

      worksheet.addRow([
        statusLabels[task.status] || task.status,
        task.title,
        task.description,
        task.assigned_to,
        priorityLabels[task.priority] || task.priority,
        task.deadline,
        task.created_at,
      ]);
    });

    // Ajustar largura das colunas
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });
  } else if (type === 'users') {
    // Cabeçalho
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'Relatório de Utilizadores';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    worksheet.getCell('A2').value = `Gerado por: ${user.email}`;
    worksheet.getCell('A3').value = `Data: ${new Date().toLocaleDateString('pt-PT')}`;

    // Cabeçalhos
    const headers = ['Nome', 'Email', 'Função', 'Total Tarefas', 'Tarefas Concluídas', 'Criado em'];
    worksheet.addRow(headers);

    // Estilizar cabeçalhos
    const headerRow = worksheet.getRow(5);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Dados
    data.forEach((userData) => {
      worksheet.addRow([
        userData.name,
        userData.email,
        userData.role === 'admin' ? 'Administrador' : 'Utilizador',
        userData.total_tasks,
        userData.completed_tasks,
        userData.created_at,
      ]);
    });

    // Ajustar largura das colunas
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });
  }

  // Gerar buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

