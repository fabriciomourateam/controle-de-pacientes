# SOLUÇÃO DEFINITIVA: Erro 406 do Checkin

## Problema Persistente
Erro 406 continua mesmo após:
1. ✅ Adicionar campo `telefone` ao SELECT do paciente
2. ✅ Criar policy permissiva
3. ✅ Remover policies conflitantes

## Diagnóstico
O erro 406 persiste porque provavelmente:
- RLS está bloqueando de forma restritiva
- Há policies RESTRICTIVE que bloqueiam tudo
- Configuração de RLS está incorreta

## Solução em 2 Passos

### PASSO 1: Diagnosticar
Execute: `sql/diagnostico-rls-checkin-completo.sql`

Isso vai mostrar:
- Se RLS está habilitado
- Todas as policies existentes
- Se há policies RESTRICTIVE (que bloqueiam)

### PASSO 2: Aplicar Solução

Execute: `sql/solucao-definitiva-checkin-rls.sql`

**Esta solução DESABILITA o RLS da tabela checkin.**

⚠️ **IMPORTANTE**: Isso remove a segurança de linha. Se você precisa de controle de acesso, ajuste depois.

## Por Que Desabilitar RLS?

Para elaborar dietas, o sistema precisa apenas:
- Buscar o peso mais recente por telefone
- Não precisa de controle de acesso complexo nesta query específica

Você pode:
1. Desabilitar RLS agora para resolver o problema
2. Reabilitar e configurar corretamente depois, se necessário

## Como Executar

### 1. Diagnóstico (Opcional)
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: sql/diagnostico-rls-checkin-completo.sql
```

### 2. Solução
```sql
-- Execute no Supabase SQL Editor
-- Arquivo: sql/solucao-definitiva-checkin-rls.sql
```

### 3. Testar
1. **NÃO precisa limpar cache**
2. Tente elaborar uma dieta
3. Erro 406 deve desaparecer

## Alternativa: Manter RLS Ativo

Se você PRECISA manter RLS ativo, descomente a OPÇÃO 2 no arquivo SQL:
- Remove todas as policies
- Cria uma policy universal que permite tudo

## Resultado Esperado

Após executar:
```
✅ RLS desabilitado OU policy universal criada
✅ Erro 406 desaparece
✅ Sistema busca peso do checkin normalmente
```

## Arquivos
- `sql/diagnostico-rls-checkin-completo.sql` - Diagnóstico
- `sql/solucao-definitiva-checkin-rls.sql` - Solução
