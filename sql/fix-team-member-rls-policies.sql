-- ============================================
-- CORRIGIR POLÍTICAS RLS PARA MEMBROS DA EQUIPE
-- ============================================
-- Este script atualiza as políticas RLS para permitir que:
-- 1. Owners vejam seus próprios dados
-- 2. Membros da equipe vejam os dados do owner que os adicionou
-- 3. Ninguém veja dados de outros owners

-- ============================================
-- TABELA: patients
-- ============================================

-- Remover política antiga
DROP POLICY IF EXISTS "Users can only see their own patients" ON patients;
DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
DROP POLICY IF EXISTS "Users can update their own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;

-- SELECT: Owner ou membro da equipe do owner
CREATE POLICY "owners_and_team_can_view_patients"
ON patients FOR SELECT
USING (
  owner_id = auth.uid()
  OR
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- INSERT: Apenas owner
CREATE POLICY "only_owners_can_insert_patients"
ON patients FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Owner ou membro com permissão de edit
CREATE POLICY "owners_and_team_can_update_patients"
ON patients FOR UPDATE
USING (
  owner_id = auth.uid()
  OR
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- DELETE: Apenas owner
CREATE POLICY "only_owners_can_delete_patients"
ON patients FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- TABELA: checkin
-- ============================================

DROP POLICY IF EXISTS "Users can only see their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can insert their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can update their own checkins" ON checkin;
DROP POLICY IF EXISTS "Users can delete their own checkins" ON checkin;

CREATE POLICY "owners_and_team_can_view_checkins"
ON checkin FOR SELECT
USING (
  owner_id = auth.uid()
  OR
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_insert_checkins"
ON checkin FOR INSERT
WITH CHECK (
  owner_id = auth.uid()
  OR
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "owners_and_team_can_update_checkins"
ON checkin FOR UPDATE
USING (
  owner_id = auth.uid()
  OR
  owner_id IN (
    SELECT owner_id 
    FROM team_members 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "only_owners_can_delete_checkins"
ON checkin FOR DELETE
USING (owner_id = auth.uid());

-- ============================================
-- TABELA: diet_plans (se existir)
-- ============================================

-- Verificar se a tabela existe antes de criar políticas
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'diet_plans') THEN
    
    DROP POLICY IF EXISTS "Users can only see their own diet plans" ON diet_plans;
    DROP POLICY IF EXISTS "Users can insert their own diet plans" ON diet_plans;
    DROP POLICY IF EXISTS "Users can update their own diet plans" ON diet_plans;
    DROP POLICY IF EXISTS "Users can delete their own diet plans" ON diet_plans;

    EXECUTE 'CREATE POLICY "owners_and_team_can_view_diet_plans"
    ON diet_plans FOR SELECT
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_insert_diet_plans"
    ON diet_plans FOR INSERT
    WITH CHECK (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_update_diet_plans"
    ON diet_plans FOR UPDATE
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "only_owners_can_delete_diet_plans"
    ON diet_plans FOR DELETE
    USING (owner_id = auth.uid())';

  END IF;
END $$;

-- ============================================
-- TABELA: body_composition (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'body_composition') THEN
    
    DROP POLICY IF EXISTS "Users can only see their own body composition" ON body_composition;
    DROP POLICY IF EXISTS "Users can insert their own body composition" ON body_composition;
    DROP POLICY IF EXISTS "Users can update their own body composition" ON body_composition;
    DROP POLICY IF EXISTS "Users can delete their own body composition" ON body_composition;

    EXECUTE 'CREATE POLICY "owners_and_team_can_view_body_composition"
    ON body_composition FOR SELECT
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_insert_body_composition"
    ON body_composition FOR INSERT
    WITH CHECK (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_update_body_composition"
    ON body_composition FOR UPDATE
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "only_owners_can_delete_body_composition"
    ON body_composition FOR DELETE
    USING (owner_id = auth.uid())';

  END IF;
END $$;

-- ============================================
-- TABELA: daily_weights (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_weights') THEN
    
    DROP POLICY IF EXISTS "Users can only see their own daily weights" ON daily_weights;
    DROP POLICY IF EXISTS "Users can insert their own daily weights" ON daily_weights;
    DROP POLICY IF EXISTS "Users can update their own daily weights" ON daily_weights;
    DROP POLICY IF EXISTS "Users can delete their own daily weights" ON daily_weights;

    EXECUTE 'CREATE POLICY "owners_and_team_can_view_daily_weights"
    ON daily_weights FOR SELECT
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_insert_daily_weights"
    ON daily_weights FOR INSERT
    WITH CHECK (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_update_daily_weights"
    ON daily_weights FOR UPDATE
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "only_owners_can_delete_daily_weights"
    ON daily_weights FOR DELETE
    USING (owner_id = auth.uid())';

  END IF;
END $$;

-- ============================================
-- TABELA: exams (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'exams') THEN
    
    DROP POLICY IF EXISTS "Users can only see their own exams" ON exams;
    DROP POLICY IF EXISTS "Users can insert their own exams" ON exams;
    DROP POLICY IF EXISTS "Users can update their own exams" ON exams;
    DROP POLICY IF EXISTS "Users can delete their own exams" ON exams;

    EXECUTE 'CREATE POLICY "owners_and_team_can_view_exams"
    ON exams FOR SELECT
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_insert_exams"
    ON exams FOR INSERT
    WITH CHECK (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "owners_and_team_can_update_exams"
    ON exams FOR UPDATE
    USING (
      owner_id = auth.uid()
      OR
      owner_id IN (
        SELECT owner_id 
        FROM team_members 
        WHERE user_id = auth.uid() 
        AND is_active = true
      )
    )';

    EXECUTE 'CREATE POLICY "only_owners_can_delete_exams"
    ON exams FOR DELETE
    USING (owner_id = auth.uid())';

  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('patients', 'checkin', 'diet_plans', 'body_composition', 'daily_weights', 'exams')
ORDER BY tablename, policyname;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

/*
1. Execute este script no SQL Editor do Supabase
2. Verifique se não há erros
3. Teste o acesso:
   - Faça login como owner
   - Adicione um membro da equipe
   - Faça login como o membro
   - Verifique se ele vê os dados do owner
4. Confirme que membros não veem dados de outros owners
*/
