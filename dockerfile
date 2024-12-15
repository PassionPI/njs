FROM nginx:1.27-alpine

WORKDIR /app

COPY nginx/script /app
