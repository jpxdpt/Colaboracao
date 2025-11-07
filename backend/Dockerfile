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

# Build do TypeScript (Docker mostra output completo automaticamente)
RUN npm run build || (echo "Build failed with errors above" && exit 1)

# Expor porta
EXPOSE 8081

# Comando para iniciar
CMD ["npm", "start"]

