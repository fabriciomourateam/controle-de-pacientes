-- ============================================
-- CORRIGIR ACESSO DOS MEMBROS DA EQUIPE
-- ============================================
-- Membros devem ver os dados do OWNER (nutricionista)
-- não seus próprios dados

-- ============================================
-- 1. PACIENTES - Membros veem pacientes do owner
-- ============================================

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
DROP POLICY IF EXISTS "Members can view owner patients" ON patients;

-- Owner vê seus próprios pacientes
CREATE POLICY "Owners can view own patients"
  ON patients
  FOR SELECT
  USING (auth.uid() = user_id);

-- Membros da equipe veem pacientes do owner
CREATE POLICY "Team members can view owner patients"
  ON patients
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ============================================
-- 2. CHECK-INS - Membros veem check-ins do owner
-- ============================================

DROP POLICY IF EXISTS "Users can view own checkins" ON checkin;
DROP POLICY IF EXISTS "Members can view owner checkins" ON checkin;

-- Owner vê seus próprios check-ins
CREATE POLICY "Owners can view own checkins"
  ON checkin
  FOR SELECT
  USING (auth.uid() = user_id);

-- Membros da equipe veem check-ins do owner
CREATE POLICY "Team members can view owner checkins"
  ON checkin
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ============================================
-- 3. PLANOS ALIMENTARES - Membros veem planos do owner
-- ============================================

DROP POLICY IF EXISTS "Users can view own plans" ON plans;
DROP POLICY IF EXISTS "Members can view owner plans" ON plans;

-- Owner vê seus próprios planos
CREATE POLICY "Owners can view own plans"
  ON plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Membros da equipe veem planos do owner
CREATE POLICY "Team members can view owner plans"
  ON plans
  FOR SELECT
  USING (
    user_id IN (
      SELECT owner_id 
      FROM team_members 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ============================================
-- VERIFICAR POLÍTICAS
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('patients', 'checkin', 'plans')
ORDER BY tablename, policyname;
