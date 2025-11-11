# Como Iniciar o Projeto Gamify

## Pré-requisitos

1. **Node.js** >= 18.0.0
2. **MongoDB** (Atlas ou local)
3. **Redis** (opcional, mas recomendado)

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` em `packages/backend/` baseado no `.env.example`:

```bash
cd packages/backend
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/gamify?retryWrites=true&w=majority

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 3. Compilar Packages

```bash
# Compilar shared primeiro
npm run build --workspace=@gamify/shared

# Ou compilar tudo
npm run build
```

## Iniciar o Projeto

### Opção 1: Desenvolvimento (Recomendado)

Na raiz do projeto:

```bash
npm run dev
```

Isso iniciará:
- Backend na porta 3000
- Frontend na porta 5173

### Opção 2: Iniciar Separadamente

**Backend:**
```bash
cd packages/backend
npm run dev
```

**Frontend (em outro terminal):**
```bash
cd packages/frontend
npm run dev
```

## Verificar se Está Funcionando

1. **Backend**: Acesse http://localhost:3000/health
   - Deve retornar: `{ "status": "ok", "mongodb": "connected", "redis": "connected" }`

2. **Frontend**: Acesse http://localhost:5173
   - Deve mostrar a página de login

## Criar Primeiro Usuário Admin

```bash
cd packages/backend
npm run create-admin
```

Siga as instruções para criar o primeiro administrador.

## Problemas Comuns

### ERR_CONNECTION_REFUSED

**Causa**: Backend não está rodando

**Solução**:
1. Verifique se o backend está rodando: `cd packages/backend && npm run dev`
2. Verifique se a porta 3000 está livre
3. Verifique se o MongoDB está acessível

### MongoDB Connection Error

**Causa**: MongoDB URI incorreta ou MongoDB não acessível

**Solução**:
1. Verifique o arquivo `.env` em `packages/backend/`
2. Teste a conexão MongoDB
3. Verifique se o IP está na whitelist do MongoDB Atlas (se usar Atlas)

### CORS Error

**Causa**: Frontend e Backend em portas diferentes sem CORS configurado

**Solução**:
1. Verifique se `FRONTEND_URL` no `.env` do backend está correto
2. Verifique se `VITE_API_URL` no frontend está correto (ou use o padrão `http://localhost:3000`)

## Estrutura de Portas

- **Backend**: 3000 (http://localhost:3000)
- **Frontend**: 5173 (http://localhost:5173)
- **Redis**: 6379 (localhost:6379)

## Scripts Úteis

```bash
# Desenvolvimento
npm run dev

# Build de tudo
npm run build

# Lint
npm run lint

# Criar admin
cd packages/backend && npm run create-admin

# Promover usuário a admin
cd packages/backend && npm run promote-admin
```

