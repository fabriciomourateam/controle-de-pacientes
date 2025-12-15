-- ============================================
-- CORREÇÃO COMPLETA: ACESSO DE MEMBROS DA EQUIPE
-- ============================================
-- Este SQL corrige TODAS as políticas RLS necessárias

-- ============================================
-- 1. TEAM_MEMBERS (CRÍTICO!)
-- ============================================

DROP POLICY IF EXISTS "Owners podem ver seus membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem inserir membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem atualizar seus membros" ON team_members;
DROP POLICY IF EXISTS "Owners podem deletar seus membros" ON team_members;
DROP POLICY IF EXISTS "Membros podem ver suas informações" ON team_members;
DROP POLICY IF EXISTS "owners_and_members_can_view_team_members" ON team_members;
DROP POLICY IF EXISTS "only_owners_can_insert_team_members" ON team_members;
DROP POLICY IF EXISTS "only_owners_can_update_team_members" ON team_members;
DROP POLICY IF EXISTS "only_owners_can_delete_team_members" ON team_members;

-- SELECT: Owner vê seus membros OU membro vê seu próprio registro
CREATE POLICY "owners_and_members_can_view_team_members"
ON team_members FOR SELECT
USING (
  owner_id = auth.uid()  -- Owner vê seus membros
  OR
  user_id = auth.uid()   -- Membro vê seu próprio registro
);

-- INSERT: Apenas owner
CREATE POLICY "only_owners_can_insert_team_members"
ON team_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Apenas owner
CREATE POLICY "only_owners_can_update_team_members"
ON team_members FOR UPDATE
USING (owner_id = auth.uid());

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_team_members"
ON team_members FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- 2. PATIENTS
-- ============================================

DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_view_patients" ON patients;
DROP POLICY IF EXISTS "only_owners_can_insert_patients" ON patients;
DROP POLICY IF EXISTS "owners_and_team_can_update_patients" ON patients;
DROP POLICY IF EXISTS "only_owners_can_delete_patients" ON patients;

CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
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

CREATE POLICY "only_owners_can_insert_patients"
ON patients FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners_and_team_can_update_patients"
ON patients FOR UPDATE
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

CREATE POLICY "only_owners_can_delete_patients"
ON patients FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 3. CHECKIN
-- ============================================

DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can update their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_view_checkins" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_insert_checkins" ON checkin;
DROP POLICY IF EXISTS "owners_and_team_can_update_checkins" ON checkin;
DROP POLICY IF EXISTS "only_owners_can_delete_checkins" ON checkin;

CREATE POLICY "owners_and_team_can_view_checkins"
ON checkin FOR SELECT
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

CREATE POLICY "owners_and_team_can_insert_checkins"
ON checkin FOR INSERT
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

CREATE POLICY "owners_and_team_can_update_checkins"
ON checkin FOR UPDATE
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

CREATE POLICY "only_owners_can_delete_checkins"
ON checkin FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- 4. USER_SUBSCRIPTIONS
-- ============================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "owners_and_team_can_view_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "only_owners_can_insert_subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "only_owners_can_update_subscriptions" ON user_subscriptions;

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

CREATE POLICY "only_owners_can_insert_subscriptions"
ON user_subscriptions FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "only_owners_can_update_subscriptions"
ON user_subscriptions FOR UPDATE
USING (user_id = auth.uid());

-- ============================================
-- 5. DASHBOARD_DADOS
-- ============================================

DROP POLICY IF EXISTS "Users can view their own dashboard data" ON dashboard_dados;
DROP POLICY IF EXISTS "Users can insert their own dashboard data" ON dashboard_dados;
DROP POLICY IF EXISTS "Users can update their own dashboard data" ON dashboard_dados;
DROP POLICY IF EXISTS "owners_and_team_can_view_dashboard" ON dashboard_dados;
DROP POLICY IF EXISTS "owners_and_team_can_insert_dashboard" ON dashboard_dados;
DROP POLICY IF EXISTS "owners_and_team_can_update_dashboard" ON dashboard_dados;

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
-- 6. OUTRAS TABELAS COM USER_ID
-- ============================================

-- contact_history
DROP POLICY IF EXISTS "Users can view their own contacts" ON contact_history;
DROP POLICY IF EXISTS "owners_and_team_can_view_contacts" ON contact_history;
DROP POLICY IF EXISTS "owners_and_team_can_insert_contacts" ON contact_history;

CREATE POLICY "owners_and_team_can_view_contacts"
ON contact_history FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_insert_contacts"
ON contact_history FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

-- body_composition
DROP POLICY IF EXISTS "owners_and_team_can_view_body_composition" ON body_composition;
DROP POLICY IF EXISTS "owners_and_team_can_insert_body_composition" ON body_composition;
DROP POLICY IF EXISTS "owners_and_team_can_update_body_composition" ON body_composition;
DROP POLICY IF EXISTS "only_owners_can_delete_body_composition" ON body_composition;

CREATE POLICY "owners_and_team_can_view_body_composition"
ON body_composition FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_insert_body_composition"
ON body_composition FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_update_body_composition"
ON body_composition FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "only_owners_can_delete_body_composition"
ON body_composition FOR DELETE
USING (user_id = auth.uid());

-- weight_tracking
DROP POLICY IF EXISTS "owners_and_team_can_view_weight_tracking" ON weight_tracking;
DROP POLICY IF EXISTS "owners_and_team_can_insert_weight_tracking" ON weight_tracking;
DROP POLICY IF EXISTS "owners_and_team_can_update_weight_tracking" ON weight_tracking;
DROP POLICY IF EXISTS "only_owners_can_delete_weight_tracking" ON weight_tracking;

CREATE POLICY "owners_and_team_can_view_weight_tracking"
ON weight_tracking FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_insert_weight_tracking"
ON weight_tracking FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_update_weight_tracking"
ON weight_tracking FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "only_owners_can_delete_weight_tracking"
ON weight_tracking FOR DELETE
USING (user_id = auth.uid());

-- laboratory_exams
DROP POLICY IF EXISTS "owners_and_team_can_view_exams" ON laboratory_exams;
DROP POLICY IF EXISTS "owners_and_team_can_insert_exams" ON laboratory_exams;
DROP POLICY IF EXISTS "owners_and_team_can_update_exams" ON laboratory_exams;
DROP POLICY IF EXISTS "only_owners_can_delete_exams" ON laboratory_exams;

CREATE POLICY "owners_and_team_can_view_exams"
ON laboratory_exams FOR SELECT
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_insert_exams"
ON laboratory_exams FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_update_exams"
ON laboratory_exams FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  user_id IN (
    SELECT owner_id FROM team_members 
    WHERE team_members.user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "only_owners_can_delete_exams"
ON laboratory_exams FOR DELETE
USING (user_id = auth.uid());

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as políticas criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN (
  'team_members',
  'patients',
  'checkin',
  'user_subscriptions',
  'dashboard_dados',
  'contact_history',
  'body_composition',
  'weight_tracking',
  'laboratory_exams'
)
ORDER BY tablename, policyname;

-- Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE tablename IN (
  'team_members',
  'patients',
  'checkin',
  'user_subscriptions',
  'dashboard_dados'
)
GROUP BY tablename
ORDER BY tablename;
