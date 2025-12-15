-- ============================================
-- CORRIGIR RLS DE TODAS AS TABELAS PARA MEMBROS
-- ============================================

-- ============================================
-- TABELA: user_subscriptions
-- ============================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;

-- SELECT: Owner ou membro vê subscription do owner
CREATE POLICY "owners_and_team_can_view_subscriptions"
ON user_subscriptions FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Apenas owner
CREATE POLICY "only_owners_can_insert_subscriptions"
ON user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Apenas owner
CREATE POLICY "only_owners_can_update_subscriptions"
ON user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- TABELA: dashboard_dados
-- ============================================

DROP POLICY IF EXISTS "Users can view their own dashboard data" ON dashboard_dados;
DROP POLICY IF EXISTS "Users can insert their own dashboard data" ON dashboard_dados;
DROP POLICY IF EXISTS "Users can update their own dashboard data" ON dashboard_dados;

-- SELECT: Owner ou membro
CREATE POLICY "owners_and_team_can_view_dashboard"
ON dashboard_dados FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro
CREATE POLICY "owners_and_team_can_insert_dashboard"
ON dashboard_dados FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- UPDATE: Owner ou membro
CREATE POLICY "owners_and_team_can_update_dashboard"
ON dashboard_dados FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- ============================================
-- TABELA: contact_history
-- ============================================

DROP POLICY IF EXISTS "Users can view their own contacts" ON contact_history;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON contact_history;

-- SELECT: Owner ou membro
CREATE POLICY "owners_and_team_can_view_contacts"
ON contact_history FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro
CREATE POLICY "owners_and_team_can_insert_contacts"
ON contact_history FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- ============================================
-- TABELA: body_composition
-- ============================================

DROP POLICY IF EXISTS "Users can view their own body composition" ON body_composition;
DROP POLICY IF EXISTS "Users can insert their own body composition" ON body_composition;
DROP POLICY IF EXISTS "Users can update their own body composition" ON body_composition;

-- SELECT: Owner ou membro
CREATE POLICY "owners_and_team_can_view_body_composition"
ON body_composition FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro
CREATE POLICY "owners_and_team_can_insert_body_composition"
ON body_composition FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- UPDATE: Owner ou membro
CREATE POLICY "owners_and_team_can_update_body_composition"
ON body_composition FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_body_composition"
ON body_composition FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- TABELA: weight_tracking
-- ============================================

DROP POLICY IF EXISTS "Users can view their own weight tracking" ON weight_tracking;
DROP POLICY IF EXISTS "Users can insert their own weight tracking" ON weight_tracking;
DROP POLICY IF EXISTS "Users can update their own weight tracking" ON weight_tracking;

-- SELECT: Owner ou membro
CREATE POLICY "owners_and_team_can_view_weight_tracking"
ON weight_tracking FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro
CREATE POLICY "owners_and_team_can_insert_weight_tracking"
ON weight_tracking FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- UPDATE: Owner ou membro
CREATE POLICY "owners_and_team_can_update_weight_tracking"
ON weight_tracking FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_weight_tracking"
ON weight_tracking FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- TABELA: laboratory_exams
-- ============================================

DROP POLICY IF EXISTS "Users can view their own exams" ON laboratory_exams;
DROP POLICY IF EXISTS "Users can insert their own exams" ON laboratory_exams;
DROP POLICY IF EXISTS "Users can update their own exams" ON laboratory_exams;

-- SELECT: Owner ou membro
CREATE POLICY "owners_and_team_can_view_exams"
ON laboratory_exams FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Owner ou membro
CREATE POLICY "owners_and_team_can_insert_exams"
ON laboratory_exams FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- UPDATE: Owner ou membro
CREATE POLICY "owners_and_team_can_update_exams"
ON laboratory_exams FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE team_members.user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_exams"
ON laboratory_exams FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT 
  'Políticas RLS criadas com sucesso!' as status,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN (
  'user_subscriptions',
  'dashboard_dados',
  'contact_history',
  'body_composition',
  'weight_tracking',
  'laboratory_exams'
);
