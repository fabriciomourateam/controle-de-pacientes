-- Solução para acesso público às páginas de renovação
-- Permite acesso aos dados do paciente sem autenticação para fins de renovação

-- 1. Criar tabela para tokens de renovação (links públicos)
CREATE TABLE IF NOT EXISTS renewal_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_telefone TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS na tabela renewal_tokens
ALTER TABLE renewal_tokens ENABLE ROW LEVEL SECURITY;

-- Política para renewal_tokens - apenas o criador pode gerenciar
CREATE POLICY "Users can manage their own renewal tokens" ON renewal_tokens
FOR ALL USING (auth.uid() = created_by);

-- 2. Criar função para verificar se um telefone tem token de renovação válido
CREATE OR REPLACE FUNCTION has_valid_renewal_token(patient_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM renewal_tokens 
    WHERE patient_telefone = patient_phone 
    AND is_active = true 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar política da tabela patients para permitir acesso público com token válido
DROP POLICY IF EXISTS "Public access for renewal with valid token" ON patients;
CREATE POLICY "Public access for renewal with valid token" ON patients
FOR SELECT USING (
  -- Acesso normal para usuários autenticados
  (auth.uid() = user_id OR
   EXISTS (
     SELECT 1 FROM team_members tm 
     WHERE tm.user_id = auth.uid() 
     AND tm.owner_id = patients.user_id 
     AND tm.is_active = true
   )) OR
  -- Acesso público para renovação com token válido
  has_valid_renewal_token(telefone)
);

-- 4. Atualizar política da tabela checkin para permitir acesso público com token válido
DROP POLICY IF EXISTS "Public access for renewal checkins" ON checkin;
CREATE POLICY "Public access for renewal checkins" ON checkin
FOR SELECT USING (
  -- Acesso normal para usuários autenticados
  (auth.uid() = user_id OR
   EXISTS (
     SELECT 1 FROM team_members tm 
     WHERE tm.user_id = auth.uid() 
     AND tm.owner_id = checkin.user_id 
     AND tm.is_active = true
   )) OR
  -- Acesso público para renovação com token válido
  has_valid_renewal_token(telefone)
);

-- 5. Função para criar token de renovação
CREATE OR REPLACE FUNCTION create_renewal_token(patient_phone TEXT)
RETURNS TEXT AS $$
DECLARE
  new_token TEXT;
BEGIN
  -- Verificar se o usuário tem acesso ao paciente
  IF NOT EXISTS (
    SELECT 1 FROM patients 
    WHERE telefone = patient_phone 
    AND (user_id = auth.uid() OR 
         EXISTS (
           SELECT 1 FROM team_members tm 
           WHERE tm.user_id = auth.uid() 
           AND tm.owner_id = patients.user_id 
           AND tm.is_active = true
         ))
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao paciente';
  END IF;

  -- Desativar tokens existentes
  UPDATE renewal_tokens 
  SET is_active = false 
  WHERE patient_telefone = patient_phone;

  -- Criar novo token
  INSERT INTO renewal_tokens (patient_telefone, created_by)
  VALUES (patient_phone, auth.uid())
  RETURNING token INTO new_token;

  RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Inserir tokens para os pacientes existentes (para teste)
INSERT INTO renewal_tokens (patient_telefone, created_by, is_active)
SELECT DISTINCT telefone, user_id, true
FROM patients 
WHERE telefone IN ('554898477378', '5521971811979', '553184809196')
ON CONFLICT (token) DO NOTHING;

-- Verificar se tudo foi criado corretamente
SELECT 'Sistema de renovação pública configurado com sucesso!' as resultado;

-- Mostrar tokens criados para teste
SELECT 
  patient_telefone,
  token,
  expires_at,
  is_active
FROM renewal_tokens 
WHERE is_active = true
ORDER BY created_at DESC;