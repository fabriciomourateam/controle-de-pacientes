-- ============================================================================
-- DIAGNÓSTICO: Quais políticas permitem o portal do paciente hoje?
-- ============================================================================
-- Execute no SQL Editor do Supabase ANTES de rodar o script de RLS.
-- Anote quais políticas existem em patients, checkin, body_composition.
-- Se existir "portal" no nome, o script de RLS NÃO as remove.
-- Se o portal funcionar por "Enable read access for all", o RLS vai remover
-- essa política e o portal deixará de ver dados até criarmos políticas do portal.
-- ============================================================================

SELECT tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'checkin', 'body_composition', 'diet_plans', 'diet_meals', 'diet_foods', 'patient_portal_tokens')
ORDER BY tablename, policyname;
