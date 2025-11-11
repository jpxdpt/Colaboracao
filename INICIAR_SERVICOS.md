# Como Iniciar Backend e Frontend

## Passo a Passo

### 1. Verificar Configuração

Certifique-se de que o arquivo `.env` existe em `packages/backend/`:

```bash
# Se não existir, copie do exemplo
cd packages/backend
copy .env.example .env
```

Edite o `.env` e configure pelo menos:
- `MONGODB_URI` - URI de conexão do MongoDB
- `JWT_SECRET` - Chave secreta para JWT (pode ser qualquer string segura)

### 2. Iniciar Backend

**Terminal 1:**
```bash
cd packages/backend
npm run dev
```

Você deve ver:
```
🚀 Server running on http://localhost:3000
📡 API available at http://localhost:3000/api
🏥 Health check at http://localhost:3000/health
MongoDB connected
```

### 3. Iniciar Frontend

**Terminal 2:**
```bash
cd packages/frontend
npm run dev
```

Você deve ver:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 4. Verificar se Está Funcionando

1. Acesse http://localhost:3000/health no navegador
   - Deve retornar JSON com status "ok"

2. Acesse http://localhost:5173 no navegador
   - Deve mostrar a página de login

### 5. Criar Primeiro Usuário Admin

Em um novo terminal:
```bash
cd packages/backend
npm run create-admin
```

Siga as instruções para criar o primeiro administrador.

## Problemas Comuns

### Backend não inicia

- Verifique se o MongoDB está acessível
- Verifique se a porta 3000 está livre
- Verifique o arquivo `.env` está configurado

### ERR_CONNECTION_REFUSED

- Certifique-se de que o backend está rodando
- Verifique se está na porta 3000
- Teste: http://localhost:3000/health

### CORS Error

- O CORS já está configurado para permitir localhost:5173
- Se ainda houver erro, verifique o console do navegador

## Scripts Rápidos

**Iniciar tudo (raiz do projeto):**
```bash
npm run dev
```

**Apenas backend:**
```bash
cd packages/backend
npm run dev
```

**Apenas frontend:**
```bash
cd packages/frontend
npm run dev
```

