# Configuração dos Nós N8N para Métricas Comerciais

## ⚠️ ATENÇÃO: SOLUÇÃO SIMPLIFICADA DISPONÍVEL!

**NÃO É MAIS NECESSÁRIO** adicionar nós HTTP Request! O sistema agora busca dados diretamente das tabelas do N8N via API.

## Visão Geral
O sistema agora funciona **automaticamente** buscando dados diretamente das tabelas do N8N, sem precisar de webhooks ou nós adicionais.

## Configuração Atual
- **URL N8N**: https://n8n.shapepro.shop/
- **API Key**: Configurada ✅
- **Tabelas**: Mapeadas ✅

## Nós a Adicionar

### 1. Após "Upsert row(s)" - Leads que Entraram

Adicione um nó **HTTP Request** após o nó "Upsert row(s)" (ID: b19fde6d-d6a7-4a6d-83de-341342a5db37):

#### Configuração do HTTP Request:
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/webhook/leads-updated`
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

### 2. Após "Upsert row(s)3" - Total de Leads

Adicione um nó **HTTP Request** após o nó "Upsert row(s)3" (ID: da0bcb64-2480-4a26-a197-c9b1c55cbb63):

#### Configuração do HTTP Request:
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/webhook/leads-monthly-updated`
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

### 3. Após "Upsert row(s)1" - Total de Calls Agendadas

Adicione um nó **HTTP Request** após o nó "Upsert row(s)1" (ID: 85526b98-3dd2-4552-b473-667fd0a75f57):

#### Configuração do HTTP Request:
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/webhook/calls-updated`
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

### 4. Após "Upsert row(s)2" - Total de Leads por Funil

Adicione um nó **HTTP Request** após o nó "Upsert row(s)2" (ID: b572ace1-f567-4413-8371-bb37956f54b6):

#### Configuração do HTTP Request:
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/webhook/leads-funis-updated`
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

### 5. Após "Upsert row(s)4" - Total de Agendamentos por Funil

Adicione um nó **HTTP Request** após o nó "Upsert row(s)4" (ID: 42ebf60d-90bb-4d57-a30f-775b4093ffbd):

#### Configuração do HTTP Request:
- **Method**: POST
- **URL**: `https://n8n.shapepro.shop/webhook/agend-funis-updated`
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

## Configuração Alternativa: Webhook Único

Se preferir, você pode criar um webhook único que recebe todos os dados:

### Webhook Único:
- **URL**: `https://n8n.shapepro.shop/webhook/metrics-updated`
- **Body**:
  ```json
  {
    "table": "={{ $json.table_name }}",
    "data": "={{ $json }}",
    "timestamp": "={{ $now }}"
  }
  ```

## Como Adicionar os Nós

### Passo a Passo:

1. **Abra seu workflow N8N**
2. **Para cada "Upsert row(s)":**
   - Clique no nó "Upsert row(s)"
   - Clique no "+" que aparece
   - Selecione "HTTP Request"
   - Configure conforme as instruções acima
   - Conecte o nó

3. **Teste o workflow:**
   - Execute o workflow manualmente
   - Verifique se os webhooks são chamados
   - Confirme se os dados aparecem no site

## Verificação

### No Site:
1. Acesse "Métricas Comerciais"
2. Clique em "Testar Conexão"
3. Verifique se retorna sucesso
4. Confirme se os dados aparecem

### No N8N:
1. Verifique os logs dos nós HTTP Request
2. Confirme se não há erros
3. Verifique se os dados estão sendo enviados

## Solução de Problemas

### ❌ **Erro: "Connection refused"**
- **Causa**: URL do webhook incorreta
- **Solução**: Verifique se a URL está correta

### ❌ **Erro: "404 Not Found"**
- **Causa**: Webhook não existe
- **Solução**: Crie o webhook no N8N primeiro

### ❌ **Dados não aparecem**
- **Causa**: Webhook não está sendo chamado
- **Solução**: Verifique se o nó HTTP Request está conectado corretamente

## Próximos Passos

1. **Adicione os nós HTTP Request** conforme as instruções
2. **Teste o workflow** manualmente
3. **Verifique no site** se os dados aparecem
4. **Configure execução automática** se necessário

Com essa configuração, os dados serão automaticamente enviados para o site sempre que o workflow for executado! 🎉
