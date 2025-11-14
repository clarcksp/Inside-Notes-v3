# =================================================================
#  Dockerfile para o Backend (Node.js/TypeScript)
# =================================================================
# Este Dockerfile utiliza uma abordagem multi-stage para criar uma
# imagem otimizada, segura e pequena para produção.

# --- Estágio 1: Builder ---
# Neste estágio, instalamos todas as dependências (incluindo as de desenvolvimento)
# e compilamos o código TypeScript para JavaScript.
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de pacotes
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia todo o código-fonte do backend
COPY . .

# Compila o projeto TypeScript para JavaScript
RUN npm run build

# --- Estágio 2: Produção ---
# Este estágio cria a imagem final que será executada em produção.
# Ela é baseada em uma imagem limpa e contém apenas o necessário.
FROM node:20-alpine

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Define a variável de ambiente para indicar que estamos em produção
ENV NODE_ENV=production

# Copia os arquivos de manifesto de pacotes
COPY package*.json ./

# Instala APENAS as dependências de produção, resultando em uma imagem menor
RUN npm install --only=production

# Copia o código JavaScript compilado do estágio 'builder'
COPY --from=builder /usr/src/app/dist ./dist

# Por segurança, a aplicação rodará com um usuário não-root ('node')
USER node

# Expõe a porta que o servidor Express escutará dentro do contêiner
EXPOSE 4000

# O comando padrão para iniciar o container
CMD ["node", "dist/server.js"]
