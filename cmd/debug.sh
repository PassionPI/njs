docker run \
  -it \
  --rm \
  -w /app \
  -p 9999:80 \
  -p 9900:9900 \
  -v $(pwd)/src:/app \
  -v $(pwd)/src/nginx.conf:/etc/nginx/nginx.conf \
  nginx:1.27-alpine  
