docker run \
  -it \
  --rm \
  -w /app \
  -p 9999:80 \
  -v $(pwd)/src:/app \
  -v $(pwd)/src/nginx.conf:/etc/nginx/nginx.conf \
  nginx:1.27-alpine  
