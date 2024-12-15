docker run \
  -it \
  --rm \
  -w /app \
  -p 9999:80 \
  -p 9900:9900 \
  -v $(pwd)/nginx/script:/app \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf \
  nginx:1.27-alpine  
