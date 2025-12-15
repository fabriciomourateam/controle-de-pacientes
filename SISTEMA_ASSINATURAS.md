# 🔐 Sistema de Assinaturas e Bloqueio

## Como Funciona

### ✅ Usuários Liberados (Sem Bloqueio)
1. **Você (Admin)** - `fabriciomouratreinador@gmail.com`
   - Acesso ilimitado sempre
   - Nunca é bloqueado
   
2. **Membros da sua equipe**
   - Qualquer membro vinculado à sua conta
   - Acesso ilimitado enquanto estiver na sua equipe
   - Status: `active` na tabela `team_members`

### ❌ Usuários que Podem Ser Bloqueados
- Todos os outros nutricionistas que se cadastrarem
- Bloqueio acontece quando:
  - Trial de 30 dias expira
  - Assinatura não está paga (status ≠ 'active')

## 📊 Fluxo de Assinatura

### 1. Novo Usuário se Cadastra
```
✓ Cria conta no sistema
✓ Recebe automaticamente trial de 30 dias
✓ Status: 'trial'
✓ trial_end: hoje + 30 dias
```

### 2. Durante o Trial (30 dias)
```
✓ Acesso total ao sistema
✓ Pode criar pacientes
✓ Pode usar todos os recursos
✓ Vê aviso: "X dias restantes de trial"
```

### 3. Trial Expira (após 30 dias)
```
❌ Sistema bloqueia acesso
❌ Não consegue criar novos pacientes
❌ Não consegue acessar recursos premium
✓ Vê modal: "Período de Trial Expirado"
✓ Botão: "Fazer Upgrade Agora" → Kiwify
```

### 4. Usuário Paga via Kiwify
```
✓ Webhook do Kiwify atualiza banco
✓ Status muda de 'trial' para 'active'
✓ Sistema desbloqueia automaticamente
✓ Acesso total liberado
```

## 🔧 Configuração Necessária

### 1. Execute o SQL
```bash
sql/fix-subscription-plans-rls-final.sql
```

### 2. Configure o Link do Kiwify
Edite o arquivo:
```
src/components/subscription/SubscriptionBlockedModal.tsx
```

Linha 22, substitua:
```typescript
window.open('https://pay.kiwify.com.br/SEU_LINK_AQUI', '_blank');
```

Por:
```typescript
window.open('https://pay.kiwify.com.br/seu-link-real', '_blank');
```

### 3. Configure o Webhook do Kiwify
O webhook deve atualizar a tabela `user_subscriptions`:

```sql
-- Quando usuário paga
UPDATE user_subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days',
  payment_provider = 'kiwify',
  payment_provider_subscription_id = 'ID_DA_KIWIFY'
WHERE user_id = 'UUID_DO_USUARIO';
```

## 📋 Tabelas Envolvidas

### `subscription_plans`
- Planos disponíveis (Free, Basic, Professional, Unlimited)
- Tabela global - todos veem os mesmos planos

### `user_subscriptions`
- Uma linha por usuário
- Controla status da assinatura
- Campos importantes:
  - `status`: 'trial', 'active', 'canceled', 'expired'
  - `trial_end`: data de fim do trial
  - `current_period_end`: data de fim do período pago

### `team_members`
- Membros da equipe
- Se `owner_id` = ID do admin → sempre liberado

## 🧪 Como Testar

### Testar Bloqueio
1. Crie um usuário de teste
2. No banco, atualize:
```sql
UPDATE user_subscriptions
SET 
  status = 'trial',
  trial_end = NOW() - INTERVAL '1 day'  -- Trial expirado ontem
WHERE user_id = 'UUID_DO_TESTE';
```
3. Faça login com esse usuário
4. Deve ver o modal de bloqueio

### Testar Desbloqueio
1. No banco, atualize:
```sql
UPDATE user_subscriptions
SET 
  status = 'active',
  current_period_start = NOW(),
  current_period_end = NOW() + INTERVAL '30 days'
WHERE user_id = 'UUID_DO_TESTE';
```
2. Recarregue a página
3. Deve ter acesso liberado

## 🎯 Verificações de Segurança

O sistema verifica em:
1. **Ao carregar o dashboard** - mostra modal se bloqueado
2. **Ao criar paciente** - verifica limite do plano
3. **Ao acessar recursos premium** - verifica permissão

## 📞 Suporte

Se tiver problemas:
1. Verifique se o SQL foi executado
2. Verifique se o link do Kiwify está correto
3. Verifique se o webhook está configurado
4. Veja os logs no console do navegador
