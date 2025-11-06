# 🐳 Docker Setup - Quick Start

## Início Rápido

### 1. Iniciar containers Docker
```bash
docker-compose up -d --build
```

### 2. Iniciar LocalTunnel (em terminal separado)

**Windows:**
```powershell
.\start-tunnels.ps1
```

**Linux/Mac:**
```bash
chmod +x start-tunnels.sh
./start-tunnels.sh
```

### 3. Aceder à aplicação

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

