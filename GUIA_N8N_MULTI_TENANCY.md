# 🔧 Guia de Configuração N8N com Multi-Tenancy

## ✅ Status Atual

Seus testes mostraram que:
- ✅ Multi-tenancy está configurado corretamente
- ✅ RLS está ativo
- ✅ Triggers estão funcionando
- ✅ Seus dados estão protegidos

## ⚠️ IMPORTANTE: N8N e Multi-Tenancy

### Como Funciona

Quando o N8N insere dados via webhook, ele precisa incluir o `user_id` nos inserts/updates. Existem duas formas:

#### **Opção 1: N8N passa `user_id` (Recomendado)**

O webhook já envia `user_id` e `user_email`. O N8N deve incluir esses dados nos inserts:

```json
{
  "user_id": "a9798432-60bd-4ac8-a035-d139a47ad59b",
  "user_email": "fabriciomouratreinador@gmail.com",
  "mes": "Janeiro",
  "ano": "2025",
  "ativos_total_inicio_mes": "100",
  // ... outros campos
}
```

#### **Opção 2: Trigger preenche automaticamente (Funciona, mas com limitação)**

O trigger `set_user_id_dashboard_dados` preenche `user_id` automaticamente se não for passado, **MAS**:

- ⚠️ O trigger usa `auth.uid()` que é o usuário autenticado
- ⚠️ Se o N8N usar **Service Role** (sem autenticação), o trigger não funcionará
- ⚠️ A política RLS exige que `user_id = auth.uid()`, então precisa passar corretamente

### ⚠️ Problema com Service Role

Se o N8N usar **Service Role Key** (que bypassa RLS), o trigger não consegue pegar `auth.uid()` porque não há usuário autenticado.

**Solução**: O N8N **DEVE** passar `user_id` explicitamente nos inserts/updates.

---

## 🔧 Configuração no N8N

### Passo 1: Receber `user_id` do Webhook

No nó **Webhook** do N8N, você receberá:

```json
{
  "user_id": "a9798432-60bd-4ac8-a035-d139a47ad59b",
  "user_email": "fabriciomouratreinador@gmail.com",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "dashboard_metrics"
}
```

### Passo 2: Processar e Incluir `user_id`

No nó **Code** ou **Function** antes do Supabase:

```javascript
// Extrair user_id do webhook
const userId = $json.user_id;
const userEmail = $json.user_email;

// Validar
if (!userId) {
  throw new Error('user_id não fornecido no webhook');
}

// Processar dados do Notion (ou de onde vier)
const dadosProcessados = {
  // ... seus dados processados ...
  mes: "Janeiro",
  ano: "2025",
  mes_numero: "1",
  ativos_total_inicio_mes: "100",
  entraram: "10",
  sairam: "5",
  // ... outros campos ...
  
  // ⚠️ IMPORTANTE: Incluir user_id
  user_id: userId
};

return {
  json: dadosProcessados
};
```

### Passo 3: Inserir no Supabase

No nó **Supabase** (INSERT ou UPSERT):

**Configuração:**
- **Table**: `dashboard_dados`
- **Operation**: `Insert` ou `Upsert`
- **Data**: Incluir todos os campos + `user_id`

**Exemplo de Data:**
```json
{
  "user_id": "{{ $json.user_id }}",
  "mes": "{{ $json.mes }}",
  "ano": "{{ $json.ano }}",
  "mes_numero": "{{ $json.mes_numero }}",
  "ativos_total_inicio_mes": "{{ $json.ativos_total_inicio_mes }}",
  "entraram": "{{ $json.entraram }}",
  "sairam": "{{ $json.sairam }}"
  // ... outros campos ...
}
```

### Passo 4: Filtrar por `user_id` em Updates

Se for fazer UPDATE, sempre filtrar por `user_id`:

**Configuração:**
- **Table**: `dashboard_dados`
- **Operation**: `Update`
- **Where**: `user_id = {{ $json.user_id }} AND ano = {{ $json.ano }} AND mes_numero = {{ $json.mes_numero }}`
- **Data**: Campos a atualizar + `user_id`

---

## 🔍 Exemplo Completo de Workflow N8N

### Workflow: Sincronizar Métricas do Notion

```
1. Webhook Trigger
   ↓
   Recebe: { user_id, user_email, timestamp, source }
   
2. Notion Node (Buscar dados)
   ↓
   Busca dados do Notion Database
   
3. Code Node (Processar)
   ↓
   Processa dados e adiciona user_id
   {
     ...dadosNotion,
     user_id: $json.user_id
   }
   
4. Supabase Node (Upsert)
   ↓
   Table: dashboard_dados
   Where: user_id = {{ $json.user_id }} AND ano = {{ $json.ano }} AND mes_numero = {{ $json.mes_numero }}
   Data: Todos os campos incluindo user_id
```

---

## ✅ Verificação

### Teste 1: Verificar se N8N está passando `user_id`

Execute no Supabase SQL Editor:

```sql
-- Verificar últimas inserções e seus user_id
SELECT 
    id,
    mes,
    ano,
    user_id,
    created_at,
    (SELECT email FROM auth.users WHERE id = dashboard_dados.user_id) as email_proprietario
FROM dashboard_dados
ORDER BY created_at DESC
LIMIT 10;
```

**✅ Resultado esperado**: Todos os registros devem ter `user_id` preenchido.

### Teste 2: Verificar isolamento após inserção via N8N

1. **Faça login com sua conta**
2. **Acione o webhook do N8N**
3. **Verifique se os dados aparecem apenas para você**:
   ```sql
   SELECT COUNT(*) as minhas_metricas
   FROM dashboard_dados
   WHERE user_id = auth.uid();
   ```

---

## 🚨 Problemas Comuns

### Problema: N8N insere dados sem `user_id`

**Sintoma**: Dados inseridos via N8N não aparecem para ninguém ou aparecem para todos.

**Solução**:
1. Verifique se o N8N está incluindo `user_id` no payload
2. Verifique se o nó Supabase está passando `user_id` no data
3. Se usar Service Role, certifique-se de passar `user_id` explicitamente

### Problema: Dados aparecem para usuário errado

**Sintoma**: Dados inseridos via N8N aparecem para outro usuário.

**Solução**:
1. Verifique se o `user_id` no webhook está correto
2. Verifique se o N8N está usando o `user_id` correto nos inserts
3. Verifique se não há confusão entre usuários no workflow

### Problema: RLS bloqueia inserção do N8N

**Sintoma**: N8N retorna erro ao inserir dados.

**Solução**:
1. Se usar Service Role, certifique-se de passar `user_id` corretamente
2. Verifique se a política RLS permite INSERT com `user_id` correto
3. Verifique se o trigger está funcionando (se não passar `user_id`)

---

## 📋 Checklist de Configuração N8N

- [ ] Webhook recebe `user_id` e `user_email`
- [ ] Code Node processa e mantém `user_id`
- [ ] Supabase Node inclui `user_id` no data
- [ ] Supabase Node filtra por `user_id` em updates
- [ ] Testado inserção via N8N
- [ ] Verificado que dados aparecem apenas para o usuário correto
- [ ] Verificado isolamento entre usuários

---

## ✅ Conclusão

**SIM, o N8N continua funcionando**, mas precisa:

1. ✅ Receber `user_id` do webhook
2. ✅ Incluir `user_id` em todos os inserts/updates
3. ✅ Filtrar por `user_id` em queries/updates

**Seu sistema está configurado corretamente!** 🎉

Apenas certifique-se de que o N8N está passando `user_id` corretamente nos inserts/updates.

