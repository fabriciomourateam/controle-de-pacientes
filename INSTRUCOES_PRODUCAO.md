# 🚀 **Configuração para Produção - Proxy Automático**

## 🎯 **Problema:**
O proxy do Notion precisa rodar automaticamente em produção, sem intervenção manual.

---

## 🔧 **Soluções para Produção:**

### **Opção 1: PM2 (Recomendado)**

#### **1. Instalar PM2:**
```bash
npm install -g pm2
```

#### **2. Criar arquivo de configuração:**
```json
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'notion-proxy',
    script: 'proxy-server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

#### **3. Comandos PM2:**
```bash
# Iniciar
pm2 start ecosystem.config.js

# Ver status
pm2 status

# Parar
pm2 stop notion-proxy

# Reiniciar
pm2 restart notion-proxy

# Logs
pm2 logs notion-proxy

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

---

### **Opção 2: Docker (Mais Robusto)**

#### **1. Criar Dockerfile:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "proxy-server.js"]
```

#### **2. Criar docker-compose.yml:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  notion-proxy:
    build: .
    ports:
      - "3001:3001"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

#### **3. Comandos Docker:**
```bash
# Construir e iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Reiniciar
docker-compose restart
```

---

### **Opção 3: Serviço Windows (Para Windows Server)**

#### **1. Instalar node-windows:**
```bash
npm install -g node-windows
```

#### **2. Criar serviço:**
```javascript
// install-service.js
var Service = require('node-windows').Service;

var svc = new Service({
  name: 'Notion Proxy',
  description: 'Proxy server for Notion API',
  script: require('path').join(__dirname, 'proxy-server.js')
});

svc.on('install', function(){
  svc.start();
});

svc.install();
```

#### **3. Comandos:**
```bash
# Instalar serviço
node install-service.js

# Desinstalar serviço
node uninstall-service.js
```

---

### **Opção 4: Nginx + Proxy (Para VPS/Dedicado)**

#### **1. Configurar Nginx:**
```nginx
# /etc/nginx/sites-available/notion-proxy
server {
    listen 80;
    server_name seu-dominio.com;

    location /api/notion-proxy {
        proxy_pass http://localhost:3001/api/notion-proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### **2. Ativar site:**
```bash
sudo ln -s /etc/nginx/sites-available/notion-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 **Configuração Automática do Frontend:**

### **1. Detectar Ambiente:**
```javascript
// src/lib/config.js
export const config = {
  isProduction: process.env.NODE_ENV === 'production',
  proxyUrl: process.env.NODE_ENV === 'production' 
    ? 'https://seu-dominio.com/api/notion-proxy'
    : 'http://localhost:3001/api/notion-proxy'
}
```

### **2. Atualizar NotionService:**
```javascript
// src/lib/notion-proxy.ts
import { config } from './config';

export async function fetchNotionData(apiKey, databaseId, requestBody = {}) {
  const response = await fetch(config.proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      databaseId,
      action: 'query',
      requestBody
    })
  });
  
  return response.json();
}
```

---

## 🌐 **Deploy Completo:**

### **1. Vercel/Netlify (Frontend):**
```bash
# Deploy automático
vercel --prod

# Variáveis de ambiente
vercel env add PROXY_URL https://seu-dominio.com/api/notion-proxy
```

### **2. Railway/Render (Backend):**
```bash
# Deploy do proxy
railway login
railway init
railway up
```

### **3. VPS/Dedicado:**
```bash
# Clonar repositório
git clone seu-repositorio.git
cd controle-de-pacientes

# Instalar dependências
npm install

# Configurar PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Configurar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## 🔧 **Scripts de Automação:**

### **1. package.json:**
```json
{
  "scripts": {
    "start": "node proxy-server.js",
    "start:prod": "NODE_ENV=production node proxy-server.js",
    "pm2:start": "pm2 start ecosystem.config.js",
    "pm2:stop": "pm2 stop notion-proxy",
    "pm2:restart": "pm2 restart notion-proxy",
    "docker:build": "docker build -t notion-proxy .",
    "docker:run": "docker run -p 3001:3001 notion-proxy"
  }
}
```

### **2. Script de Deploy:**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Iniciando deploy..."

# Parar serviço atual
pm2 stop notion-proxy

# Atualizar código
git pull origin main

# Instalar dependências
npm install

# Iniciar serviço
pm2 start ecosystem.config.js

echo "✅ Deploy concluído!"
```

---

## ✅ **Recomendação Final:**

### **Para Produção Simples:**
- **PM2** + **VPS** (mais fácil)

### **Para Produção Robusta:**
- **Docker** + **Nginx** + **VPS** (mais escalável)

### **Para Produção Enterprise:**
- **Kubernetes** + **Load Balancer** (mais complexo)

---

**Escolha a opção que melhor se adequa ao seu ambiente de produção!** 🎯✨












