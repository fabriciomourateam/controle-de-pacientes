-- CORREÇÃO: Atualizar user_id dos planos alimentares para que apareçam na interface
-- Execute este SQL no Supabase SQL Editor

-- OPÇÃO 1: Atualizar planos para usar o user_id do paciente (se o paciente tiver user_id)
UPDATE diet_plans dp
SET user_id = p.user_id
FROM patients p
WHERE dp.patient_id = p.id
  AND p.user_id IS NOT NULL
  AND (dp.user_id IS NULL OR dp.user_id != p.user_id);

-- OPÇÃO 2: Se você quer que os planos apareçam para um usuário específico
-- Substitua 'SEU_USER_ID_AQUI' pelo seu user_id (execute SELECT auth.uid() para descobrir)
-- UPDATE diet_plans
-- SET user_id = 'SEU_USER_ID_AQUI'
-- WHERE user_id IS NULL;

-- OPÇÃO 3: Criar/atualizar política RLS para permitir ver planos dos seus pacientes
-- Isso é mais correto pois permite que você veja planos de pacientes que você criou

-- Primeiro, dropar políticas existentes
DROP POLICY IF EXISTS "Users can view own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can view diet plans of their patients" ON diet_plans;
DROP POLICY IF EXISTS "Users can insert own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can update own diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Users can delete own diet plans" ON diet_plans;

-- Criar política que permite ver planos dos seus pacientes
CREATE POLICY "Users can view diet plans of their patients"
ON diet_plans FOR SELECT
USING (
  -- Pode ver se é dono do plano
  user_id = auth.uid()
  OR
  -- Pode ver se é dono do paciente
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
  OR
  -- Pode ver se é membro da equipe do dono do paciente
  patient_id IN (
    SELECT p.id FROM patients p
    JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE tm.user_id = auth.uid() AND tm.status = 'active'
  )
);

-- Política para inserir
CREATE POLICY "Users can insert diet plans for their patients"
ON diet_plans FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

-- Política para atualizar
CREATE POLICY "Users can update diet plans of their patients"
ON diet_plans FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

-- Política para deletar
CREATE POLICY "Users can delete diet plans of their patients"
ON diet_plans FOR DELETE
USING (
  user_id = auth.uid()
  OR
  patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  )
);

-- Verificar se as políticas foram criadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'diet_plans';
