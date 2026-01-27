# EXECUTAR AGORA: Corrigir Erro 406 do Checkin

## ⚠️ SITUAÇÃO ATUAL
Erro 406 persiste mesmo após executar o SQL de correção de RLS.

## 🔍 PRÓXIMOS PASSOS

### PASSO 1: Verificar se o SQL foi executado corretamente

Execute no Supabase SQL Editor:

```sql
-- Verificar se RLS está ativo
SELECT tablename, rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'checkin';

-- Verificar policies existentes
SELECT policyname as "Nome da Policy", cmd as "Comando"
FROM pg_policies 
WHERE tablename = 'checkin';
```

**Resultado esperado:**
- RLS Ativo: `true`
- Deve ter apenas 1 policy: `allow_all_authenticated` com comando `ALL`

---

### PASSO 2: Se não tiver a policy correta, execute novamente

```sql
-- Remover TODAS as policies existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'checkin')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON checkin';
    END LOOP;
END $$;

-- Criar UMA policy universal
CREATE POLICY "allow_all_authenticated"
ON checkin
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

---

### PASSO 3: Limpar cache do navegador

**IMPORTANTE**: Mudanças no banco NÃO requerem limpar cache, mas faça por precaução:

1. Pressione `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. Ou abra DevTools (F12) → Aba "Application" → "Clear storage" → "Clear site data"

---

### PASSO 4: Testar

1. Abra a página de elaborar dieta
2. Selecione um paciente que tenha telefone cadastrado
3. Abra o console do navegador (F12)
4. Veja se o erro 406 desaparece

---

## 🔧 SE O ERRO PERSISTIR

### Opção A: Desabilitar RLS completamente (temporário)

```sql
-- Desabilitar RLS da tabela checkin
ALTER TABLE checkin DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE tablename = 'checkin';
```

**Resultado esperado:** RLS Ativo = `false`

---

### Opção B: Verificar se o usuário está autenticado

Execute no console do navegador (F12):

```javascript
// Verificar se há usuário autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('Usuário autenticado:', user);
```

Se retornar `null`, o problema é de autenticação, não de RLS.

---

## 📊 DIAGNÓSTICO COMPLETO

Se nada funcionar, execute este SQL para diagnóstico completo:

```sql
-- 1. Verificar estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'checkin' 
ORDER BY ordinal_position;

-- 2. Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'checkin';

-- 3. Verificar todas as policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'checkin';

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_checkins FROM checkin;

-- 5. Testar query diretamente
SELECT peso, telefone, data_checkin
FROM checkin
WHERE telefone = '5516993001632'
AND peso IS NOT NULL
ORDER BY data_checkin DESC
LIMIT 5;
```

---

## ✅ RESULTADO ESPERADO

Após executar os passos acima:

1. ✅ RLS ativo com policy `allow_all_authenticated`
2. ✅ Erro 406 desaparece
3. ✅ Sistema busca peso do checkin normalmente
4. ✅ Peso mais recente é carregado ao elaborar dieta

---

## 📝 COPIE E COLE OS RESULTADOS

Após executar, copie e cole aqui os resultados de:

1. **Verificação de RLS e policies** (PASSO 1)
2. **Erro no console** (se ainda aparecer)
3. **Resultado do diagnóstico completo** (se necessário)

Isso vai me ajudar a identificar exatamente o que está acontecendo.
