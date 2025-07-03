# Solução para Erro 403 no Login

## Problema
O frontend está retornando erro 403 (Forbidden) ao tentar fazer login com o backend que está rodando no Docker.

## Causa
O problema ocorre porque:
1. O backend está rodando no Docker na VM (192.168.56.103:3001)
2. O frontend está rodando localmente tentando acessar o backend
3. Pode haver problemas de CORS ou configuração de proxy

## Soluções

### Opção 1: Desenvolvimento Local (Recomendado)
1. Certifique-se de que o backend está rodando no Docker:
   ```bash
   docker-compose up api1
   ```

2. O frontend já está configurado para usar proxy no desenvolvimento local
3. Acesse: http://localhost:5173

### Opção 2: Usar URL Direta
Se o proxy não funcionar, você pode forçar o uso da URL direta:

1. Crie um arquivo `.env.local` na raiz do projeto:
   ```
   VITE_USE_DIRECT_API=true
   ```

2. Isso fará com que o frontend acesse diretamente `http://192.168.56.103:3001`

### Opção 3: Rodar Tudo no Docker
1. Use o docker-compose completo:
   ```bash
   docker-compose up
   ```

2. Acesse: http://localhost:4173

## Verificações

### 1. Verificar se o backend está rodando
```bash
curl http://192.168.56.103:3001/health
```

### 2. Verificar logs do proxy
Abra o console do navegador e veja os logs do proxy no Vite.

### 3. Verificar configuração de rede
```bash
ping 192.168.56.103
Test-NetConnection -ComputerName 192.168.56.103 -Port 3001
```

## Configurações Atuais

- **Desenvolvimento Local**: Usa proxy `/api` → `http://192.168.56.103:3001`
- **Docker**: Usa rede interna `http://api1:8080`
- **Headers CORS**: Configurados no proxy do Vite

## Logs de Debug
Os logs de debug estão habilitados no proxy do Vite. Verifique o console do terminal onde o Vite está rodando para ver:
- Requisições sendo enviadas
- Respostas recebidas
- Headers das requisições
- Erros de proxy 