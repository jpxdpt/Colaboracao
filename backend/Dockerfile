FROM node:20

WORKDIR /app

# Instalar wget para healthcheck
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

# Copiar ficheiros de dependências primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte (excluindo node_modules e dist via .dockerignore)
COPY . .

# Build do TypeScript
RUN npm run build

# Expor porta
EXPOSE 8081

# Comando para iniciar
CMD ["npm", "start"]

