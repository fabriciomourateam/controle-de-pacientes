# Correções Finais - Gestão de Equipe

## Status Atual

✅ **Funcionando:**
- RLS básico está ativo
- Algumas páginas estão acessíveis

❌ **Problemas:**
1. Pacientes não aparecem para membros da equipe
2. Páginas que não deveriam aparecer estão visíveis (Planos, Métricas Comerciais, Relatórios)
3. Erros 406 em `user_profiles` e `user_subscriptions`

## Correção 1: Adicionar Políticas para Tabelas Faltantes

Precisamos adicionar políticas para:
- `user_preferences`
- `user_profiles` 
- `user_subscriptions`

Execute o SQL: `sql/fix-missing-tables-rls.sql`

## Correção 2: Verificar Dados de Pacientes

O problema pode ser que:
1. Os pacientes não têm `user_id` do owner
2. A função `is_team_member` não está funcionando

Execute o SQL de diagnóstico: `sql/diagnosticar-pacientes-membro.sql`

## Correção 3: Controle de Permissões no Frontend

As páginas estão aparecendo porque o controle de permissões não está sendo verificado.

Arquivos que precisam ser corrigidos:
- `src/components/dashboard/AppSidebar.tsx` - Verificar permissões antes de mostrar itens do menu
- `src/App.tsx` ou rotas - Bloquear acesso às rotas protegidas

## Próximos Passos

1. Execute `sql/fix-missing-tables-rls.sql`
2. Execute `sql/diagnosticar-pacientes-membro.sql` e me mostre o resultado
3. Vamos corrigir o controle de permissões no frontend
