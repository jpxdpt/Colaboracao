FROM node:20

WORKDIR /app

# Instalar wget para healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copiar ficheiros de configuração primeiro
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências com retry para lidar com problemas de rede
RUN npm install --maxsockets 1 --fetch-retries 3 --fetch-retry-mintimeout 20000 || \
    (echo "npm install failed - checking resources" && \
     free -h && \
     df -h && \
     exit 1)

# Copiar código fonte (excluindo node_modules e dist via .dockerignore)
COPY . .

# Criar diretório de uploads se não existir
RUN mkdir -p /app/uploads

# Build do TypeScript com diagnóstico detalhado
RUN echo "=== Starting TypeScript build ===" && \
    echo "TypeScript version:" && \
    npx tsc --version && \
    echo "Node version:" && \
    node --version && \
    echo "Checking source files:" && \
    find src -name "*.ts" | head -5 && \
    echo "Running build..." && \
    npm run build

# Expor porta
EXPOSE 8081

# Comando para iniciar
CMD ["npm", "start"]

