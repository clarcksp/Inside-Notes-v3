# =================================================================
#  Dockerfile para o Frontend (React/Vite - Serviço Estático)
#  Corrige o erro '404' garantindo que o index.html seja encontrado.
# =================================================================

# 1. Estágio de Build do Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copia e instala dependências para aproveitar o cache do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Copia o restante do código-fonte do Frontend
COPY . .

# Executa o build do Vite. Isso gera a pasta 'dist'
RUN npm run build


# 2. Estágio de Servidor Nginx (Produção)
FROM nginx:1.25-alpine

# **CORREÇÃO CRÍTICA 1:** Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# **CORREÇÃO CRÍTICA 2:** Copia a configuração do SPA (try_files)
# Assumimos que o seu 'nginx.conf' está na raiz do projeto
COPY nginx.conf /etc/nginx/conf.d/default.conf

# **CORREÇÃO CRÍTICA 3:** Copia o conteúdo compilado (pasta 'dist' do Vite)
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# A porta 80 é a porta que o Coolify/Traefik deve rotear
EXPOSE 80 

CMD ["nginx", "-g", "daemon off;"]
