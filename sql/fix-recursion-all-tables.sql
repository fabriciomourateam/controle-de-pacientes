-- ============================================================================
-- CORRIGIR RECURSÃO INFINITA - TODAS AS TABELAS
-- ============================================================================
-- Remove políticas que causam recursão e cria políticas simples
-- ============================================================================

-- TEAM_MEMBERS - SEM RECURSÃO
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "team_members_all" ON team_members;

CREATE POLICY "team_members_select_simple" ON team_members FOR SELECT
  USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "team_members_insert_simple" ON team_members FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "team_members_update_simple" ON team_members FOR UPDATE
  USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "team_members_delete_simple" ON team_members FOR DELETE
  USING (owner_id = auth.uid());

-- PROFILES - SEM RECURSÃO
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_all" ON profiles;

CREATE POLICY "profiles_select_simple" ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert_simple" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_simple" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "profiles_delete_simple" ON profiles FOR DELETE
  USING (id = auth.uid());

-- USER_PREFERENCES - SEM RECURSÃO
DROP POLICY IF EXISTS "user_preferences_all" ON user_preferences;

CREATE POLICY "user_preferences_simple" ON user_preferences FOR ALL
  USING (user_id = auth.uid()::text);

-- USER_PROFILES - SEM RECURSÃO
DROP POLICY IF EXISTS "user_profiles_all" ON user_profiles;

CREATE POLICY "user_profiles_simple" ON user_profiles FOR ALL
  USING (id = auth.uid());

-- USER_SUBSCRIPTIONS - SEM RECURSÃO
DROP POLICY IF EXISTS "user_subscriptions_all" ON user_subscriptions;

CREATE POLICY "user_subscriptions_simple" ON user_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- TEAM_ROLES - Todos podem ver (são templates)
DROP POLICY IF EXISTS "team_roles_select_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_insert_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_update_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_delete_policy" ON team_roles;
DROP POLICY IF EXISTS "team_roles_all" ON team_roles;

CREATE POLICY "team_roles_all_simple" ON team_roles FOR ALL
  USING (true);

-- Habilitar RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM - Recursão corrigida
-- ============================================================================
