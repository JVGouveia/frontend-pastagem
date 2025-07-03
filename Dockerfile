# Use a imagem oficial do Node.js baseada em Alpine (mais leve)
FROM node:18-alpine

# Define o diret�rio de trabalho dentro do container
WORKDIR /app

# Instala depend�ncias do sistema necess�rias para algumas bibliotecas Node.js
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copia apenas os arquivos de depend�ncias primeiro (para cache do Docker)
COPY package*.json ./

# Instala as depend�ncias
RUN npm ci && npm cache clean --force

# Copia o resto do c�digo da aplica��o
COPY . .
# Garante permiss�es corretas para todos os arquivos
RUN chmod -R +x /app

# Cria um usu�rio n�o-root para seguran�a
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Define as permiss�es corretas
RUN chown -R nextjs:nodejs /app
USER nextjs

RUN npm run build

# Exp�e a porta que a aplica��o ir� usar
EXPOSE 3000

# Define vari�veis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar a aplica��o
CMD ["npm", "start"]
