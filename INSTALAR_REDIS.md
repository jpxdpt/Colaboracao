# Como Instalar Redis no Windows

## Opção 1: Redis Cloud (Recomendado - Mais Rápido) ⭐

Esta é a opção mais rápida e não requer instalação local:

1. **Criar conta gratuita:**
   - Acesse: https://redis.com/try-free/
   - Crie uma conta (gratuita até 30MB)
   - Crie um novo database

2. **Obter URL de conexão:**
   - Na dashboard do Redis Cloud, copie a URL de conexão
   - Formato: `redis://default:password@host:port`

3. **Configurar no `.env`:**
   ```env
   REDIS_URL=redis://default:sua-password@seu-host:porta
   ```

**Vantagens:**
- ✅ Não requer instalação
- ✅ Funciona imediatamente
- ✅ Gratuito para desenvolvimento
- ✅ Não ocupa espaço local

---

## Opção 2: WSL2 + Redis (Instalação Local)

### Passo 1: Instalar WSL2

**Como Administrador no PowerShell:**

```powershell
# 1. Habilitar recursos necessários
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 2. Reiniciar o computador (necessário)
# Após reiniciar, continuar com:

# 3. Definir WSL2 como versão padrão
wsl --set-default-version 2

# 4. Instalar Ubuntu (ou outra distribuição)
wsl --install -d Ubuntu
```

**Nota:** Você precisará reiniciar o computador após o passo 2.

### Passo 2: Instalar Redis no WSL2

Após instalar o WSL2 e Ubuntu, abra o Ubuntu e execute:

```bash
# Atualizar pacotes
sudo apt update

# Instalar Redis
sudo apt install redis-server -y

# Iniciar Redis
sudo service redis-server start

# Verificar se está rodando
redis-cli ping
# Deve retornar: PONG

# Configurar para iniciar automaticamente
sudo systemctl enable redis-server
```

### Passo 3: Configurar no `.env`

No arquivo `packages/backend/.env`:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
# Ou use a URL:
# REDIS_URL=redis://localhost:6379
```

**Nota:** O Redis no WSL2 estará acessível em `localhost:6379` do Windows.

---

## Opção 3: Memurai (Redis Nativo para Windows)

1. **Baixar Memurai:**
   - Acesse: https://www.memurai.com/get-memurai
   - Baixe a versão Developer (gratuita)

2. **Instalar:**
   - Execute o instalador
   - Siga as instruções

3. **Configurar no `.env`:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

---

## Verificar se Redis está Funcionando

Após configurar, inicie o backend:

```bash
cd packages/backend
npm run dev
```

Você deve ver no console:
```
✅ Redis connected
```

Se não aparecer, verifique:
- Se o Redis está rodando
- Se as credenciais no `.env` estão corretas
- Se a porta não está bloqueada pelo firewall

---

## Recomendação

Para desenvolvimento rápido, use **Redis Cloud (Opção 1)**. É gratuito, não requer instalação e funciona imediatamente.

Para produção ou se preferir ter controle total, use **WSL2 + Redis (Opção 2)**.

