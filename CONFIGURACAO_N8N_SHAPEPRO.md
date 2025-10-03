# Configuração N8N ShapePro - Webhook Direto

## 🎯 Configuração Específica para https://n8n.shapepro.shop/

### 📋 URLs Configuradas:
- **N8N Instance**: https://n8n.shapepro.shop/
- **Webhook URL**: https://n8n.shapepro.shop/api/n8n-webhook
- **Desenvolvimento e Produção**: Mesma URL

## 🔧 Configuração no N8N

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

## 🚀 Como Testar

### 1. Teste Manual do Webhook
Acesse no navegador: `https://n8n.shapepro.shop/api/n8n-webhook`
- Deve retornar erro 405 (método não permitido) - isso é normal
- O endpoint só aceita POST

### 2. Teste com Postman/Insomnia
```bash
POST https://n8n.shapepro.shop/api/n8n-webhook
Content-Type: application/json

{
  "table": "teste",
  "data": {"teste": "dados"},
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 3. Teste no N8N
1. Execute o workflow manualmente
2. Verifique os logs dos nós HTTP Request
3. Confirme se os dados são enviados
4. Verifique se o site recebe os dados

## 🔄 Fluxo Automático

### **Quando o Cron Executar:**
1. **N8N processa** dados da planilha Google Sheets
2. **N8N salva** nas tabelas nativas
3. **N8N envia** dados para `https://n8n.shapepro.shop/api/n8n-webhook`
4. **Site recebe** e processa os dados
5. **Métricas são atualizadas** automaticamente

### **Vantagens:**
- ✅ **URL real** - Já configurada para seu N8N
- ✅ **Sem proxy** - N8N envia direto para o site
- ✅ **Automático** - Executa quando o cron rodar
- ✅ **Confiável** - Dados sempre atualizados

## 📊 Estrutura dos Dados

### **Exemplo de Dados Enviados:**
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

## 🛠️ Configuração no N8N

### **Passo a Passo:**

1. **Acesse** https://n8n.shapepro.shop/
2. **Abra seu workflow** "METRICAS PARA O PAINEL"
3. **Para cada "Upsert row(s)":**
   - Clique no nó "Upsert row(s)"
   - Clique no "+" que aparece
   - Selecione "HTTP Request"
   - Configure conforme as instruções acima
   - Conecte o nó

4. **Teste o workflow:**
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

- **URL já configurada** para https://n8n.shapepro.shop/
- **Teste primeiro** com execução manual
- **Monitore os logs** para identificar problemas
- **Configure o cron** para execução automática

Com essa configuração, o N8N enviará os dados automaticamente para o site sempre que o cron executar! 🎉
