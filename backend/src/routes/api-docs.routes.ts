import express from 'express';

const router = express.Router();

// GET /api/docs - Documentação da API
router.get('/', (req, res) => {
  res.json({
    title: 'API de Colaboração em Equipa',
    version: '1.0.0',
    description: 'Documentação da API REST para o Sistema de Colaboração em Equipa',
    baseUrl: process.env.API_URL || 'http://localhost:8081/api',
    authentication: {
      type: 'Bearer Token',
      description: 'Todas as rotas (exceto /auth) requerem autenticação via JWT token no header Authorization',
      example: 'Authorization: Bearer <token>',
    },
    endpoints: {
      auth: {
        'POST /api/auth/register': {
          description: 'Registar novo utilizador',
          body: {
            name: 'string (obrigatório)',
            email: 'string (obrigatório)',
            password: 'string (obrigatório, mínimo 6 caracteres)',
          },
          response: {
            token: 'string',
            user: 'User object',
          },
        },
        'POST /api/auth/login': {
          description: 'Iniciar sessão',
          body: {
            email: 'string (obrigatório)',
            password: 'string (obrigatório)',
          },
          response: {
            token: 'string',
            user: 'User object',
          },
        },
      },
      tasks: {
        'GET /api/tasks': {
          description: 'Listar tarefas com filtros',
          query: {
            status: 'pending | in_progress | completed (opcional)',
            priority: 'low | medium | high (opcional)',
            assigned_to: 'string (opcional)',
            tags: 'string (opcional, separado por vírgulas)',
            search: 'string (opcional)',
            parent_task_id: 'string (opcional)',
          },
          response: 'Array de Task objects',
        },
        'GET /api/tasks/:id': {
          description: 'Obter detalhes de uma tarefa',
          response: 'Task object com relações',
        },
        'POST /api/tasks': {
          description: 'Criar nova tarefa',
          body: {
            title: 'string (obrigatório)',
            description: 'string (opcional)',
            assigned_to: 'string[] (opcional)',
            priority: 'low | medium | high (opcional, padrão: medium)',
            deadline: 'ISO8601 date string (opcional)',
            start_date: 'ISO8601 date string (opcional)',
            tags: 'string[] (opcional)',
            parent_task_id: 'string (opcional)',
          },
          response: 'Task object',
        },
        'PUT /api/tasks/:id': {
          description: 'Atualizar tarefa',
          body: 'Campos opcionais da tarefa',
          response: 'Task object atualizado',
        },
        'DELETE /api/tasks/:id': {
          description: 'Eliminar tarefa (apenas admin)',
          response: 'Mensagem de sucesso',
        },
      },
      comments: {
        'GET /api/comments/task/:taskId': {
          description: 'Listar comentários de uma tarefa',
          response: 'Array de Comment objects',
        },
        'POST /api/comments': {
          description: 'Adicionar comentário',
          body: {
            task_id: 'string (obrigatório)',
            content: 'string (obrigatório)',
          },
          response: 'Comment object',
        },
        'DELETE /api/comments/:id': {
          description: 'Eliminar comentário',
          response: 'Mensagem de sucesso',
        },
      },
      attachments: {
        'GET /api/attachments/task/:taskId': {
          description: 'Listar anexos de uma tarefa',
          response: 'Array de Attachment objects',
        },
        'POST /api/attachments/task/:taskId': {
          description: 'Upload de anexo',
          body: 'multipart/form-data com campo "file"',
          response: 'Attachment object',
        },
        'GET /api/attachments/:id/download': {
          description: 'Download de anexo',
          response: 'File stream',
        },
        'DELETE /api/attachments/:id': {
          description: 'Eliminar anexo',
          response: 'Mensagem de sucesso',
        },
      },
      timeEntries: {
        'GET /api/time-entries': {
          description: 'Listar entradas de tempo',
          query: {
            task_id: 'string (opcional)',
            user_id: 'string (opcional, apenas admin)',
            start_date: 'ISO8601 date string (opcional)',
            end_date: 'ISO8601 date string (opcional)',
          },
          response: 'Array de TimeEntry objects',
        },
        'POST /api/time-entries': {
          description: 'Criar entrada de tempo',
          body: {
            task_id: 'string (obrigatório)',
            start_time: 'ISO8601 date string (opcional, padrão: agora)',
            end_time: 'ISO8601 date string (opcional)',
            description: 'string (opcional)',
          },
          response: 'TimeEntry object',
        },
        'PUT /api/time-entries/:id': {
          description: 'Atualizar entrada de tempo',
          body: {
            end_time: 'ISO8601 date string (opcional)',
            description: 'string (opcional)',
          },
          response: 'TimeEntry object atualizado',
        },
        'DELETE /api/time-entries/:id': {
          description: 'Eliminar entrada de tempo',
          response: 'Mensagem de sucesso',
        },
        'GET /api/time-entries/task/:taskId/summary': {
          description: 'Resumo de tempo por tarefa',
          response: 'Summary object com total de tempo',
        },
      },
      reports: {
        'GET /api/reports/tasks': {
          description: 'Exportar relatório de tarefas',
          query: {
            format: 'pdf | excel (obrigatório)',
            status: 'pending | in_progress | completed (opcional)',
            priority: 'low | medium | high (opcional)',
            start_date: 'ISO8601 date string (opcional)',
            end_date: 'ISO8601 date string (opcional)',
          },
          response: 'File stream (PDF ou Excel)',
        },
        'GET /api/reports/users': {
          description: 'Exportar relatório de utilizadores (apenas admin)',
          query: {
            format: 'pdf | excel (obrigatório)',
          },
          response: 'File stream (PDF ou Excel)',
        },
      },
      users: {
        'GET /api/users': {
          description: 'Listar utilizadores (apenas admin)',
          response: 'Array de User objects',
        },
        'GET /api/users/stats': {
          description: 'Estatísticas de utilizadores (apenas admin)',
          response: 'Stats object',
        },
        'PUT /api/users/:id/role': {
          description: 'Atualizar role de utilizador (apenas admin)',
          body: {
            role: 'admin | user',
          },
          response: 'User object atualizado',
        },
        'DELETE /api/users/:id': {
          description: 'Eliminar utilizador (apenas admin)',
          response: 'Mensagem de sucesso',
        },
      },
      tags: {
        'GET /api/tags': {
          description: 'Listar tags',
          response: 'Array de Tag objects',
        },
        'POST /api/tags': {
          description: 'Criar tag (apenas admin)',
          body: {
            name: 'string (obrigatório)',
            color: 'string (opcional, hex color)',
          },
          response: 'Tag object',
        },
        'DELETE /api/tags/:id': {
          description: 'Eliminar tag (apenas admin)',
          response: 'Mensagem de sucesso',
        },
      },
      notifications: {
        'GET /api/notifications': {
          description: 'Listar notificações do utilizador',
          query: {
            unread_only: 'true | false (opcional)',
          },
          response: 'Array de Notification objects',
        },
        'GET /api/notifications/unread-count': {
          description: 'Contar notificações não lidas',
          response: '{ count: number }',
        },
        'PUT /api/notifications/:id/read': {
          description: 'Marcar notificação como lida',
          response: 'Notification object',
        },
        'PUT /api/notifications/read-all': {
          description: 'Marcar todas as notificações como lidas',
          response: 'Mensagem de sucesso',
        },
      },
      templates: {
        'GET /api/templates': {
          description: 'Listar templates de tarefas (apenas admin)',
          response: 'Array de TaskTemplate objects',
        },
        'POST /api/templates': {
          description: 'Criar template (apenas admin)',
          body: {
            name: 'string (obrigatório)',
            title: 'string (obrigatório)',
            description: 'string (opcional)',
            priority: 'low | medium | high (opcional)',
            tags: 'string[] (opcional)',
          },
          response: 'TaskTemplate object',
        },
        'PUT /api/templates/:id': {
          description: 'Atualizar template (apenas admin)',
          body: 'Campos opcionais do template',
          response: 'TaskTemplate object atualizado',
        },
        'DELETE /api/templates/:id': {
          description: 'Eliminar template (apenas admin)',
          response: 'Mensagem de sucesso',
        },
      },
    },
    errorResponses: {
      400: 'Bad Request - Dados inválidos',
      401: 'Unauthorized - Token não fornecido ou inválido',
      403: 'Forbidden - Sem permissão para aceder ao recurso',
      404: 'Not Found - Recurso não encontrado',
      500: 'Internal Server Error - Erro no servidor',
    },
  });
});

export default router;

