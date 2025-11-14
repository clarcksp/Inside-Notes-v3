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

# Estágio 2: Servidor Nginx para servir os arquivos estáticos
FROM nginx:1.25-alpine

# Debug: Mostra versão do Nginx
RUN echo "🐳 [DEBUG] Versão do Nginx:" && nginx -v

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Debug: Verifica se o nginx.conf foi copiado
RUN echo "📄 [DEBUG] Configuração do Nginx:" && cat /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do Vite (pasta dist)
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Debug: Verifica se os arquivos foram copiados para o Nginx
RUN echo "📁 [DEBUG] Arquivos copiados para Nginx:" && ls -la /usr/share/nginx/html/

# Debug: Verifica se o index.html existe
RUN if [ -f "/usr/share/nginx/html/index.html" ]; then \
        echo "✅ index.html encontrado!"; \
        echo "📄 [DEBUG] Primeiras linhas do index.html:"; \
        head -10 /usr/share/nginx/html/index.html; \
    else \
        echo "❌ index.html NÃO encontrado!"; \
    fi

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx com logs detalhados
CMD echo "🚀 [NGINX] Iniciando Nginx..." && \
    echo "📋 [NGINX] Configuração ativa:" && \
    cat /etc/nginx/conf.d/default.conf && \
    echo "📁 [NGINX] Arquivos disponíveis:" && \
    ls -la /usr/share/nginx/html/ && \
    nginx -g "daemon off;"
