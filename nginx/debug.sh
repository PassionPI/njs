docker run \
  -it \
  --rm \
  -w /app \
  -p 9999:80 \
  -v $(pwd)/nginx/script:/etc/nginx/script \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf \
  nginx:1.27-alpine  
