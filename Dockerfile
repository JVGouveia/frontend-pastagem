# Use a imagem oficial do Node.js
FROM node:18-alpine AS builder

# Instala dependências do sistema
RUN apk add --no-cache python3 make g++

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia o código da aplicação
COPY . .

# Corrige permissões dos binários
RUN chmod -R +x node_modules/.bin/

# Faz o build da aplicação
RUN npm run build

# ========================================
# Estágio de produção com Nginx
# ========================================
FROM nginx:alpine

# Copia os arquivos buildados do Vite para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cria configuração completa do Nginx com proxies
RUN echo 'server { \
    listen 5173; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Configuração para SPA (Single Page Application) \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy para API \
    location /api/ { \
        proxy_pass http://192.168.56.103:3001/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_http_version 1.1; \
        \
        # Headers CORS \
        add_header "Access-Control-Allow-Origin" "*" always; \
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, PATCH, OPTIONS" always; \
        add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always; \
        \
        # Tratar requisições OPTIONS (preflight) \
        if ($request_method = "OPTIONS") { \
            add_header "Access-Control-Allow-Origin" "*"; \
            add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, PATCH, OPTIONS"; \
            add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
            add_header "Access-Control-Max-Age" 1728000; \
            add_header "Content-Type" "text/plain; charset=utf-8"; \
            add_header "Content-Length" 0; \
            return 204; \
        } \
    } \
    \
    # Proxy para Auth \
    location /auth/ { \
        proxy_pass http://192.168.56.103:3001/auth/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_http_version 1.1; \
        \
        # Headers CORS \
        add_header "Access-Control-Allow-Origin" "*" always; \
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, PATCH, OPTIONS" always; \
        add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always; \
        \
        # Tratar requisições OPTIONS (preflight) \
        if ($request_method = "OPTIONS") { \
            add_header "Access-Control-Allow-Origin" "*"; \
            add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, PATCH, OPTIONS"; \
            add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
            add_header "Access-Control-Max-Age" 1728000; \
            add_header "Content-Type" "text/plain; charset=utf-8"; \
            add_header "Content-Length" 0; \
            return 204; \
        } \
    } \
    \
    # Proxy para GraphQL \
    location /graphql { \
        proxy_pass http://192.168.56.103:3000/graphql; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_cache_bypass $http_upgrade; \
        \
        # Headers CORS \
        add_header "Access-Control-Allow-Origin" "*" always; \
        add_header "Access-Control-Allow-Methods" "GET, POST, PUT, DELETE, PATCH, OPTIONS" always; \
        add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always; \
        \
        # Tratar requisições OPTIONS (preflight) \
        if ($request_method = "OPTIONS") { \
            add_header "Access-Control-Allow-Origin" "*"; \
            add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS"; \
            add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization"; \
            add_header "Access-Control-Max-Age" 1728000; \
            add_header "Content-Type" "text/plain; charset=utf-8"; \
            add_header "Content-Length" 0; \
            return 204; \
        } \
    } \
    \
    # Cache para assets estáticos \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Headers de segurança \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
    \
    # Compressão gzip \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
}' > /etc/nginx/conf.d/default.conf

# Expõe a porta 5173
EXPOSE 5173

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
