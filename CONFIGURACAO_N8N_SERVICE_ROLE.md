# 🔐 Configuração do N8N com Service Role Key

## Problema Resolvido

Com as políticas RLS ativas, o n8n não conseguia fazer inserts/updates porque não havia um usuário autenticado. A solução é usar a **Service Role Key** do Supabase, que bypassa todas as políticas RLS.

## ✅ O que foi implementado

1. **Cliente Supabase com Service Role** (`src/integrations/supabase/service-client.ts`)
   - Cliente especial que ignora RLS
   - Usa Service Role Key em vez de Anon Key

2. **Webhook atualizado** (`src/pages/api/n8n-webhook.ts`)
   - Agora usa `supabaseService` em vez de `supabase`
   - Busca automaticamente o `user_id` de um paciente existente
   - Inclui `user_id` em todos os inserts/updates

## 📋 Passo a Passo para Configurar

### 1. Obter a Service Role Key

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Role até encontrar **"service_role" key**
5. ⚠️ **COPIE A SERVICE ROLE KEY** (não a anon key!)

### 2. Adicionar ao arquivo .env

Adicione a seguinte linha no seu arquivo `.env`:

```env
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

⚠️ **IMPORTANTE**: 
- NUNCA commite a Service Role Key no Git!
- Adicione `.env` ao `.gitignore`
- A Service Role Key dá acesso total ao banco, use com cuidado!

### 3. Verificar se está funcionando

Após configurar, teste o webhook do n8n. Ele deve:
- ✅ Fazer inserts sem erro de RLS
- ✅ Vincular dados ao seu `user_id` automaticamente
- ✅ Funcionar mesmo com políticas RLS ativas

## 🔍 Como Funciona

1. **Service Role Key**: Bypassa todas as políticas RLS
2. **Busca de user_id**: O código busca o `user_id` de um paciente existente (que já foi migrado para você)
3. **Inclusão automática**: Todos os inserts/updates incluem o `user_id` correto

## ⚠️ Segurança

- A Service Role Key só deve ser usada em **servidor/backend**
- **NUNCA** use no frontend
- Mantenha a chave segura e não compartilhe

## 🐛 Troubleshooting

### Erro: "SUPABASE_SERVICE_ROLE_KEY não configurada"
- Verifique se adicionou a variável no `.env`
- Reinicie o servidor após adicionar

### Erro: "Não foi possível determinar user_id"
- Certifique-se de que há pacientes migrados no sistema
- Execute o script de migração se necessário

### Erro: "duplicate key value violates unique constraint"
- Isso significa que está tentando inserir um paciente que já existe
- O código agora verifica se o paciente existe antes de criar
- Se ainda der erro, pode ser que o telefone já existe com outro formato

## 📝 Notas

- O n8n agora funciona mesmo com todas as políticas RLS ativas
- Os dados são automaticamente vinculados ao seu `user_id`
- Não é necessário desabilitar RLS ou criar políticas especiais

