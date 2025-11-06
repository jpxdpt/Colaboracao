FROM node:20

WORKDIR /app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

# Copiar ficheiros de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build do TypeScript
RUN npm run build

# Expor porta
EXPOSE 8081

# Comando para iniciar
CMD ["npm", "start"]

