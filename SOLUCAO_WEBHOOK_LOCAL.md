# Solução Webhook Local para N8N

## ❌ Problema Identificado
O endpoint `/api/n8n-webhook` não existe no seu site, causando erro 404.

## ✅ Solução: Webhook Local

### 🚀 **Passo 1: Iniciar Webhook Local**

Execute o arquivo `iniciar-webhook-teste.bat`:
- Clique duas vezes no arquivo
- Aguarde a instalação das dependências
- Mantenha a janela aberta

### 📡 **URL do Webhook:**
- **URL para N8N**: `http://localhost:3003/api/n8n-webhook`
- **Teste**: `http://localhost:3003/health`

## 🔧 **Configuração no N8N**

### **Adicionar nós HTTP Request após cada "Upsert row(s)":**

#### **1. Após "Upsert row(s)" - Leads que Entraram:**
- **Method**: POST
- **URL**: `http://localhost:3003/api/n8n-webhook`
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
- **URL**: `http://localhost:3003/api/n8n-webhook`
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
- **URL**: `http://localhost:3003/api/n8n-webhook`
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
- **URL**: `http://localhost:3003/api/n8n-webhook`
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
- **URL**: `http://localhost:3003/api/n8n-webhook`
- **Body**:
```json
{
  "table": "agend_funis",
  "data": "={{ $json }}",
  "timestamp": "={{ $now }}"
}
```

## 🔍 **Como Testar**

### **1. Teste do Webhook:**
- Acesse `http://localhost:3003/health` no navegador
- Deve retornar: `{"status":"ok","message":"Webhook público funcionando"}`

### **2. Teste no N8N:**
1. Execute o workflow manualmente
2. Verifique os logs dos nós HTTP Request
3. Confirme se os dados são enviados
4. Verifique se o webhook recebe os dados

### **3. Verificar Logs:**
- No terminal do webhook, você verá:
```
📊 Dados recebidos do N8N:
📅 Timestamp: 2024-01-15T10:00:00.000Z
📋 Dados: {...}
✅ Processando tabela: leads_que_entraram
📊 Registros: 1
```

## 🚀 **Como Funciona**

1. **N8N executa** o cron
2. **N8N processa** dados da planilha
3. **N8N salva** nas tabelas nativas
4. **N8N envia** dados para `http://localhost:3003/api/n8n-webhook`
5. **Webhook recebe** e processa os dados
6. **Logs mostram** os dados recebidos

## ⚠️ **Importante**

- **Mantenha o webhook rodando** enquanto usar o N8N
- **Não feche a janela** do webhook
- **O webhook roda na porta 3003** - não mude
- **Use a URL local** no N8N: `http://localhost:3003/api/n8n-webhook`

## 🎯 **Próximos Passos**

1. **Execute** `iniciar-webhook-teste.bat`
2. **Configure os nós** no N8N conforme as instruções
3. **Teste o workflow** manualmente
4. **Verifique os logs** do webhook
5. **Configure o cron** para execução automática

Com essa solução, o N8N enviará os dados para o webhook local e você poderá ver os logs em tempo real! 🎉
