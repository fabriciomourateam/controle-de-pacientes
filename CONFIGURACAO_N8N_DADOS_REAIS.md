# 🔧 Configuração N8N - Dados Reais

## ✅ **Sistema Pronto para Dados Reais**

O sistema agora está configurado para processar dados reais do N8N.

## 🎯 **Como Funciona**

### **1. N8N Envia Dados**
- N8N executa o cron diário
- N8N processa dados da planilha
- N8N envia dados para o webhook

### **2. Webhook Recebe Dados**
- Webhook recebe dados do N8N
- Webhook retorna dados para o frontend
- Frontend processa e salva no localStorage

### **3. Frontend Exibe Dados**
- Página carrega dados do localStorage
- Gráficos e tabelas são atualizados
- Dados reais aparecem na interface

## 🔧 **Configuração no N8N**

### **URL do Webhook:**
```
https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook
```

### **Configuração dos Nós HTTP Request:**

#### **1. Após "Upsert row(s)" - Leads que Entraram:**
- **Method**: POST
- **URL**: `https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "table": "leads_que_entraram",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

#### **2. Após "Upsert row(s)3" - Total de Leads:**
- **Method**: POST
- **URL**: `https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "table": "total_leads_mes",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

#### **3. Após "Upsert row(s)1" - Total de Calls Agendadas:**
- **Method**: POST
- **URL**: `https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "table": "calls_agendadas",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

#### **4. Após "Upsert row(s)2" - Total de Leads por Funil:**
- **Method**: POST
- **URL**: `https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "table": "leads_funis",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

#### **5. Após "Upsert row(s)4" - Total de Agendamentos por Funil:**
- **Method**: POST
- **URL**: `https://painel-fmteam-git-main-fabricio-moura-s-projects.vercel.app/api/n8n-webhook`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "table": "agend_funis",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

## 🔍 **Como Testar**

### **1. Teste Manual no N8N**
1. Execute o workflow manualmente
2. Verifique se os nós HTTP Request enviam dados
3. Confirme se o webhook recebe os dados

### **2. Teste no Site**
1. Acesse a página "Métricas Comerciais"
2. Clique em "Atualizar Dados"
3. Os dados reais do N8N devem aparecer

### **3. Verificar Logs**
1. Abra o console do navegador (F12)
2. Procure por mensagens de processamento
3. Verifique se os dados são salvos no localStorage

## 📊 **Estrutura dos Dados**

### **Leads que Entraram:**
```json
{
  "table": "leads_que_entraram",
  "data": {
    "DATA": "2024-01-15",
    "GOOGLE": 15,
    "GOOGLE_FORMS": 8,
    "INSTAGRAM": 12,
    "FACEBOOK": 6,
    "SELLER": 4,
    "INDICACAO": 3,
    "OUTROS": 2,
    "TOTAL": 50
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### **Calls Agendadas:**
```json
{
  "table": "calls_agendadas",
  "data": {
    "AGENDADAS": "2024-01-15",
    "TOTAL_DE_CALLS_AGENDADAS": 25
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

## 🎉 **Resultado Final**

- ✅ **N8N envia dados reais** para o webhook
- ✅ **Webhook processa** e retorna dados
- ✅ **Frontend exibe** dados reais na interface
- ✅ **Gráficos e tabelas** mostram dados atualizados
- ✅ **Sistema funciona** com dados reais do N8N

**Agora configure o N8N e teste com dados reais!** 🚀
