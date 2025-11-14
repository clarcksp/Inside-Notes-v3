# Dockerfile para o Proxy (Nginx)
FROM nginx:alpine

# Copia a configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expondo a porta 80
EXPOSE 80
