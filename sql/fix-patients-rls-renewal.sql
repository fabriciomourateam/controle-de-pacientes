-- Verificar e corrigir RLS para tabela patients (página de renovação)

-- Verificar se a tabela patients existe e tem RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'patients';

-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';

-- Habilitar RLS se não estiver habilitado
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - permitir acesso aos próprios pacientes e membros da equipe
DROP POLICY IF EXISTS "Users can view their own patients and team patients" ON patients;
CREATE POLICY "Users can view their own patients and team patients" ON patients
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.owner_id = patients.user_id 
    AND tm.is_active = true
  )
);

-- Política para INSERT - permitir inserir próprios pacientes
DROP POLICY IF EXISTS "Users can insert their own patients" ON patients;
CREATE POLICY "Users can insert their own patients" ON patients
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE - permitir atualizar próprios pacientes e de membros da equipe
DROP POLICY IF EXISTS "Users can update their own patients and team patients" ON patients;
CREATE POLICY "Users can update their own patients and team patients" ON patients
FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.user_id = auth.uid() 
    AND tm.owner_id = patients.user_id 
    AND tm.is_active = true
  )
);

-- Política para DELETE - permitir deletar próprios pacientes
DROP POLICY IF EXISTS "Users can delete their own patients" ON patients;
CREATE POLICY "Users can delete their own patients" ON patients
FOR DELETE USING (auth.uid() = user_id);

-- Verificar se as políticas foram criadas
SELECT 'Políticas RLS para patients configuradas com sucesso!' as resultado;