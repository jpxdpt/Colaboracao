# Variáveis de Ambiente para Docker Compose

## ⚠️ IMPORTANTE: Configurar no Portainer

Estas variáveis devem ser configuradas no Portainer antes do deploy:

### Variáveis Obrigatórias (Alterar em Produção)

1. **JWT_SECRET** (Backend)
   - Descrição: Secret key para assinatura de tokens JWT
   - Valor padrão: `your-super-secret-jwt-key-change-this-in-production`
   - **AÇÃO REQUERIDA**: Alterar para um valor seguro e único em produção
   - Exemplo: `JWT_SECRET=seu-secret-jwt-muito-seguro-aqui-123456`

2. **FRONTEND_URL** (Backend)
   - Descrição: URL do frontend para CORS e Socket.io
   - Valor padrão: `http://localhost`
   - **AÇÃO REQUERIDA**: Definir a URL pública do frontend
   - Exemplos:
     - Local: `http://localhost`
     - Produção: `https://seu-dominio.com`
     - LocalTunnel: `https://kanbar-dashboard.loca.lt`

3. **VITE_API_URL** (Frontend - Build Time)
   - Descrição: URL da API backend para o frontend
   - Valor padrão: `http://localhost:8081/api`
   - **AÇÃO REQUERIDA**: Definir a URL pública do backend
   - Exemplos:
     - Local: `http://localhost:8081/api`
     - Produção: `https://api.seu-dominio.com/api`
     - LocalTunnel: `https://kanbar-dashboard-api.loca.lt/api`
   - **NOTA**: Esta variável é incorporada no código durante o build, por isso precisa ser definida antes do build

### Variáveis Opcionais

- **MONGODB_URI**: URI de conexão MongoDB (padrão: `mongodb://mongodb:27017/colaboracao`)
- **PORT**: Porta do backend (padrão: `8081`)
- **NODE_ENV**: Ambiente Node.js (padrão: `production`)

## Como Configurar no Portainer

1. No Portainer, vá para **Stacks** > **Seu Stack**
2. Clique em **Editor**
3. Adicione as variáveis de ambiente na secção `environment` ou crie um ficheiro `.env` na raiz do projeto
4. Para `VITE_API_URL`, configure no build args da secção `frontend`

## Exemplo de Configuração no Portainer

### Ficheiro .env (recomendado)
```env
JWT_SECRET=seu-secret-jwt-muito-seguro-aqui-123456
FRONTEND_URL=https://seu-dominio.com
VITE_API_URL=https://api.seu-dominio.com/api
```

### Ou diretamente no docker-compose.yml
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}
  - FRONTEND_URL=${FRONTEND_URL}
```

## Notas Importantes

- **JWT_SECRET**: Nunca commitar valores reais no Git
- **VITE_API_URL**: Deve ser acessível do navegador do utilizador, não um nome de serviço Docker
- **FRONTEND_URL**: Deve corresponder à URL onde o frontend está acessível publicamente
- Para desenvolvimento local, os valores padrão funcionam
- Para produção, todas as variáveis devem ser alteradas

