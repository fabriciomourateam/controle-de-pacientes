# ✅ Configuração Final - N8N ShapePro

## 🎯 **URL Única para Desenvolvimento e Produção**
- **N8N Instance**: https://n8n.shapepro.shop/
- **Webhook URL**: https://n8n.shapepro.shop/api/n8n-webhook

## 📋 **O que você precisa fazer no N8N:**

### **Adicionar nós HTTP Request após cada "Upsert row(s)":**

#### **1. Após "Upsert row(s)" - Leads que Entraram:**
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
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
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
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
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
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
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
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
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Body**:
```json
{
  "table": "agend_funis",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

## 🚀 **Como Funciona:**

1. **N8N executa** o cron (ex: 06:00 todos os dias)
2. **N8N processa** dados da planilha Google Sheets
3. **N8N salva** nas tabelas nativas
4. **N8N envia** dados para `https://n8n.shapepro.shop/api/n8n-webhook`
5. **Site recebe** e processa os dados automaticamente
6. **Métricas são atualizadas** sem precisar de proxy!

## ✅ **Vantagens:**

- **URL única** - Mesma para desenvolvimento e produção
- **Sem proxy** - N8N envia direto para o site
- **Automático** - Executa quando o cron rodar
- **Confiável** - Dados sempre atualizados
- **Simples** - Só adicionar nós HTTP Request

## 🔍 **Para Testar:**

1. **Configure os nós** conforme as instruções acima
2. **Execute o workflow** manualmente no N8N
3. **Verifique os logs** dos nós HTTP Request
4. **Acesse "Métricas Comerciais"** no site
5. **Confirme se os dados aparecem** automaticamente

## 📁 **Arquivos Criados:**

- `api/n8n-webhook.js` - Endpoint para receber dados
- `src/lib/n8n-webhook-service.ts` - Serviço para processar dados
- `CONFIGURACAO_N8N_SHAPEPRO.md` - Instruções específicas

## 🎉 **Resultado Final:**

O N8N enviará os dados automaticamente para o site sempre que o cron executar, usando a URL `https://n8n.shapepro.shop/api/n8n-webhook` tanto em desenvolvimento quanto em produção!
