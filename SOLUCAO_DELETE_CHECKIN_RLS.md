# Solução: Problema de DELETE em Checkin (RLS)

## Problema Identificado

**Sintoma**: Ao tentar excluir checkin da timeline, o registro não é deletado e continua aparecendo.

**Causa Raiz**: Row Level Security (RLS) está bloqueando a operação DELETE.

### Evidência dos Logs
```
🗑️ checkinService.delete - Resposta do Supabase: {data: Array(0), error: null}
⚠️ checkinService.delete - Nenhum registro foi deletado. Possível problema de RLS ou ID inválido.
```

**Análise**:
- `error: null` = Não houve erro de sintaxe ou conexão
- `data: Array(0)` = Nenhum registro foi afetado
- Isso indica que o RLS bloqueou silenciosamente a operação

## Como o RLS Funciona

O Supabase usa Row Level Security (RLS) para controlar acesso aos dados. Quando você tenta fazer um DELETE:

1. **Supabase executa a query**: `DELETE FROM checkin WHERE id = 'xxx'`
2. **RLS aplica filtros adicionais**: Verifica se você tem permissão
3. **Se não tiver permissão**: Retorna array vazio (sem erro)
4. **Resultado**: Parece que funcionou, mas nada foi deletado

## Solução

### Passo 1: Diagnosticar o Problema

Execute o SQL de diagnóstico no Supabase SQL Editor:

```bash
# Arquivo: sql/diagnosticar-delete-checkin.sql
```

Isso vai mostrar:
- ✅ Políticas RLS existentes
- ✅ Se RLS está habilitado
- ✅ Se o checkin existe
- ✅ Seu user_id atual
- ✅ Políticas de DELETE

### Passo 2: Corrigir as Políticas RLS

Execute o SQL de correção no Supabase SQL Editor:

```bash
# Arquivo: sql/fix-checkin-delete-rls.sql
```

Isso vai:
1. ✅ Remover políticas antigas de DELETE
2. ✅ Criar nova política `checkin_delete_policy`
3. ✅ Permitir DELETE se você é o dono OU membro da equipe
4. ✅ Verificar se a política foi criada

### Passo 3: Testar a Exclusão

1. Volte para a página de evolução do paciente
2. Tente excluir um checkin novamente
3. **Observe os logs no console**:
   ```
   🗑️ checkinService.delete - Resposta do Supabase: {data: Array(1), error: null}
   ✅ Check-in deletado com sucesso no banco
   ```
4. O checkin deve desaparecer da timeline

## Política RLS Criada

```sql
CREATE POLICY "checkin_delete_policy" ON checkin
  FOR DELETE
  USING (
    -- Você é o dono do checkin
    user_id = auth.uid()
    OR
    -- Você é membro da equipe do dono do checkin
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.owner_id = checkin.user_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
  );
```

**Explicação**:
- `user_id = auth.uid()` - Você pode deletar seus próprios checkins
- `EXISTS (SELECT 1 FROM team_members...)` - Membros da equipe podem deletar checkins do owner

## Verificação Final

Após executar o SQL de correção, execute este teste:

```sql
-- Ver a política criada
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'checkin' AND cmd = 'DELETE';

-- Deve retornar:
-- policyname: checkin_delete_policy
-- cmd: DELETE
-- qual: (user_id = auth.uid()) OR EXISTS (...)
```

## Troubleshooting

### Problema: Ainda não deleta após executar o SQL

**Causa**: Pode haver múltiplas políticas conflitantes

**Solução**:
```sql
-- Ver TODAS as políticas de DELETE
SELECT * FROM pg_policies 
WHERE tablename = 'checkin' AND cmd = 'DELETE';

-- Se houver mais de uma, remova todas e recrie:
DROP POLICY IF EXISTS "nome_da_politica_1" ON checkin;
DROP POLICY IF EXISTS "nome_da_politica_2" ON checkin;

-- Depois execute novamente o fix-checkin-delete-rls.sql
```

### Problema: Erro "permission denied for table checkin"

**Causa**: RLS está muito restritivo

**Solução**: Verifique se você está logado com o usuário correto:
```sql
SELECT auth.uid(); -- Deve retornar seu user_id
SELECT * FROM checkin WHERE user_id = auth.uid(); -- Deve mostrar seus checkins
```

## Arquivos Relacionados

- `sql/diagnosticar-delete-checkin.sql` - Diagnóstico completo
- `sql/fix-checkin-delete-rls.sql` - Correção das políticas RLS
- `src/components/evolution/Timeline.tsx` - Componente com logs de debug
- `src/lib/checkin-service.ts` - Serviço com logs de debug
- `DEBUG_EXCLUSAO_CHECKIN.md` - Documentação do debug

## Resumo

1. ✅ **Problema identificado**: RLS bloqueando DELETE
2. ✅ **Logs adicionados**: Para debug futuro
3. ✅ **SQL de diagnóstico**: Para verificar políticas
4. ✅ **SQL de correção**: Para permitir DELETE
5. ⏳ **Próximo passo**: Executar SQL no Supabase

## Data
27/01/2025
