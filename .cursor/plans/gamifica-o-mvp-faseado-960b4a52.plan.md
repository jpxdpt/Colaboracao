<!-- 960b4a52-8928-46a1-bf77-4f9c3a20eab2 a4691fb0-219d-4c07-9394-d2295fed903c -->
# Plano de Implementação - Aplicação Gamificada (Faseado e Melhorado)

## Insights da Pesquisa de Mercado

### Ferramentas de Colaboração Analisadas

- **Trello**: Cards visuais, drag-and-drop, boards flexíveis, visualização clara do progresso
- **Asana**: Workflows estruturados, dependências entre tarefas, templates reutilizáveis
- **Wrike**: Gantt charts, atualizações em tempo real, integrações robustas
- **Slack**: Comunicação integrada, webhooks, comandos slash, notificações contextuais

### Apps Gamificados de Referência

- **Duolingo**: Streaks diários críticos para retenção, sistema de energia/vidas (anti-burnout), progressão suave, recompensas imediatas, celebrações visuais
- **Habitica**: RPG completo, pets que evoluem com progresso, quests narrativas, equipas/guildas colaborativas, penalidades por falhas (accountability)
- **Classcraft**: Personagens RPG, poderes especiais, trabalho colaborativo essencial, narrativa envolvente
- **Kahoot!**: Competição em tempo real, rankings dinâmicos, feedback instantâneo, quizzes interativos

### Melhores Práticas Identificadas

1. **Feedback Imediato**: Crítico para manter engajamento (inspirado em Kahoot!) - notificações instantâneas de conquistas
2. **Visualização Clara**: Cards visuais como Trello aumentam compreensão - interface tipo board para tarefas
3. **Progressão Suave**: Sistema de níveis gradual como Duolingo evita frustração - curva de progressão bem calibrada
4. **Elementos Sociais**: Equipas e reconhecimento entre pares aumentam retenção - feed social de conquistas
5. **Personalização**: Avatares e temas aumentam senso de pertencimento - customização visual completa
6. **Anti-Burnout**: Sistema de energia/vidas previne sobrecarga (Duolingo) - limitação opcional de ações diárias
7. **Narrativa**: Quests com contexto aumentam imersão (Habitica) - storytelling contextualizado
8. **Celebrações Visuais**: Confetes e animações para conquistas importantes aumentam satisfação

## Fase 1: Estrutura Base e Configuração Inicial

### 1.1 Setup do Monorepo Turborepo

- Criar estrutura de pastas `packages/backend`, `packages/frontend`, `packages/shared`
- Configurar `package.json` root com workspaces (pnpm workspaces)
- Configurar `turbo.json` com pipelines otimizados (build/dev/test/lint) e cache inteligente
- Configurar TypeScript em cada package com `tsconfig.json` apropriados (base config partilhado)
- Configurar ESLint e Prettier com regras consistentes entre packages
- Setup Husky para git hooks (pre-commit linting, pre-push testes)
- Configurar paths aliases para imports limpos (@shared, @backend, @frontend)

### 1.2 Package Shared (Tipos e Schemas)

- Criar estrutura base do package shared
- Definir tipos TypeScript partilhados (User, Task, Goal, etc.) com documentação JSDoc completa
- Criar schemas Zod para validação partilhada (frontend + backend) - single source of truth
- Utilitários partilhados (formatação de datas, números, validação de emails, constantes)
- Configurar build do package shared (TypeScript compilation com declarations)
- Exportar tipos e schemas de forma tree-shakeable (barrel exports otimizados)
- Enums partilhados (TaskStatus, GoalType, BadgeType, etc.)

### 1.3 Backend - Estrutura Base

- Setup Express.js com TypeScript e estrutura modular
- Configurar estrutura de pastas escalável (routes, controllers, models, middleware, services, utils, types)
- Configurar MongoDB Atlas connection (Mongoose) com connection pooling e retry logic
- Configurar Redis connection (ioredis) com retry logic, health checks e connection pooling
- Setup middleware base (cors configurado, helmet para segurança, express.json, express-rate-limit com Redis store, error handling centralizado)
- Configurar variáveis de ambiente (.env.example com todas as variáveis documentadas e tipos)
- Setup logging estruturado (Winston ou Pino) com níveis apropriados e formatação JSON
- Health check endpoint para monitorização (MongoDB + Redis status)
- Setup de testes (Jest) com configuração base

### 1.4 Frontend - Estrutura Base

- Setup React 18+ com Vite + TypeScript (configuração otimizada)
- Configurar React Router v6 com lazy loading de rotas e code splitting
- Setup TailwindCSS com design system customizado (cores gamificadas vibrantes, animações, tema escuro/claro)
- Configurar Zustand para estado global (stores modulares: authStore, gamificationStore, notificationStore)
- Configurar React Query para estado server (cache strategies, optimistic updates, retry logic)
- Setup estrutura de pastas escalável (pages, components, hooks, stores, services, utils, types, assets)
- Configurar PWA completo (manifest.json com ícones, service worker com estratégia stale-while-revalidate, offline fallback)
- Setup error boundaries e loading states globais (skeleton loaders gamificados)
- Configurar Framer Motion para animações suaves
- Setup React Hot Toast para notificações toast elegantes

## Fase 2: Autenticação e Utilizadores

### 2.1 Modelos de Dados Base

- Model User (MongoDB) com campos essenciais: email, password (hashed), nome, departamento, role, avatar, preferências, createdAt, updatedAt
- Model AuditLog para auditoria completa (ação, utilizador, timestamp, IP, user agent, mudanças)
- Índices necessários (email único, departamento para queries, createdAt para ordenação)
- Modelos de relacionamento bem definidos (referências, virtuals quando apropriado)

### 2.2 Sistema de Autenticação

- Rotas `/api/auth`: registo, login, refresh token, logout, recuperação de senha
- JWT com jsonwebtoken (access token 15min, refresh token 7 dias)
- Blacklist JWT em Redis (tokens revogados, expiração automática)
- Refresh token rotation (novo token a cada refresh, invalidação do anterior)
- Middleware de autenticação reutilizável (verifica token, carrega user, injeta req.user)
- Bcrypt para passwords (salt rounds 10, comparação segura)
- Rate limiting com express-rate-limit + Redis (diferentes limites por rota: login mais restritivo)
- Validação de email único no registo
- Email de boas-vindas (via queue system, não bloqueante)

### 2.3 Gestão de Utilizadores

- Rotas `/api/users`: perfil (GET/PUT), atualização, preferências, avatar upload
- Validação com Zod (schemas partilhados) em todas as rotas
- Middleware de autorização (verifica se user pode aceder/modificar recurso)
- Upload de avatar (multer, validação de tipo/tamanho, armazenamento cloud ou local)
- Preferências de utilizador (notificações, tema, idioma, privacidade)

## Fase 3: Funcionalidades Core (Tarefas, Metas, Reportes)

### 3.1 Modelos de Dados Core

- Model Task: título, descrição, status (pending/in-progress/completed/validated), prioridade, prazo, atribuído a, criado por, supervisor (opcional), validação requerida (boolean), pontos atribuídos, createdAt, updatedAt, completedAt
- Model Goal: título, descrição, tipo (individual/team), progresso atual, meta, unidade, prazo, criado por, participantes, status, milestones
- Model Report: título, descrição, categoria, severidade, status, anexos (URLs), reportado por, atribuído a, resolvido por, pontos ganhos, createdAt, updatedAt, resolvedAt
- Relações e referências apropriadas (populate quando necessário, índices para performance)
- Índices compostos para queries frequentes (status + atribuído a, departamento + status)

### 3.2 API de Tarefas (Inspirado em Trello/Asana)

- Rotas `/api/tasks`: CRUD completo (GET lista com filtros, GET por ID, POST criar, PUT atualizar, DELETE)
- Lógica de conclusão com validação anti-fraude básica (timestamp, verificação de padrões suspeitos)
- Atribuição de tarefas (múltiplos utilizadores possível, notificações)
- Validação de supervisores (middleware que verifica se supervisor existe e tem permissão)
- Histórico de tarefas (audit log integrado, mudanças de status rastreadas)
- Filtros avançados (por status, atribuído a, departamento, prazo, prioridade)
- Ordenação (por prazo, prioridade, createdAt)
- Paginação eficiente (cursor-based ou offset-based)
- Cards visuais tipo Trello (status como colunas, drag-and-drop support no frontend)

### 3.3 API de Metas

- Rotas `/api/goals`: CRUD completo
- Acompanhamento de progresso (atualização automática quando tarefas relacionadas completam)
- Notificações de progresso (milestones atingidos, alertas de prazo)
- Metas de equipa (progresso agregado, rankings de equipas)
- Visualização de progresso (percentagem, gráficos)

### 3.4 API de Reportes

- Rotas `/api/reports`: CRUD completo
- Categorização de problemas (enum com categorias pré-definidas)
- Status tracking (open/in-progress/resolved/closed) com transições válidas
- Anexos (upload de ficheiros, validação de tipo/tamanho, armazenamento)
- Pontos por reportes válidos (configurável, atribuição automática)
- Notificações para supervisores quando reporte crítico

### 3.5 Frontend - Páginas Core

- Página `/login` e `/register` (design moderno, validação em tempo real, feedback visual)
- Página `/dashboard` com estatísticas básicas (cards com KPIs, gráficos de progresso, últimas conquistas)
- Página `/tasks` (board tipo Trello com drag-and-drop, filtros, busca, criação rápida)
- Página `/goals` (lista de metas com progresso visual, criação de nova meta, detalhes)
- Página `/reports` (formulário rápido, lista de reportes, filtros por status/categoria)
- Componentes base (TaskCard com animações, GoalProgress com milestones visuais, ReportCard)
- Feedback visual imediato em todas as ações (toasts, animações, confetes para conclusões)

## Fase 4: Sistema de Gamificação Base (Pontos, Badges, Níveis, Rankings)

### 4.1 Modelos de Gamificação Base

- Model Points: utilizador, quantidade, origem (task/goal/report/training/etc), descrição, timestamp, auditado (boolean)
- Model Badge: nome, descrição, ícone, raridade (common/rare/epic/legendary), categoria, critérios (referência)
- Model BadgeCriteria: badge, tipo de critério (count/threshold/combo), valor necessário, progresso atual, descrição
- Model Level: nível (número), pontos necessários, nome, cor, benefícios (descrição)
- Model Ranking: tipo (weekly/monthly/all-time), período (data início/fim), utilizador, pontos, posição, departamento (opcional)
- Model GamificationConfig: departamento, ação (task_completed/report_submitted/etc), pontos base, multiplicadores, ativo (boolean)
- Índices para queries de ranking (tipo + período + pontos, utilizador + tipo)

### 4.2 Lógica de Pontos (Configurável por Departamento)

- Serviço de atribuição de pontos configurável por departamento/ação
- Histórico e auditoria completa (todos os pontos rastreados, origem clara)
- Rotas `/api/gamification/points`: histórico do utilizador, auditoria (admin), estatísticas
- Validação de pontos (verificação de duplicados, limites máximos por ação)
- Multiplicadores temporários (eventos especiais, bónus de equipa)
- Feedback imediato ao ganhar pontos (WebSocket notification)

### 4.3 Sistema de Badges (Critérios Progressivos)

- Atribuição automática com critérios progressivos (verificação periódica + em tempo real)
- Validação de critérios (serviço que verifica progresso, atualiza BadgeCriteria)
- Rotas `/api/gamification/badges`: lista de badges, badges do utilizador, detalhes, critérios visíveis
- Badges raros e épicos (sistema de raridade visual)
- Notificações especiais para badges raros (celebração visual maior)
- Progresso visível para badges não desbloqueados (motivação)

### 4.4 Sistema de Níveis (Progressão Suave como Duolingo)

- Cálculo baseado em pontos totais (fórmula exponencial suave para evitar frustração)
- Progressão automática (verificação ao ganhar pontos, notificação de level up)
- Rotas `/api/gamification/levels`: nível atual, progresso, próximos níveis, histórico
- Benefícios por nível (desbloqueio de features, badges especiais, títulos)
- Visualização clara de progresso (barra animada, pontos até próximo nível)
- Celebração de level up (animação especial, confetes)

### 4.5 Rankings (Cache Redis + Tempo Real)

- Cálculo de rankings semanais/mensais (job agendado, atualização periódica)
- Cache em Redis para performance (TTL apropriado, invalidação inteligente)
- Atualização em tempo real via WebSocket (mudanças de posição notificadas)
- Rotas `/api/gamification/rankings`: rankings por tipo/período, posição do utilizador, top N
- Rankings por departamento (competição interna)
- Rankings de equipas (agregação de pontos de membros)
- Visualização tipo Kahoot! (posições dinâmicas, animações de subida/descida)

### 4.6 Frontend - Componentes Gamificados Base

- BadgeDisplay (exibição de badges com animações, tooltip com critérios, raridade visual)
- LevelProgress (barra de progresso animada, nível atual destacado, próximos níveis preview)
- PointsCounter (contador animado tipo slot machine, histórico recente, origem dos pontos)
- RankingCard (card de ranking com atualização em tempo real, posição destacada, animações)
- Página `/profile` (perfil completo: badges, níveis, pontos, estatísticas, histórico)
- Página `/rankings` (rankings semanais/mensais com filtros, busca, visualização tipo leaderboard)
- Feed de conquistas (notificações de badges, level ups, rankings, tipo feed social)

## Fase 5: Módulo de Formação

### 5.1 Modelos de Formação

- Model Training: título, descrição, categoria, conteúdo (texto/vídeo/quiz), duração estimada, pontos de conclusão, badges relacionados, pré-requisitos, ativo
- Model TrainingProgress: utilizador, training, progresso (percentagem), módulos completados, última atividade, concluído (boolean), certificado emitido (boolean), pontos ganhos

### 5.2 API de Formação

- Rotas `/api/training`: CRUD formações, catálogo com filtros, busca
- Rotas `/api/training/progress`: progresso do utilizador, atualização de progresso, conclusão
- Conteúdo interativo (texto formatado, vídeos embebidos, quizzes com validação)
- Certificados virtuais (geração PDF, badge especial, partilha)
- Pontos por conclusão (configurável, atribuição automática)
- Streaks para estudo diário (integração com sistema de streaks)

### 5.3 Frontend - Formação

- Página `/training` (catálogo tipo grid, filtros por categoria, busca, progresso visível)
- Página `/training/:id` (detalhes completos, player de vídeo, quizzes interativos, progresso visual)
- Componentes de progresso gamificado (barra de progresso, módulos completados, tempo restante)
- Certificados visuais (badge especial, partilha social)
- Integração com sistema de streaks (dias consecutivos de estudo)

## Fase 6: Features Avançadas - Streaks e Moeda Virtual

### 6.1 Modelos Avançados

- Model Streak: utilizador, tipo (daily_tasks/training/etc), dias consecutivos, última atividade, maior streak (record), recompensas recebidas
- Model Currency: utilizador, quantidade atual, histórico de transações (ganho/gasto, origem/destino, timestamp, descrição)
- Índices para queries de streaks (utilizador + tipo, última atividade para verificação diária)

### 6.2 Sistema de Streaks (Duolingo-style - Crítico para Retenção)

- Lógica de cálculo de dias consecutivos (verificação diária, reset se quebrado)
- Recompensas progressivas (bónus crescente por dias consecutivos: dia 3, 7, 14, 30, etc.)
- Rotas `/api/gamification/streaks`: streak atual, histórico, recompensas, tipos de streak
- Múltiplos tipos de streak (tarefas diárias, formação, reportes, etc.)
- Notificações de risco (alerta quando streak está em risco de quebrar)
- Streak freeze opcional (moeda virtual para proteger streak - monetização opcional)
- Frontend: StreakDisplay com animações (fogo para streak ativo, contador visual, recompensas preview)
- Celebração especial para milestones (7 dias, 30 dias, 100 dias)

### 6.3 Sistema de Moeda Virtual (Economia Interna)

- Lógica de ganho/gasto de moeda (configurável por ação, conversão de pontos opcional)
- Histórico de transações completo (auditoria, origem/destino claro)
- Rotas `/api/gamification/currency`: saldo atual, histórico, transações recentes
- Conversão pontos → moeda (taxa configurável, opcional)
- Uso de moeda: resgate de recompensas, proteção de streak, personalização premium
- Frontend: CurrencyDisplay com histórico (saldo destacado, lista de transações, gráfico de evolução)
- Animações ao ganhar/gastar moeda (feedback visual imediato)

## Fase 7: Features Avançadas - Desafios Temporários e Quests

### 7.1 Modelos de Desafios e Quests

- Model Challenge: título, descrição, tipo (weekly/monthly/special), data início/fim, objetivos (critérios), prémios, participantes, status (upcoming/active/ended), countdown
- Model Quest: título, descrição, narrativa (texto contextualizado), objetivos (array de objetivos específicos), recompensas, status (available/in-progress/completed), progresso, criado por
- Model Narrative: contexto, história, personagens (opcional), evolução baseada em progresso
- Relações: Quest pode estar ligada a Challenge, Quest tem Narrative

### 7.2 Sistema de Desafios Temporários (Competição Limitada)

- Criação e gestão de desafios (admin, templates reutilizáveis)
- Countdown visual (timer em tempo real, urgência criada)
- Prémios exclusivos (badges especiais, moeda virtual, recompensas reais)
- Rotas `/api/gamification/challenges`: desafios ativos, histórico, participar, progresso
- Rankings de desafios (competição durante período ativo)
- Notificações de início/fim de desafios
- Frontend: ChallengeCard com countdown animado (dias/horas/minutos, progresso visual, prémios destacados)
- Página `/challenges` (lista de desafios ativos e próximos, filtros, participação)

### 7.3 Sistema de Quests/Missões (Narrativa Envolvente tipo Habitica)

- Criação de quests com narrativa (storytelling contextualizado, personagens opcionais)
- Objetivos específicos (array de objetivos com progresso individual)
- Recompensas especiais (badges únicos, moeda virtual, pontos extras)
- Rotas `/api/gamification/quests`: quests disponíveis, progresso, iniciar quest, completar objetivo
- Quests sequenciais (desbloqueio progressivo)
- Quests de equipa (objetivos colaborativos)
- Frontend: QuestTracker com progresso visual (narrativa destacada, objetivos com checkboxes animados, recompensas preview)
- Página `/quests` (lista de quests, filtros por status, narrativa completa)

## Fase 8: Features Avançadas - Equipas e Reconhecimento entre Pares

### 8.1 Modelos Sociais

- Model Team: nome, descrição, avatar/logo, criado por, membros (referências), pontos totais, desafios ativos, criado em
- Model TeamMember: equipa, utilizador, role (member/leader), pontos contribuídos, juntou em, ativo
- Model PeerRecognition: de (utilizador), para (utilizador), tipo (kudos/thanks/appreciation), mensagem, pontos (opcional), público (boolean), criado em
- Índices para feed social (criado em descendente, utilizador para queries rápidas)

### 8.2 Sistema de Equipas/Guildas (Colaboração Essencial)

- Criação e gestão de equipas (criar, juntar, sair, convidar membros)
- Desafios colaborativos (objetivos de equipa, rankings de equipas)
- Rankings de equipas (agregação de pontos, competição entre equipas)
- Rotas `/api/gamification/teams`: CRUD equipas, membros, rankings, desafios
- Chat interno de equipa (opcional, WebSocket para mensagens em tempo real)
- Recompensas coletivas (badges de equipa, prémios especiais)
- Frontend: TeamCard (estatísticas coletivas, membros, desafios ativos, ranking)
- Página `/teams` (lista de equipas, criar/juntar equipa, detalhes da equipa, chat)

### 8.3 Sistema de Reconhecimento entre Pares (Feed Social)

- Envio de "kudos" (formulário simples, mensagem opcional, pontos configuráveis)
- Feed de reconhecimentos (público, ordenado por data, filtros)
- Badges especiais por reconhecimento dos pares (badge "Reconhecido pelos Colegas")
- Rotas `/api/recognition`: enviar kudos, feed, estatísticas de reconhecimento
- Notificações quando recebe kudos (WebSocket + email opcional)
- Rankings de reconhecimento (quem mais recebe, quem mais dá)
- Frontend: PeerRecognitionFeed (feed tipo social media, formulário de envio, estatísticas)
- Página `/recognition` (feed completo, enviar kudos, perfil de reconhecimento)

## Fase 9: Features Avançadas - Companheiros e Recompensas

### 9.1 Modelos de Personalização

- Model Avatar: utilizador, componentes (cabeça, corpo, acessórios), cores, desbloqueados (array de itens), moeda gasta
- Model Companion: utilizador, tipo (pet/companion), nome, nível, experiência, evolução atual, próximo nível, desbloqueado em
- Model Reward: nome, descrição, tipo (virtual/real), custo (moeda virtual), stock (opcional), categoria, imagem, ativo
- Model RewardRedemption: utilizador, reward, quantidade, status (pending/fulfilled/cancelled), resgatado em, entregue em (opcional)

### 9.2 Sistema de Companheiros/Pets (Evolução com Progresso tipo Habitica)

- Lógica de evolução baseada em progresso (XP ganho por ações, níveis de evolução)
- Animações e visualizações (sprites animados, evolução visual ao subir nível)
- Rotas `/api/gamification/companions`: companheiro atual, evolução, alimentar (ações que dão XP), personalização
- Múltiplos companheiros (coleção, troca entre companheiros)
- Companheiros raros (desbloqueio por conquistas especiais)
- Frontend: CompanionDisplay (visualização do companheiro, barra de XP, animações de evolução, interação)
- Página `/companion` (gerir companheiros, alimentar, evoluir, coleção)

### 9.3 Sistema de Recompensas (Catálogo e Resgate)

- Catálogo de recompensas (filtros por tipo/categoria, busca, ordenação)
- Resgate com moeda virtual (validação de saldo, processamento)
- Histórico de resgates (todas as transações, status tracking)
- Rotas `/api/gamification/rewards`: catálogo, resgatar, histórico, gestão (admin)
- Recompensas reais (integração futura com fornecedores, gestão de stock)
- Recompensas virtuais (badges especiais, avatares, temas)
- Frontend: RewardCatalog (grid de recompensas, filtros, detalhes, resgate com confirmação)
- Página `/rewards` (catálogo completo, histórico de resgates, filtros)

### 9.4 Personalização Visual (Senso de Pertença)

- Sistema de avatares (editor completo, componentes desbloqueáveis, cores customizáveis)
- Editor de avatar (drag-and-drop de componentes, preview em tempo real)
- Rotas `/api/users/avatar`: atualizar avatar, componentes desbloqueados, comprar componentes
- Temas e skins (temas desbloqueáveis, personalização de cores)
- Frontend: AvatarEditor (editor visual completo, preview, desbloqueios, compras)
- Página `/avatar` (editor de avatar, loja de componentes, temas)

## Fase 10: Onboarding e Notificações

### 10.1 Modelos de Onboarding e Notificações

- Model OnboardingProgress: utilizador, etapa atual, etapas completadas (array), dados salvos (JSON), concluído (boolean)
- Model Notification: utilizador, tipo (achievement/task/goal/challenge/etc), título, mensagem, lida (boolean), ação (URL opcional), criado em
- Preferências de notificação por tipo (granular, controlo total do utilizador)

### 10.2 Sistema de Onboarding (Tutorial Interativo)

- Tutorial interativo progressivo (etapas sequenciais, progresso salvo)
- Ensino de mecânicas de gamificação (explicação clara, não overwhelm)
- Progresso salvo por utilizador (retoma de onde parou)
- Rotas `/api/onboarding`: progresso atual, completar etapa, pular (opcional)
- Introdução narrativa contextualizada (história inicial, personagem guia)
- Frontend: OnboardingWizard (wizard step-by-step, animações, skip opcional, progresso visual)
- Primeira utilização automática (trigger no primeiro login)

### 10.3 Sistema de Notificações (Tempo Real + Email Queue)

- Notificações in-app (WebSocket com Socket.io, tempo real, não intrusivas)
- Preferências granulares (controlo por tipo: achievements sim, tasks não, etc.)
- Queue system para emails (Bull/BullMQ + Redis, não bloqueante)
- Configuração SMTP via variáveis de ambiente (múltiplos provedores: SendGrid, AWS SES, Gmail)
- Retry logic e fallback (tentativas automáticas, fallback para outro provedor)
- Rotas `/api/notifications`: lista de notificações, marcar como lida, preferências, histórico
- Lembretes automáticos configuráveis (tarefas pendentes, streaks em risco, desafios)
- Estratégia anti-notification fatigue (limite de notificações por dia, agrupamento inteligente)
- Frontend: notificações em tempo real (badge de contador, dropdown de notificações, página de histórico)
- Página `/settings` com preferências completas (checkboxes por tipo, frequência de emails)

## Fase 11: Painel Administrativo

### 11.1 Modelos Admin

- Todos os modelos já criados (reutilização)
- Modelos adicionais se necessário (AdminUser, SystemConfig)

### 11.2 API Admin

- Rotas `/api/admin`: dashboard com métricas gerais, overview
- Rotas `/api/admin/analytics`: KPIs detalhados (adoção, DAU, MAU, retenção semana 1/4/12, engagement rate, tempo médio, conclusão de tarefas/formações, badges por utilizador, participação em desafios/equipas)
- Rotas `/api/admin/audit`: logs de auditoria, deteção de padrões anormais, alertas de fraude
- Rotas `/api/admin/challenges`: criação e gestão de desafios temporários (CRUD completo)
- Rotas `/api/admin/rewards`: gestão de catálogo de recompensas (CRUD, stock, ativação)
- Rotas `/api/admin/gamification`: configuração de pontos/badges por departamento (CRUD GamificationConfig)
- Rotas `/api/admin/gdpr`: exportação de dados (JSON completo), direito ao esquecimento (remoção completa)
- Rotas `/api/admin/users`: gestão de utilizadores (listar, editar, desativar, roles)
- Middleware de autorização admin (verificação de role, permissões granulares)

### 11.3 Frontend Admin

- Página `/admin` (dashboard administrativo com cards de métricas, gráficos, alertas)
- Página `/admin/analytics` (KPIs detalhados com gráficos interativos, filtros por período, exportação)
- Página `/admin/gamification` (configuração de pontos/badges, interface intuitiva, preview de mudanças)
- Página `/admin/challenges` (criação e gestão de desafios, templates, ativação/desativação)
- Página `/admin/rewards` (gestão de catálogo, stock, preços, categorias)
- Página `/admin/audit` (logs de auditoria com filtros, busca, alertas de fraude destacados)
- Página `/admin/users` (lista de utilizadores, filtros, edição, gestão de roles)
- Componentes: FraudAlert (alertas visuais para padrões suspeitos), métricas visuais (gráficos, cards)

## Fase 12: Segurança Avançada e Anti-Fraude

### 12.1 Deteção de Padrões Anormais

- Lógica de deteção (muitas tarefas em pouco tempo, padrões suspeitos de pontos, ações impossíveis)
- Alertas automáticos (notificação admin, flag no utilizador, investigação manual)
- Integração com AuditLog (todos os eventos suspeitos registados)
- Machine learning básico (opcional, deteção de anomalias, padrões de fraude)
- Rate limiting inteligente (limites dinâmicos baseados em comportamento)

### 12.2 Validação de Supervisores

- Sistema robusto de validação para tarefas críticas (workflow de aprovação)
- Notificações para supervisores (email + in-app quando tarefa requer validação)
- Histórico de validações (quem validou, quando, comentários)
- Escalação automática (se supervisor não responde em X tempo)

### 12.3 Conformidade GDPR

- Interface de exportação de dados (JSON completo, todos os dados do utilizador)
- Direito ao esquecimento (remoção completa: soft delete inicial, hard delete após período)
- Logs de consentimento (quando consentiu, alterações de preferências)
- Política de privacidade integrada (página dedicada, aceite no registo)
- Anonimização de dados (para analytics, remoção de PII)

## Fase 13: Melhorias de UX e Design Gamificado

### 13.1 Animações e Feedback Visual (Inspirado em Duolingo/Kahoot!)

- Framer Motion para animações suaves (transições de página, componentes, micro-interações)
- Confetes e celebrações para conquistas importantes (biblioteca de confetes, animações customizadas)
- Loading states gamificados (skeleton loaders temáticos, spinners personalizados)
- Empty states motivacionais (ilustrações, mensagens encorajadoras, CTAs)
- Feedback tátil (vibração) em mobile (Web Vibration API, feedback em ações importantes)
- Som opcional (sons de conquista, configuração de volume, mute)
- Micro-animações em todas as interações (hover, click, drag, scroll)

### 13.2 Design System Gamificado

- Cores vibrantes e motivacionais (paleta consistente, contraste adequado)
- Sistema de cores por níveis/badges (código de cores intuitivo, raridade visual)
- Ícones e ilustrações lúdicas (biblioteca de ícones consistente, ilustrações customizadas)
- Componentes reutilizáveis consistentes (design system completo, documentação)
- Tipografia gamificada (fontes legíveis mas com personalidade, hierarquia clara)
- Espaçamento e layout (grid system, espaçamento consistente, responsividade)

### 13.3 Páginas Finais e Melhorias

- Página `/challenges` (desafios ativos com countdown, participação, progresso)
- Página `/quests` (missões disponíveis, narrativa, progresso)
- Página `/settings` (configurações completas: perfil, notificações, privacidade, tema, idioma)
- Melhorias em todas as páginas existentes (consistência visual, animações, feedback)
- Acessibilidade (ARIA labels, navegação por teclado, contraste WCAG AA)

## Fase 14: Sistema Anti-Burnout (Inspirado em Duolingo)

### 14.1 Sistema de Energia/Vidas (Opcional)

- Limitação opcional de ações diárias (configurável por admin, pode ser desativado)
- Energia que regenera ao longo do dia (sistema de vidas como Duolingo)
- Avisos quando energia baixa (notificações, UI destacada)
- Bónus por não esgotar energia (recompensa por gestão saudável)
- Rotas `/api/gamification/energy`: energia atual, histórico, regeneração
- Frontend: EnergyDisplay (barra de energia visual, tempo até regeneração, avisos)

### 14.2 Prevenção de Burnout

- Limites diários configuráveis (máximo de tarefas/completions por dia)
- Avisos de sobrecarga (alerta quando aproxima do limite)
- Recomendações de pausa (sugestões baseadas em atividade)
- Estatísticas de bem-estar (tempo médio na app, frequência de uso)

## Fase 15: Telemetria e Feature Flags

### 15.1 Sentry Integration

- Setup Sentry no backend (error tracking, performance monitoring, releases)
- Setup Sentry React no frontend (error boundaries, performance, user context)
- Configuração de ambientes (dev/staging/prod com diferentes projetos)
- Alertas configurados (erros críticos, performance degradation)

### 15.2 Feature Flags

- Sistema próprio de feature flags (Redis-based, simples e eficiente)
- Ou integração LaunchDarkly (se preferir solução enterprise)
- Configuração dinâmica de features (ativar/desativar sem deploy)
- A/B testing básico (opcional, variantes de features)

## Fase 16: Testes e Documentação

### 16.1 Testes

- Testes unitários para lógica crítica (serviços de gamificação, cálculos, validações)
- Testes de integração para APIs (rotas principais, fluxos completos)
- Testes E2E para fluxos principais (Playwright ou Cypress: login, completar tarefa, ganhar badge)
- Coverage mínimo de 70% para código crítico
- Testes de performance (load testing para rankings, stress testing para WebSockets)

### 16.2 Documentação

- README.md completo (setup, desenvolvimento, deployment, contribuição)
- Documentação de API (Swagger/OpenAPI, exemplos de requests/responses)
- Guia de desenvolvimento (arquitetura, convenções, padrões)
- Guia de deployment (variáveis de ambiente, configurações, troubleshooting)
- Documentação de features (como usar cada feature, screenshots, vídeos)

## Arquivos Principais a Criar

### Estrutura Root

- `package.json` (workspace root com pnpm)
- `turbo.json` (configuração Turborepo otimizada)
- `.gitignore` (completo)
- `.env.example` (template de variáveis)
- `README.md` (documentação principal)
- `.eslintrc.js` (configuração ESLint)
- `.prettierrc` (configuração Prettier)
- `tsconfig.base.json` (configuração TypeScript base)

### Packages/Shared

- `packages/shared/package.json`
- `packages/shared/src/types/` (todos os tipos TypeScript com JSDoc)
- `packages/shared/src/schemas/` (todos os schemas Zod)
- `packages/shared/src/utils/` (utilitários partilhados)
- `packages/shared/src/constants/` (enums, constantes)
- `packages/shared/tsconfig.json`

### Packages/Backend

- `packages/backend/package.json`
- `packages/backend/src/server.ts` (entry point)
- `packages/backend/src/app.ts` (configuração Express)
- `packages/backend/src/models/` (todos os modelos Mongoose)
- `packages/backend/src/routes/` (todas as rotas organizadas)
- `packages/backend/src/controllers/` (todos os controllers)
- `packages/backend/src/services/` (lógica de negócio: gamification, notifications, etc.)
- `packages/backend/src/middleware/` (auth, error handling, validation, etc.)
- `packages/backend/src/config/` (MongoDB, Redis, JWT, etc.)
- `packages/backend/src/utils/` (utilitários backend)
- `packages/backend/src/jobs/` (jobs agendados: rankings, streaks, etc.)
- `packages/backend/src/queues/` (Bull queues: emails, etc.)
- `packages/backend/.env.example`
- `packages/backend/tsconfig.json`

### Packages/Frontend

- `packages/frontend/package.json`
- `packages/frontend/src/main.tsx` (entry point)
- `packages/frontend/src/App.tsx` (router e providers)
- `packages/frontend/src/pages/` (todas as páginas)
- `packages/frontend/src/components/` (componentes organizados por feature)
- `packages/frontend/src/stores/` (Zustand stores)
- `packages/frontend/src/hooks/` (custom hooks)
- `packages/frontend/src/services/` (API clients com React Query)
- `packages/frontend/src/utils/` (utilitários frontend)
- `packages/frontend/src/types/` (tipos específicos frontend)
- `packages/frontend/src/assets/` (imagens, ícones, etc.)
- `packages/frontend/public/manifest.json`
- `packages/frontend/public/sw.js` (service worker)
- `packages/frontend/vite.config.ts`
- `packages/frontend/tailwind.config.js`
- `packages/frontend/tsconfig.json`

## Considerações de Implementação

### Prioridades Baseadas em Pesquisa

1. **Feedback Imediato** (Fase 4): Crítico para engajamento inicial
2. **Streaks** (Fase 6): Alto impacto na retenção (Duolingo)
3. **Visualização Clara** (Fase 3): Cards tipo Trello facilitam adoção
4. **Elementos Sociais** (Fase 8): Aumentam retenção a longo prazo
5. **Anti-Burnout** (Fase 14): Previne abandono por sobrecarga

### Padrões Técnicos Identificados

- **Monorepo Turborepo**: Escalável, cache inteligente, builds paralelos
- **Redis para Rankings**: Performance crítica, cache agressivo
- **WebSockets**: Tempo real essencial para rankings e notificações
- **PWA**: Acesso móvel sem app store, offline-first
- **Queue System**: Emails não bloqueantes, retry automático

### Métricas de Sucesso (KPIs)

- Taxa de adoção (% utilizadores ativos após primeira semana)
- Daily Active Users (DAU) e Monthly Active Users (MAU)
- Taxa de retenção (semana 1, 4, 12)
- Engagement rate (ações por utilizador por dia)
- Streak retention (utilizadores que mantêm streak > 7 dias)
- Taxa de participação em desafios temporários
- Taxa de reconhecimento entre pares