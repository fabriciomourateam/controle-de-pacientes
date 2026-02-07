-- ============================================================================
-- DIAGNÓSTICO: RLS e acesso do app dos alunos (role anon)
-- ============================================================================
-- Execute no SQL Editor do Supabase. Mostra quais tabelas o portal usa,
-- se têm RLS ativo e se existe política que permite anon SELECT.
-- ============================================================================

-- 1) Função get_phones_with_active_portal_tokens existe e anon pode executar?
SELECT
  n.nspname AS schema_name,
  p.proname AS function_name,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'get_phones_with_active_portal_tokens';

-- 2) Tabelas que o portal usa: RLS ativo e políticas para anon
SELECT
  t.schemaname,
  t.tablename,
  t.rowsecurity AS rls_ativo,
  (
    SELECT COUNT(*)
    FROM pg_policies pol
    WHERE pol.schemaname = t.schemaname
      AND pol.tablename = t.tablename
      AND pol.roles::text LIKE '%anon%'
      AND pol.cmd = 'SELECT'
  ) AS politicas_anon_select
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'patients',
    'checkin',
    'body_composition',
    'diet_plans',
    'diet_meals',
    'diet_foods',
    'diet_guidelines',
    'laboratory_exams',
    'weight_tracking',
    'featured_photo_comparison',
    'patient_portal_tokens',
    'food_database'
  )
ORDER BY t.tablename;

-- 3) Listar todas as políticas que mencionam "portal" ou anon (para conferência)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles::text
FROM pg_policies
WHERE schemaname = 'public'
  AND (policyname ILIKE '%portal%' OR roles::text LIKE '%anon%')
ORDER BY tablename, policyname;
