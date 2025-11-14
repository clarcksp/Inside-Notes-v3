# =================================================================
#  Multi-stage Dockerfile para Frontend (React + Nginx)
# =================================================================

# Estágio 1: Build da aplicação React com Vite
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm ci --only=production

# Copia o código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build

# Estágio 2: Servidor Nginx para servir os arquivos estáticos
FROM nginx:1.25-alpine

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do Vite (pasta dist)
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
