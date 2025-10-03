# 🔧 Solução Webhook Público - N8N

## ❌ **Problema Identificado**
- Vercel está exigindo autenticação para todos os endpoints
- N8N não consegue acessar o webhook
- Deploy falhou devido a configuração inválida

## ✅ **Solução: Webhook Público Temporário**

### **Opção 1: Usar webhook.io (Recomendado)**

1. **Acesse**: https://webhook.site/
2. **Copie a URL** gerada (exemplo: `https://webhook.site/abc123`)
3. **Use esta URL** no N8N temporariamente

### **Opção 2: Usar ngrok (Para teste local)**

1. **Instale ngrok**: https://ngrok.com/download
2. **Execute**: `ngrok http 3000`
3. **Use a URL** gerada (exemplo: `https://abc123.ngrok.io/api/n8n-webhook`)

### **Opção 3: Usar RequestBin**

1. **Acesse**: https://requestbin.com/
2. **Crie um bin** e copie a URL
3. **Use esta URL** no N8N

## 🔧 **Configuração no N8N**

### **URL Temporária (webhook.site):**
```
https://webhook.site/SEU_ID_AQUI
```

### **Configuração dos Nós HTTP Request:**

#### **1. Após "Upsert row(s)" - Leads que Entraram:**
- **Method**: POST
- **URL**: `https://webhook.site/SEU_ID_AQUI`
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
- **URL**: `https://webhook.site/SEU_ID_AQUI`
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
- **URL**: `https://webhook.site/SEU_ID_AQUI`
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
- **URL**: `https://webhook.site/SEU_ID_AQUI`
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
- **URL**: `https://webhook.site/SEU_ID_AQUI`
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

### **1. Teste no webhook.site**
1. Configure o N8N com a URL do webhook.site
2. Execute o workflow manualmente
3. Verifique se os dados aparecem no webhook.site

### **2. Teste no Site**
1. Acesse a página "Métricas Comerciais"
2. Clique em "Simular Dados N8N"
3. Dados simulados aparecem para teste

## 📊 **Estrutura dos Dados**

### **Exemplo de dados que o N8N deve enviar:**
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

## 🎯 **Próximos Passos**

1. **Use webhook.site** temporariamente
2. **Configure o N8N** com a URL do webhook.site
3. **Teste o workflow** no N8N
4. **Verifique se os dados** são enviados corretamente
5. **Depois configure** um webhook permanente

## 🚀 **Solução Permanente**

Para uma solução permanente, você pode:
1. **Usar um servidor próprio** (VPS, AWS, etc.)
2. **Usar um serviço de webhook** pago
3. **Configurar o Vercel** para permitir acesso público

**Use webhook.site para testar agora e depois configure uma solução permanente!** 🎉
