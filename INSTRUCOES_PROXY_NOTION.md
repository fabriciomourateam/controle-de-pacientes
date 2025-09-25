# 🔧 **Instruções para Iniciar o Proxy do Notion**

## ⚠️ **Problema Identificado:**

O erro na sincronização está acontecendo porque o **proxy do Notion não está rodando**. O sistema precisa do proxy para contornar problemas de CORS ao acessar a API do Notion.

---

## 🚀 **Solução:**

### **1. Iniciar o Proxy Server:**

**Opção A - Script Batch (Recomendado):**
```bash
# No terminal, execute:
start-proxy.bat
```

**Opção B - Comando Direto:**
```bash
# No terminal, execute:
node proxy-server.js
```

### **2. Verificar se está Funcionando:**

O proxy deve estar rodando na **porta 3001**. Você verá uma mensagem como:
```
Servidor proxy rodando na porta 3001
```

### **3. Testar a Sincronização:**

Após iniciar o proxy:
1. **Acesse** o dashboard `/metrics`
2. **Clique** "Sincronizar Métricas"
3. **Configure** API Key e Database ID
4. **Execute** a sincronização

---

## 🔍 **Como Verificar se o Proxy está Rodando:**

### **Teste 1 - PowerShell:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/notion-proxy" -Method POST -ContentType "application/json" -Body '{"test": true}'
```

**Resultado esperado:** `{"success":false,"error":"API Key e Database ID são obrigatórios"}`

### **Teste 2 - Browser:**
Abra: http://localhost:3001/api/notion-proxy

**Resultado esperado:** Página de erro (normal, pois é uma API)

---

## 🔧 **Configuração do Proxy:**

O proxy está configurado em `proxy-server.js`:
- **Porta:** 3001
- **Endpoint:** `/api/notion-proxy`
- **Função:** Contornar CORS para API do Notion

---

## 🚨 **Troubleshooting:**

### **Se o proxy não iniciar:**
1. **Verifique** se Node.js está instalado
2. **Instale** dependências: `npm install`
3. **Verifique** se a porta 3001 está livre

### **Se ainda houver erro:**
1. **Verifique** se o proxy está rodando na porta 3001
2. **Confirme** API Key e Database ID do Notion
3. **Verifique** se a base está compartilhada com a integração

---

## ✅ **Próximos Passos:**

1. **Inicie** o proxy server
2. **Teste** a sincronização no dashboard
3. **Verifique** os dados no dashboard

---

**O proxy é necessário para a sincronização funcionar corretamente!** 🔧✨











