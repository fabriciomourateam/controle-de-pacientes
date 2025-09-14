# 🚀 **Deploy em Produção - Controle de Pacientes**

## 📋 **Pré-requisitos:**

- Node.js 18+
- NPM ou Yarn
- PM2 (para gerenciamento de processos)
- Docker (opcional)

---

## 🔧 **Configuração Rápida (PM2):**

### **1. Instalar PM2:**
```bash
npm install -g pm2
```

### **2. Deploy Automático:**
```bash
# Linux/Mac
npm run deploy

# Windows
npm run deploy:win
```

### **3. Comandos Úteis:**
```bash
# Ver status
npm run pm2:status

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Parar
npm run pm2:stop
```

---

## 🐳 **Configuração Docker:**

### **1. Build e Deploy:**
```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run

# Ou usar docker-compose
npm run docker:compose
```

### **2. Verificar Status:**
```bash
docker ps
docker logs notion-proxy
```

---

## 🪟 **Configuração Windows Service:**

### **1. Instalar node-windows:**
```bash
npm install -g node-windows
```

### **2. Instalar Serviço:**
```bash
npm run service:install
```

### **3. Desinstalar Serviço:**
```bash
npm run service:uninstall
```

---

## 🌐 **Configuração de Domínio:**

### **1. Atualizar Configuração:**
Edite `src/lib/config.ts`:
```typescript
proxyUrl: import.meta.env.PROD 
  ? 'https://seu-dominio.com/api/notion-proxy'  // ← Sua URL aqui
  : 'http://localhost:3001/api/notion-proxy',
```

### **2. Configurar Nginx (Opcional):**
```nginx
location /api/notion-proxy {
    proxy_pass http://localhost:3001/api/notion-proxy;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 🔄 **Deploy Contínuo:**

### **1. GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run deploy
```

### **2. Script de Deploy:**
```bash
#!/bin/bash
# deploy.sh
git pull origin main
npm install
npm run pm2:restart
```

---

## 📊 **Monitoramento:**

### **1. PM2 Monitoring:**
```bash
# Interface web
pm2 monit

# Logs em tempo real
pm2 logs --follow
```

### **2. Health Check:**
```bash
# Verificar se está funcionando
curl http://localhost:3001/api/notion-proxy
```

---

## 🚨 **Troubleshooting:**

### **Problema: Proxy não inicia**
```bash
# Verificar porta
netstat -tlnp | grep 3001

# Verificar logs
npm run pm2:logs
```

### **Problema: CORS no frontend**
- Verificar se proxy está rodando
- Verificar URL no config.ts
- Verificar firewall/portas

### **Problema: Serviço Windows não inicia**
```bash
# Verificar logs do Windows
eventvwr.msc

# Reinstalar serviço
npm run service:uninstall
npm run service:install
```

---

## ✅ **Checklist de Deploy:**

- [ ] PM2 instalado
- [ ] Proxy rodando na porta 3001
- [ ] Configuração de domínio atualizada
- [ ] Teste de conectividade
- [ ] Logs funcionando
- [ ] Auto-restart configurado
- [ ] Monitoramento ativo

---

## 🎯 **Comandos de Produção:**

```bash
# Iniciar tudo
npm run pm2:start

# Ver status
npm run pm2:status

# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Parar
npm run pm2:stop

# Deploy completo
npm run deploy
```

---

**Sistema pronto para produção!** 🚀✨


