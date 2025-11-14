# =================================================================
#  Multi-stage Dockerfile para Frontend (React + Nginx)
# =================================================================

# Estágio 1: Build da aplicação React com Vite
FROM node:18-alpine as frontend-builder

WORKDIR /app/frontend

# Copia os arquivos de dependências
COPY frontend/package*.json ./

# Instala as dependências
RUN npm ci

# Copia o código fonte
COPY frontend/ .

# Debug: Lista arquivos antes do build
RUN echo "📁 [DEBUG] Arquivos no diretório antes do build:" && ls -la

# Build da aplicação para produção
RUN npm run build

# Debug: Verifica se a pasta dist foi criada e lista conteúdo
RUN echo "📁 [DEBUG] Verificando pasta dist após build:" && \
    if [ -d "dist" ]; then \
        echo "✅ Pasta dist encontrada!" && ls -la dist/; \
    else \
        echo "❌ Pasta dist NÃO encontrada!" && ls -la; \
    fi

# Estágio 2: Servidor Node.js para servir frontend e backend
FROM node:18-alpine

WORKDIR /app

# Instala nginx para proxy reverso
RUN apk add --no-cache nginx

# Copia o backend
COPY backend/ /app/backend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Instala dependências do backend
WORKDIR /app/backend
RUN npm ci

# Compila o backend
RUN npm run build

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe as portas
EXPOSE 80 4000

# Script de inicialização
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Inicia Nginx e Node.js
CMD ["/start.sh"]
