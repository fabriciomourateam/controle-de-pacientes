-- Verificar e corrigir RLS da tabela contact_history
-- Execute no Supabase SQL Editor

-- 1. Ver policies atuais
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'contact_history';

-- 2. Verificar se RLS está habilitado
SELECT relrowsecurity FROM pg_class WHERE relname = 'contact_history';

-- 3. Remover policies antigas
DROP POLICY IF EXISTS "contact_history_select" ON contact_history;
DROP POLICY IF EXISTS "contact_history_insert" ON contact_history;
DROP POLICY IF EXISTS "contact_history_update" ON contact_history;
DROP POLICY IF EXISTS "contact_history_delete" ON contact_history;
DROP POLICY IF EXISTS "Users can view own contact history" ON contact_history;
DROP POLICY IF EXISTS "Users can insert own contact history" ON contact_history;

-- 4. Criar policies que permitem ver contatos da equipe
-- SELECT: Pode ver contatos próprios OU de membros da mesma equipe
CREATE POLICY "contact_history_select" ON contact_history
FOR SELECT USING (
  user_id = auth.uid() 
  OR user_id IN (
    SELECT tm.user_id FROM team_members tm 
    WHERE tm.owner_id = auth.uid() AND tm.user_id IS NOT NULL
  )
  OR user_id IN (
    SELECT tm.owner_id FROM team_members tm 
    WHERE tm.user_id = auth.uid()
  )
);

-- INSERT: Apenas próprio usuário pode inserir
CREATE POLICY "contact_history_insert" ON contact_history
FOR INSERT WITH CHECK (user_id = auth.uid());

-- UPDATE: Apenas próprio usuário pode atualizar
CREATE POLICY "contact_history_update" ON contact_history
FOR UPDATE USING (user_id = auth.uid());

-- DELETE: Apenas próprio usuário pode deletar
CREATE POLICY "contact_history_delete" ON contact_history
FOR DELETE USING (user_id = auth.uid());

-- 5. Garantir RLS habilitado
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- 6. Testar - deve retornar contatos de hoje de toda a equipe
SELECT * FROM contact_history 
WHERE contact_date >= CURRENT_DATE
ORDER BY contact_date DESC;
