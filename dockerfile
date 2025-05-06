FROM nginx:1.27-alpine

WORKDIR /app

COPY src .
COPY src/nginx.conf /etc/nginx
