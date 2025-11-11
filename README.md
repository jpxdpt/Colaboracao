# Taskify - Aplicação de Gestão de Tarefas Gamificada

Aplicação completa de gestão de tarefas gamificada para colaboradores corporativos, inspirada nas melhores práticas de ferramentas como Duolingo, Habitica, Trello e Kahoot!.

## 🎯 Características Principais

- **Sistema de Gamificação Completo**: Pontos, badges, níveis, rankings, streaks, moeda virtual
- **Gestão de Tarefas**: Sistema tipo Trello com drag-and-drop
- **Formação Gamificada**: Módulos interativos com progresso e certificados
- **Reconhecimento entre Pares**: Sistema de kudos e feed social
- **Equipas/Guildas**: Colaboração e desafios de equipa
- **Desafios Temporários**: Competições semanais/mensais
- **Quests Narrativas**: Missões com storytelling envolvente
- **Companheiros/Pets**: Elementos visuais que evoluem com progresso
- **Painel Administrativo**: Analytics, KPIs e gestão completa

## 🏗️ Arquitetura

Monorepo com Turborepo contendo:

- `packages/backend`: API Node.js + Express + TypeScript
- `packages/frontend`: React 18 + Vite + TypeScript (PWA)
- `packages/shared`: Tipos, schemas Zod e utilitários partilhados

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas (ou MongoDB local)
- Redis

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp packages/backend/.env.example packages/backend/.env
# Editar .env com suas configurações

# Iniciar desenvolvimento
npm run dev
```

## 📦 Scripts

- `npm run dev` - Inicia todos os packages em modo desenvolvimento
- `npm run build` - Build de todos os packages
- `npm test` - Executa testes
- `npm run lint` - Verifica código com ESLint
- `npm run format` - Formata código com Prettier

## 🛠️ Tecnologias

### Backend
- Express.js + TypeScript
- MongoDB (Mongoose)
- Redis (ioredis)
- Socket.io (WebSockets)
- Bull/BullMQ (Queue system)
- JWT (Autenticação)
- Zod (Validação)

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (Estado global)
- React Query (Estado server)
- React Router v6
- Framer Motion (Animações)
- Socket.io Client

## 📝 Licença

Privado - Uso interno

