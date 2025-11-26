# 🔒 Isolamento de Webhooks por Usuário

## ✅ Implementação Concluída

Todos os webhooks agora incluem `user_id` e `user_email` para isolar as operações por usuário.

## 📋 Arquivos Atualizados

### 1. **AutoSyncManager** (`src/components/auto-sync/AutoSyncManager.tsx`)
- ✅ Inclui `user_id` e `user_email` no webhook
- ✅ localStorage isolado por usuário (`lastDashboardSync_${user_id}`)
- ✅ Validação de autenticação antes de sincronizar

### 2. **DashboardAutoSyncManager** (`src/components/dashboard/DashboardAutoSyncManager.tsx`)
- ✅ Inclui `user_id` e `user_email` no webhook
- ✅ localStorage isolado por usuário
- ✅ Validação de autenticação

### 3. **DashboardSyncModal** (`src/components/dashboard/DashboardSyncModal.tsx`)
- ✅ Inclui `user_id` e `user_email` no webhook
- ✅ Validação de autenticação

### 4. **CommercialMetrics** (`src/pages/CommercialMetrics.tsx`)
- ✅ Inclui `user_id` e `user_email` no webhook
- ✅ Validação de autenticação

## 🔧 O que foi implementado

### Payload dos Webhooks

Todos os webhooks agora enviam:

```json
{
  "user_id": "uuid-do-usuario",
  "user_email": "email@exemplo.com",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "dashboard" // ou "dashboard_metrics", etc.
}
```

### Webhooks Atualizados

1. **Auto-sync Dashboard**: `https://n8n.shapepro.shop/webhook/atualizardash`
2. **Métricas Comerciais**: `https://n8n.shapepro.shop/webhook/leads`
3. **Sincronização Métricas**: `https://n8n.shapepro.shop/webhook/controle`

## 🎯 Configuração no N8N

### Passo 1: Receber `user_id` e `user_email`

No nó Webhook do N8N, você receberá:

```json
{
  "user_id": "a9798432-60bd-4ac8-a035-d139a47ad59b",
  "user_email": "fabriciomouratreinador@gmail.com",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "dashboard"
}
```

### Passo 2: Filtrar por `user_id` ou `user_email`

No nó Supabase do N8N, ao fazer UPDATE/INSERT:

**Opção A: Filtrar por `user_id` (Recomendado)**
```javascript
// No nó Code antes do Supabase
const userId = $json.user_id;
const userEmail = $json.user_email;

// Passar para o próximo nó
return {
  json: {
    ...$json,
    user_id: userId,
    user_email: userEmail
  }
};
```

**Opção B: Filtrar por `user_email`**
```javascript
// Se preferir usar email
const userEmail = $json.user_email;

// Buscar user_id pelo email (se necessário)
// Ou usar diretamente o email para identificar
```

### Passo 3: Incluir `user_id` nos Updates/Inserts

No nó Supabase, sempre inclua `user_id`:

```json
{
  "user_id": "{{ $json.user_id }}",
  "nome": "{{ $json.nome }}",
  "email": "{{ $json.email }}",
  // ... outros campos
}
```

## 🔍 Exemplo de Workflow N8N

### Workflow: Atualizar Dashboard

1. **Webhook Trigger**
   - Recebe: `user_id`, `user_email`, `timestamp`, `source`

2. **Code Node** (Processar)
   ```javascript
   const userId = $json.user_id;
   const userEmail = $json.user_email;
   
   // Validar se tem user_id
   if (!userId) {
     throw new Error('user_id não fornecido');
   }
   
   return {
     json: {
       userId: userId,
       userEmail: userEmail,
       // ... outros dados
     }
   };
   ```

3. **Supabase Node** (Update/Insert)
   - Table: `dashboard_dados` (ou outra)
   - Where: `user_id = {{ $json.userId }}`
   - Data: Incluir `user_id: {{ $json.userId }}`

## ✅ Benefícios

1. **Isolamento Total**: Cada usuário só aciona seus próprios webhooks
2. **Segurança**: RLS garante que dados não sejam misturados
3. **Rastreabilidade**: Email facilita identificação no n8n
4. **Flexibilidade**: Pode usar `user_id` ou `user_email` conforme preferir

## ⚠️ Importante

- **NUNCA** processe dados sem verificar `user_id`
- **SEMPRE** inclua `user_id` em todos os inserts/updates
- **SEMPRE** filtre por `user_id` ao buscar dados
- Use `user_email` apenas para identificação/logs, não como chave primária

## 🧪 Teste

1. Faça login com sua conta
2. Clique em "Auto-sync" ou "Sincronizar Métricas"
3. Verifique no n8n que o webhook recebeu `user_id` e `user_email`
4. Verifique que os dados são salvos com o `user_id` correto
5. Faça login com outra conta e repita - os dados devem ser isolados

## 📝 Notas

- O `user_email` é enviado para facilitar identificação no n8n
- O `user_id` é o identificador principal (UUID)
- O localStorage agora é isolado por usuário
- Todos os webhooks validam autenticação antes de executar

