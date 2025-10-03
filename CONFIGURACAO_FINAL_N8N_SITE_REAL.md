# Configuração Final N8N - Site Real

## ✅ **Solução Implementada**

O endpoint `/api/n8n-webhook` foi configurado no seu site e está pronto para receber dados do N8N.

## 🌐 **URL do Webhook**

**URL para usar no N8N:**
```
https://painel-fmteam.vercel.app/api/n8n-webhook
```

## 🔧 **Configuração no N8N**

### **Adicionar nós HTTP Request após cada "Upsert row(s)":**

#### **1. Após "Upsert row(s)" - Leads que Entraram:**
- **Method**: POST
- **URL**: `https://painel-fmteam.vercel.app/api/n8n-webhook`
- **Headers**:
  - `Content-Type`: `application/json`
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
- **URL**: `https://painel-fmteam.vercel.app/api/n8n-webhook`
- **Headers**:
  - `Content-Type`: `application/json`
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
- **URL**: `https://painel-fmteam.vercel.app/api/n8n-webhook`
- **Headers**:
  - `Content-Type`: `application/json`
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
- **URL**: `https://painel-fmteam.vercel.app/api/n8n-webhook`
- **Headers**:
  - `Content-Type`: `application/json`
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
- **URL**: `https://painel-fmteam.vercel.app/api/n8n-webhook`
- **Headers**:
  - `Content-Type`: `application/json`
- **Body**:
```json
{
  "table": "agend_funis",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

## 🔍 **Como Testar**

### **1. Teste do Endpoint:**
Acesse no navegador:
```
https://painel-fmteam.vercel.app/api/n8n-webhook
```

Deve retornar:
```json
{
  "success": true,
  "message": "Webhook N8N funcionando",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "instructions": "Use POST para enviar dados do N8N",
  "endpoint": "/api/n8n-webhook"
}
```

### **2. Teste no N8N:**
1. Execute o workflow manualmente
2. Verifique os logs dos nós HTTP Request
3. Confirme se os dados são enviados
4. Verifique se o webhook recebe os dados

### **3. Verificar Logs:**
No Vercel, você pode ver os logs em:
- Dashboard Vercel → Seu Projeto → Functions → Logs

## 🚀 **Deploy**

### **Para fazer o deploy:**
1. **Commit e push** das alterações:
   ```bash
   git add .
   git commit -m "Adicionar endpoint N8N webhook"
   git push
   ```

2. **O Vercel fará o deploy automaticamente**

3. **Teste a URL** após o deploy

## ⚠️ **Importante**

- **Substitua `seu-site.vercel.app`** pela URL real do seu site
- **O endpoint está configurado** no `vercel.json`
- **CORS está habilitado** para aceitar requisições do N8N
- **O endpoint aceita GET e POST** para testes

## 🎯 **Próximos Passos**

1. **Faça o deploy** do site
2. **Configure os nós** no N8N com a URL real
3. **Teste o endpoint** no navegador
4. **Execute o workflow** no N8N
5. **Verifique os logs** no Vercel

Com essa configuração, o N8N enviará os dados diretamente para o seu site! 🎉
