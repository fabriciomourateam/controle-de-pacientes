# 🔑 Configurar Service Role Key - Cadastro Direto de Membros

## ⚠️ IMPORTANTE - Segurança

A **Service Role Key** tem acesso TOTAL ao banco de dados, ignorando todas as políticas RLS.
**NUNCA** exponha essa chave no frontend ou em repositórios públicos!

---

## 📝 Passo a Passo

### 1. Obter a Service Role Key

1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. Copie a **service_role** key (não a anon key!)

### 2. Adicionar no .env.local

Abra o arquivo `.env.local` e adicione:

```env
# Chaves existentes
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui

# NOVA: Service Role Key (NUNCA commitar!)
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 3. Adicionar no .gitignore

Verifique se `.env.local` está no `.gitignore`:

```
.env.local
.env*.local
```

---

## 🔒 Segurança - Alternativa Recomendada

### Opção 1: Edge Function (Mais Seguro) ⭐

Criar uma Edge Function no Supabase que usa a service_role internamente:

```typescript
// supabase/functions/create-team-member/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { email, password, name, role_id } = await req.json()

  // Criar usuário
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) return new Response(JSON.stringify({ error }), { status: 400 })

  // Criar membro
  await supabaseAdmin.from('team_members').insert({
    user_id: user.user.id,
    email,
    name,
    role_id,
  })

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

### Opção 2: Backend Próprio (Mais Controle)

Criar uma API Node.js/Express que gerencia os membros.

### Opção 3: Frontend com Service Role (Menos Seguro) ⚠️

Usar a service_role no frontend (apenas para desenvolvimento/testes).

---

## ✅ Qual Opção Escolher?

| Opção | Segurança | Complexidade | Recomendado |
|-------|-----------|--------------|-------------|
| Edge Function | ⭐⭐⭐⭐⭐ | Média | ✅ Produção |
| Backend Próprio | ⭐⭐⭐⭐ | Alta | ✅ Produção |
| Frontend | ⭐ | Baixa | ⚠️ Apenas Dev |

---

## 🚀 Implementação Rápida (Desenvolvimento)

Se você quer testar rapidamente, vou ajustar o código para usar a service_role do .env.

**Mas lembre-se:** Isso é apenas para desenvolvimento! Em produção, use Edge Function.

---

## 📌 Próximos Passos

1. **Escolha uma opção** acima
2. **Me avise** qual você prefere
3. **Eu implemento** a solução escolhida

**Qual opção você prefere?**
- A) Edge Function (mais seguro, recomendado)
- B) Frontend com service_role (rápido, apenas dev)
- C) Backend próprio (mais controle)
