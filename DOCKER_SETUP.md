# Setup Docker com LocalTunnel

Este projeto está configurado para rodar com Docker e LocalTunnel, permitindo acesso público através de URLs temporárias.

## Pré-requisitos

- Docker Desktop instalado e em execução
- Node.js (opcional, apenas para desenvolvimento local)

## URLs Acessíveis

Após iniciar os containers, as seguintes URLs estarão disponíveis:

- **Frontend Local**: `http://localhost`
- **Backend Local**: `http://localhost:8081`
- **Frontend Público**: `https://kanbar-dashboard.loca.lt` (após iniciar)
- **Backend Público**: `https://kanbar-dashboard-api.loca.lt` (após iniciar)

**Nota**: As URLs do LocalTunnel aparecem quando executas os scripts `start-tunnels.sh` ou `start-tunnels.ps1`, ou quando inicias o LocalTunnel manualmente.

## Configuração Inicial

1. **Criar ficheiro `.env` na raiz do projeto** (opcional, para variáveis customizadas):

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGODB_URI=mongodb://mongodb:27017/colaboracao
```

2. **Build e iniciar os containers**:

```bash
docker-compose up -d --build
```

3. **Iniciar LocalTunnel (em terminal separado)**:

**Windows (PowerShell):**
```powershell
.\start-tunnels.ps1
```

**Linux/Mac:**
```bash
chmod +x start-tunnels.sh
./start-tunnels.sh
```

**Ou manualmente em dois terminais:**
```bash
# Terminal 1 - Backend tunnel
npx localtunnel --port 8081 --subdomain kanbar-dashboard-api

# Terminal 2 - Frontend tunnel  
npx localtunnel --port 80 --subdomain kanbar-dashboard
```

4. **Ver logs dos serviços**:

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

```

## Serviços Incluídos

### 1. MongoDB
- Porta local: `27017`
- Database: `colaboracao`
- Dados persistidos em volume Docker

### 2. Backend
- Porta local: `8081`
- API disponível em: `https://kanbar-dashboard-api.loca.lt`
- Health check: `http://localhost:8081/api/health`

### 3. Frontend
- Porta local: `80`
- Aplicação disponível em: `https://kanbar-dashboard.loca.lt`
- Servido por Nginx

### 4. LocalTunnel
- Executado fora do Docker (no host)
- Dois tunnels separados para frontend e backend
- URLs públicas temporárias: `https://kanbar-dashboard.loca.lt` e `https://kanbar-dashboard-api.loca.lt`

## Comandos Úteis

### Parar todos os serviços:
```bash
docker-compose down
```

### Parar e remover volumes (apaga dados do MongoDB):
```bash
docker-compose down -v
```

### Reiniciar um serviço específico:
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver status dos containers:
```bash
docker-compose ps
```

### Aceder ao terminal do container:
```bash
# Backend
docker exec -it kanbar-backend sh

# Frontend
docker exec -it kanbar-frontend sh

# MongoDB
docker exec -it kanbar-mongodb mongosh
```

## Configuração do Frontend

O frontend precisa conhecer a URL do backend. Após iniciar os containers, verifique a URL do backend no log do LocalTunnel:

```bash
docker-compose logs localtunnel-backend
```

Procure por uma linha como:
```
your url is: https://kanbar-dashboard-api.loca.lt
```

Depois, atualize a variável de ambiente `VITE_API_URL` no frontend (ou configure no código).

## Criar Utilizador Admin

Para criar um utilizador administrador:

```bash
docker exec -it kanbar-backend npm run create-admin
```

Siga as instruções no terminal.

## Troubleshooting

### LocalTunnel não está a funcionar
- Verifique os logs: `docker-compose logs localtunnel-frontend`
- Pode ser que o subdomínio já esteja em uso. Altere no `docker-compose.yml`:
  ```yaml
  lt --port 80 --subdomain kanbar-dashboard-v2
  ```

### Backend não conecta ao MongoDB
- Verifique se o MongoDB está a correr: `docker-compose ps`
- Verifique os logs: `docker-compose logs mongodb`

### Portas já em uso
- Altere as portas no `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:3000"  # Backend na porta 3001
    - "8080:80"    # Frontend na porta 8080
  ```

### Rebuild após alterações no código
```bash
docker-compose up -d --build
```

## Notas Importantes

⚠️ **LocalTunnel URLs são temporárias**: As URLs do LocalTunnel podem mudar após reiniciar os containers. Verifique sempre os logs para obter as URLs atualizadas.

⚠️ **Segurança**: Estas URLs são públicas. Não use em produção com dados sensíveis sem autenticação adequada.

⚠️ **Performance**: LocalTunnel pode ser lento. Para desenvolvimento local, use `localhost` diretamente.

## Desenvolvimento Local (sem Docker)

Para desenvolvimento local sem Docker:

### Backend:
```bash
cd backend
npm install
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

### MongoDB:
Instale e inicie o MongoDB localmente ou use MongoDB Atlas.

