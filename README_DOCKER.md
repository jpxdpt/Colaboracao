# 🐳 Docker Setup - Quick Start

## Início Rápido

### 1. Configurar Variáveis de Ambiente (IMPORTANTE)

Crie um ficheiro `.env` na raiz do projeto ou configure no Portainer:

```env
JWT_SECRET=seu-secret-jwt-muito-seguro-aqui
FRONTEND_URL=http://localhost
VITE_API_URL=http://localhost:8081/api
```

**⚠️ IMPORTANTE**: 
- `VITE_API_URL` deve ser acessível do navegador (não use nomes de serviços Docker)
- `JWT_SECRET` deve ser alterado em produção
- Ver `ENV_VARIABLES.md` para mais detalhes

### 2. Iniciar containers Docker
```bash
docker-compose up -d --build
```

### 3. Iniciar LocalTunnel (em terminal separado)

**Windows:**
```powershell
.\start-tunnels.ps1
```

**Linux/Mac:**
```bash
chmod +x start-tunnels.sh
./start-tunnels.sh
```

### 4. Aceder à aplicação

- **Local**: http://localhost
- **Público**: https://kanbar-dashboard.loca.lt

## URLs

- **Frontend Local**: http://localhost
- **Backend Local**: http://localhost:8081
- **Frontend Público**: https://kanbar-dashboard.loca.lt
- **Backend Público**: https://kanbar-dashboard-api.loca.lt

## Comandos Úteis

```bash
# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Reiniciar serviço
docker-compose restart backend
docker-compose restart frontend
```

## Criar Admin

```bash
docker exec -it kanbar-backend npm run create-admin
```

Mais detalhes em `DOCKER_SETUP.md`

