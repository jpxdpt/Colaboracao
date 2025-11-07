# Configuração Vercel

Este projeto está configurado para fazer deploy no Vercel.

## Configurações no Vercel

1. **Framework Preset**: Express
2. **Root Directory**: `backend`
3. **Build Command**: `npm run build`
4. **Output Directory**: (deixar vazio)
5. **Install Command**: `npm install`

## Variáveis de Ambiente

Configurar no Vercel (Settings → Environment Variables):

- `MONGODB_URI` - URI de conexão MongoDB
- `JWT_SECRET` - Secret para JWT tokens
- `FRONTEND_URL` - URL do frontend (ex: https://seu-frontend.vercel.app)
- `NODE_ENV` - `production`
- `VERCEL` - `1` (definido automaticamente pelo Vercel)

## Limitações no Vercel

- **Socket.io**: Não funciona no Vercel (serverless). As notificações em tempo real serão desativadas automaticamente.
- **Uploads**: O sistema de ficheiros é read-only. Considerar usar serviços externos (S3, Cloudinary, etc.) para uploads.

## Estrutura

- `vercel.json` - Configuração do Vercel
- `api/index.js` - Handler serverless function
- `src/server.ts` - Servidor Express adaptado para Vercel

