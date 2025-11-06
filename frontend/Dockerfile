FROM node:20 as build

WORKDIR /app

# Argumentos de build para variáveis de ambiente
ARG VITE_API_URL=http://localhost:8081/api
ENV VITE_API_URL=$VITE_API_URL

# Copiar apenas ficheiros de dependências primeiro (para cache de layers)
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm install

# Copiar código fonte (excluindo node_modules via .dockerignore)
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção com nginx
FROM nginx:alpine

# Copiar ficheiros buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

