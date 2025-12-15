-- ============================================================================
-- CORRIGIR TABELAS FALTANTES - RLS
-- ============================================================================
-- Adiciona políticas RLS para tabelas que estavam faltando
-- ============================================================================

-- USER_PREFERENCES
DROP POLICY IF EXISTS "user_preferences_all" ON user_preferences;

CREATE POLICY "user_preferences_all" ON user_preferences FOR ALL
  USING (
    user_id = auth.uid()::text OR
    user_id IN (
      SELECT 'user_' || id::text 
      FROM team_members 
      WHERE owner_id = auth.uid() AND is_active = true
    )
  );

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES
DROP POLICY IF EXISTS "user_profiles_all" ON user_profiles;

CREATE POLICY "user_profiles_all" ON user_profiles FOR ALL
  USING (
    id = auth.uid() OR
    id IN (SELECT user_id FROM team_members WHERE owner_id = auth.uid()) OR
    id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid())
  );

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- USER_SUBSCRIPTIONS
DROP POLICY IF EXISTS "user_subscriptions_all" ON user_subscriptions;

CREATE POLICY "user_subscriptions_all" ON user_subscriptions FOR ALL
  USING (
    user_id = auth.uid() OR
    user_id IN (SELECT owner_id FROM team_members WHERE user_id = auth.uid())
  );

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM
-- ============================================================================
