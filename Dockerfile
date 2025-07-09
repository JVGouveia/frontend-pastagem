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

# Cria configuração customizada do Nginx para SPA
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
