# 🔍 Diagnóstico - Membro Não Vê Dados do Owner

## Possíveis Causas:

### 1. ❌ Membro não está registrado corretamente
**Verificar:**
```sql
SELECT * FROM team_members WHERE user_id = auth.uid();
```

**Deve retornar:**
- owner_id = UUID do nutricionista
- user_id = UUID do membro
- is_active = true

**Se não retornar nada:** O membro não foi criado corretamente

---

### 2. ❌ Políticas RLS não foram criadas
**Verificar:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'patients';
```

**Deve ter:**
- "Owners can view own patients"
- "Team members can view owner patients"

**Se não tiver:** Execute `sql/fix-member-access.sql`

---

### 3. ❌ Tabela patients não tem coluna user_id
**Verificar:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'user_id';
```

**Se não retornar nada:** A tabela usa outro nome de coluna

---

### 4. ❌ Owner não tem pacientes
**Verificar:**
```sql
SELECT COUNT(*) FROM patients 
WHERE user_id = 'UUID_DO_OWNER';
```

**Se retornar 0:** O owner não tem pacientes cadastrados

---

### 5. ❌ RLS está desabilitado
**Verificar:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';
```

**rowsecurity deve ser:** true

**Se for false:**
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

---

## 🔧 Solução Rápida - Desabilitar RLS Temporariamente

**APENAS PARA TESTE:**

```sql
-- Desabilitar RLS
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE checkin DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
```

**Teste se o membro vê os dados agora.**

**Se funcionar:** O problema é nas políticas RLS
**Se não funcionar:** O problema é no código/queries

**IMPORTANTE:** Reabilite depois:
```sql
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Execute o Diagnóstico

1. Faça login como **membro**
2. Execute `sql/diagnostico-membro.sql`
3. Me envie os resultados
4. Vou identificar o problema exato

---

## 🎯 Checklist

- [ ] Membro está em team_members com owner_id correto
- [ ] Políticas RLS existem para patients, checkin, plans
- [ ] RLS está habilitado nas tabelas
- [ ] Owner tem dados cadastrados
- [ ] Coluna user_id existe nas tabelas
- [ ] Membro está ativo (is_active = true)
