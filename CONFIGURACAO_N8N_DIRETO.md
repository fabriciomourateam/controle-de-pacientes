# Configuração N8N → Site Direto (Sem Proxy)

## 🎯 Objetivo
Fazer o N8N enviar dados diretamente para o site quando o cron rodar, sem precisar de proxy.

## 📋 Configuração no N8N

### 1. Adicionar Nós HTTP Request Após Cada "Upsert row(s)"

#### **Após "Upsert row(s)" - Leads que Entraram:**
- **Nó**: HTTP Request
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "table": "leads_que_entraram",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

#### **Após "Upsert row(s)3" - Total de Leads:**
- **Nó**: HTTP Request
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "table": "total_leads_mes",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

#### **Após "Upsert row(s)1" - Total de Calls Agendadas:**
- **Nó**: HTTP Request
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "table": "calls_agendadas",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

#### **Após "Upsert row(s)2" - Total de Leads por Funil:**
- **Nó**: HTTP Request
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "table": "leads_funis",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

#### **Após "Upsert row(s)4" - Total de Agendamentos por Funil:**
- **Nó**: HTTP Request
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/api/n8n-webhook`
- **Headers**:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "table": "agend_funis",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

## 🚀 Configuração do Site

### 1. Criar Endpoint de Webhook
O arquivo `api/n8n-webhook.js` já foi criado e deve ser colocado no seu projeto.

### 2. Configurar URL do Site
Substitua `https://seu-site.com` pela URL real do seu site:
- **Desenvolvimento**: `https://n8n.shapepro.shop`
- **Produção**: `https://n8n.shapepro.shop` (mesma URL)

### 3. Testar o Webhook
- Acesse `https://n8n.shapepro.shop/api/n8n-webhook` no navegador
- Deve retornar erro 405 (método não permitido) - isso é normal
- O endpoint só aceita POST

## 🔄 Como Funciona

### **Fluxo Automático:**
1. **Cron do N8N** executa (ex: 06:00 todos os dias)
2. **N8N processa** dados da planilha
3. **N8N salva** nas tabelas nativas
4. **N8N envia** dados para o site via HTTP Request
5. **Site recebe** e processa os dados
6. **Métricas são atualizadas** automaticamente

### **Vantagens:**
- ✅ **Sem proxy** - N8N envia direto para o site
- ✅ **Automático** - Executa quando o cron rodar
- ✅ **Confiável** - Dados sempre atualizados
- ✅ **Simples** - Só adicionar nós HTTP Request

## 📊 Estrutura dos Dados Enviados

### **Leads que Entraram:**
```json
{
  "table": "leads_que_entraram",
  "data": {
    "DATA": "2024-01-15",
    "GOOGLE": 10,
    "GOOGLE_FORMS": 5,
    "INSTAGRAM": 8,
    "FACEBOOK": 3,
    "SELLER": 2,
    "INDICACAO": 4,
    "OUTROS": 1,
    "TOTAL": 33
  },
  "timestamp": "2024-01-15T06:00:00.000Z"
}
```

### **Calls Agendadas:**
```json
{
  "table": "calls_agendadas",
  "data": {
    "AGENDADAS": "2024-01-15",
    "TOTAL_DE_CALLS_AGENDADAS": 25,
    "PERCENT_QUE_VAI_PRA_CALL": "75.8%"
  },
  "timestamp": "2024-01-15T06:00:00.000Z"
}
```

## 🛠️ Configuração no N8N

### **Passo a Passo:**

1. **Abra seu workflow N8N**
2. **Para cada "Upsert row(s)":**
   - Clique no nó "Upsert row(s)"
   - Clique no "+" que aparece
   - Selecione "HTTP Request"
   - Configure conforme as instruções acima
   - Conecte o nó

3. **Teste o workflow:**
   - Execute manualmente
   - Verifique se os dados são enviados
   - Confirme se o site recebe os dados

## 🔍 Verificação

### **No N8N:**
- Verifique os logs dos nós HTTP Request
- Confirme se não há erros
- Verifique se os dados estão sendo enviados

### **No Site:**
- Acesse "Métricas Comerciais"
- Verifique se os dados aparecem
- Use "Forçar Atualização" se necessário

## ⚠️ Importante

- **Configure a URL correta** do seu site
- **Teste primeiro** com execução manual
- **Monitore os logs** para identificar problemas
- **Configure o cron** para execução automática

Com essa configuração, o N8N enviará os dados automaticamente para o site sempre que o cron executar! 🎉
