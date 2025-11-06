FROM node:20

WORKDIR /app

# Instalar wget para healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copiar ficheiros de configuração primeiro
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte (excluindo node_modules e dist via .dockerignore)
COPY . .

# Criar diretório de uploads se não existir
RUN mkdir -p /app/uploads

# Build do TypeScript com output detalhado para debug
RUN echo "Starting TypeScript build..." && \
    npm run build 2>&1 | tee /tmp/build.log || \
    (echo "=== Build failed! Showing errors ===" && \
     cat /tmp/build.log && \
     echo "=== TypeScript version ===" && \
     npx tsc --version && \
     echo "=== Checking tsconfig.json ===" && \
     cat tsconfig.json && \
     exit 1)

# Expor porta
EXPOSE 8081

# Comando para iniciar
CMD ["npm", "start"]

