# Guia de Configuração - MongoDB Atlas

## Passo 1: Criar Conta e Cluster no MongoDB Atlas

1. Aceda a https://www.mongodb.com/cloud/atlas
2. Crie uma conta gratuita (se ainda não tiver)
3. Crie um novo cluster:
   - Escolha **FREE** (M0 Sandbox)
   - Escolha a região mais próxima de si
   - Dê um nome ao cluster (ex: `gamify-cluster`)

## Passo 2: Criar Utilizador da Base de Dados

1. No menu lateral, vá a **"Database Access"**
2. Clique em **"Add New Database User"**
3. Escolha **"Password"** como método de autenticação
4. Crie um username e password (guarde estas credenciais!)
5. Escolha **"Read and write to any database"** como privilégio
6. Clique em **"Add User"**

## Passo 3: Configurar Acesso à Rede

1. No menu lateral, vá a **"Network Access"**
2. Clique em **"Add IP Address"**
3. Para desenvolvimento local, pode usar:
   - **"Add Current IP Address"** (recomendado)
   - Ou **"Allow Access from Anywhere"** (`0.0.0.0/0`) - apenas para desenvolvimento!
4. Clique em **"Confirm"**

## Passo 4: Obter Connection String

1. No menu lateral, vá a **"Database"**
2. Clique em **"Connect"** no seu cluster
3. Escolha **"Connect your application"**
4. Copie a connection string (formato: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/...`)
5. **IMPORTANTE**: Substitua `<username>` e `<password>` pelas credenciais que criou no Passo 2

## Passo 5: Configurar no Projeto

1. No diretório `packages/backend/`, crie um arquivo `.env` (copie do `.env.example`):

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e substitua a linha `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://SEU_USERNAME:SUA_PASSWORD@cluster0.xxxxx.mongodb.net/gamify?retryWrites=true&w=majority
```

**Exemplo real:**
```env
MONGODB_URI=mongodb+srv://admin:MinhaSenh@123@cluster0.abc123.mongodb.net/gamify?retryWrites=true&w=majority
```

**Nota**: Se a sua password contém caracteres especiais, pode precisar de fazer URL encoding:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- etc.

## Passo 6: Testar Conexão

Após configurar, pode testar a conexão executando:

```bash
pnpm dev
```

Se tudo estiver correto, verá no console:
```
MongoDB connected successfully
```

## Troubleshooting

### Erro: "Authentication failed"
- Verifique se o username e password estão corretos
- Verifique se fez URL encoding de caracteres especiais na password

### Erro: "IP not whitelisted"
- Adicione o seu IP atual em "Network Access" no MongoDB Atlas
- Aguarde alguns minutos após adicionar o IP

### Erro: "Connection timeout"
- Verifique se o seu firewall não está a bloquear a conexão
- Verifique se está a usar a connection string correta (começa com `mongodb+srv://`)

## Segurança

⚠️ **NUNCA** commite o arquivo `.env` no Git!
- O arquivo `.env` já está no `.gitignore`
- Use sempre `.env.example` como template
- Em produção, use variáveis de ambiente do servidor/hosting



