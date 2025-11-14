#!/bin/sh
echo "🚀 Iniciando serviços..."

# Inicia o backend Node.js em background
cd /app/backend
npm run start &

# Inicia o Nginx em primeiro plano
echo "🌐 Iniciando Nginx..."
nginx -g "daemon off;"
