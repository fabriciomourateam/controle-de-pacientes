# ⚠️ EXECUTAR AGORA: Corrigir DELETE de Checkin

## Problema
Checkins não estão sendo deletados da timeline. RLS está bloqueando a operação.

## Solução Rápida

### 1️⃣ Abra o Supabase SQL Editor
https://supabase.com/dashboard/project/[SEU_PROJECT]/sql

### 2️⃣ Execute este SQL:

```sql
-- Remover políticas antigas de DELETE
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON checkin;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON checkin;
DROP POLICY IF EXISTS "checkin_delete_policy" ON checkin;

-- Criar nova política de DELETE (versão simples)
CREATE POLICY "checkin_delete_policy" ON checkin
  FOR DELETE
  USING (
    user_id = auth.uid()
  );
```

**Nota**: Esta versão permite deletar apenas seus próprios checkins. Se precisar que membros da equipe também possam deletar, use o arquivo `sql/fix-checkin-delete-rls.sql` (versão completa).

### 3️⃣ Teste a Exclusão
1. Volte para a página de evolução
2. Clique no botão de lixeira (🗑️) em um checkin
3. Confirme a exclusão
4. O checkin deve desaparecer

### 4️⃣ Verifique os Logs
No console do navegador, deve aparecer:
```
🗑️ checkinService.delete - Resposta do Supabase: {data: Array(1), error: null}
✅ Check-in deletado com sucesso no banco
```

## Explicação Rápida

**Antes**: `{data: Array(0), error: null}` - RLS bloqueou
**Depois**: `{data: Array(1), error: null}` - Deletado com sucesso

## Arquivos Criados
- ✅ `sql/diagnosticar-delete-checkin.sql` - Diagnóstico completo
- ✅ `sql/fix-checkin-delete-rls.sql` - Correção das políticas
- ✅ `SOLUCAO_DELETE_CHECKIN_RLS.md` - Documentação completa
- ✅ Logs de debug adicionados em Timeline.tsx e checkin-service.ts

## Data
27/01/2025
