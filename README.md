# Sistema de Colaboração em Equipa

Sistema completo de gestão de tarefas e colaboração em equipa com funcionalidades avançadas.

## 🚀 Funcionalidades

### Core
- ✅ Autenticação com JWT
- ✅ Gestão de utilizadores (Admin/User)
- ✅ Gestão de tarefas com múltiplos atribuídos
- ✅ Sistema Kanban com drag & drop
- ✅ Visualização de calendário
- ✅ Comentários em tarefas
- ✅ Histórico de atividades

### Avançado
- ✅ Sistema de tags
- ✅ Subtarefas hierárquicas
- ✅ Pesquisa global
- ✅ Filtros avançados
- ✅ Notificações em tempo real
- ✅ Dark mode
- ✅ Templates de tarefas
- ✅ Dashboard com KPIs
- ✅ Alertas de tarefas atrasadas

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- TypeScript
- MongoDB (Mongoose)
- Socket.io (real-time)
- JWT (autenticação)
- bcryptjs (hash de passwords)

### Frontend
- React + Vite
- TypeScript
- TailwindCSS
- React Router DOM
- @dnd-kit (drag & drop)
- date-fns (datas)
- lucide-react (ícones)
- socket.io-client (real-time)

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configurar variáveis de ambiente
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Configuração

Crie um ficheiro `.env` no diretório `backend`:

```env
PORT=8081
MONGODB_URI=mongodb://localhost:27017/team_collaboration
JWT_SECRET=seu_secret_jwt_aqui
FRONTEND_URL=http://localhost:5173
```

## 👥 Criar Administrador

```bash
cd backend
npm run create-admin
```

Ou através do MongoDB Compass:
1. Abra a coleção `users`
2. Atualize o campo `role` para `"admin"`

Ver `INSTRUCOES.md` para mais detalhes.

## 📝 Uso

1. Aceda a http://localhost:5173
2. Crie uma conta ou faça login
3. Se for admin, pode criar/gerir tarefas e utilizadores
4. Se for user, vê apenas as tarefas atribuídas a si

## 📚 Documentação

- `INSTRUCOES.md` - Instruções detalhadas de utilização
- `CREATE_ADMIN.md` - Como criar administradores
- `MONGODB_SETUP.md` - Configuração do MongoDB

## 🎯 Funcionalidades Principais

### Gestão de Tarefas
- Criar, editar, eliminar tarefas
- Atribuir a múltiplos utilizadores
- Prioridades e prazos
- Tags e categorização
- Subtarefas hierárquicas
- Comentários e histórico

### Visualizações
- Kanban Board (drag & drop)
- Calendário mensal
- Lista de tarefas
- Dashboard com estatísticas

### Colaboração
- Notificações em tempo real
- Comentários em tarefas
- Histórico de alterações
- Atribuição múltipla

## 🔐 Segurança

- Passwords hasheadas com bcrypt
- JWT para autenticação
- Rate limiting
- Validação de inputs
- Helmet para segurança HTTP

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.
