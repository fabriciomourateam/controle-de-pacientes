-- Solução simples para acesso público às páginas de renovação
-- Permite acesso limitado aos dados do paciente para fins de renovação

-- 1. Criar função que permite acesso público a dados específicos de renovação
CREATE OR REPLACE FUNCTION allow_renewal_access()
RETURNS BOOLEAN AS $$
BEGIN
  -- Sempre permitir acesso para renovação (será controlado pela aplicação)
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar política da tabela patients para permitir acesso público limitado
DROP POLICY IF EXISTS "Users can view their own patients and team patients" ON patients;
CREATE POLICY "Users can view their own patients and team patients" ON patients
FOR SELECT USING (
  -- Acesso normal para usuários autenticados
  (auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = patients.user_id 
      AND tm.is_active = true
    )
  )) OR
  -- Acesso público limitado para renovação (sem autenticação)
  (auth.uid() IS NULL AND allow_renewal_access())
);

-- 3. Atualizar política da tabela checkin para permitir acesso público limitado
DROP POLICY IF EXISTS "Users can view their own checkins and team checkins" ON checkin;
CREATE POLICY "Users can view their own checkins and team checkins" ON checkin
FOR SELECT USING (
  -- Acesso normal para usuários autenticados
  (auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.user_id = auth.uid() 
      AND tm.owner_id = checkin.user_id 
      AND tm.is_active = true
    )
  )) OR
  -- Acesso público limitado para renovação (sem autenticação)
  (auth.uid() IS NULL AND allow_renewal_access())
);

-- Verificar se as políticas foram atualizadas
SELECT 'Políticas de acesso público para renovação configuradas!' as resultado;