# Use a imagem oficial do Node.js baseada em Alpine (mais leve)
FROM node:18-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Instala dependências do sistema necessárias para algumas bibliotecas Node.js
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copia apenas os arquivos de dependências primeiro (para cache do Docker)
COPY package*.json ./

# Instala as dependências
RUN npm ci && npm cache clean --force

# Copia o resto do código da aplicação
COPY . .
# Garante permissões corretas para todos os arquivos
RUN chmod -R +x /app

# Cria um usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Define as permissões corretas
RUN chown -R nextjs:nodejs /app
USER nextjs

RUN npm run build

# Expõe a porta que a aplicação irá usar
EXPOSE 3000

# Define variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
