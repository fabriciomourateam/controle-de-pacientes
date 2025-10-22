-- Tabela para tokens de acesso do Portal do Aluno
CREATE TABLE IF NOT EXISTS patient_portal_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  
  CONSTRAINT fk_patient_portal_tokens_patient FOREIGN KEY (telefone) 
    REFERENCES patients(telefone) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_telefone ON patient_portal_tokens(telefone);
CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_token ON patient_portal_tokens(token);
CREATE INDEX IF NOT EXISTS idx_patient_portal_tokens_active ON patient_portal_tokens(is_active) WHERE is_active = TRUE;

-- Função para gerar token único (aleatório e seguro)
CREATE OR REPLACE FUNCTION generate_unique_token()
RETURNS TEXT AS $$
DECLARE
  new_token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar token de 32 caracteres
    new_token := encode(gen_random_bytes(24), 'base64');
    -- Substituir caracteres problemáticos em URLs
    new_token := replace(replace(replace(new_token, '+', ''), '/', ''), '=', '');
    new_token := substring(new_token from 1 for 32);
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM patient_portal_tokens WHERE token = new_token) INTO token_exists;
    
    EXIT WHEN NOT token_exists;
  END LOOP;
  
  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_accessed_at automaticamente
CREATE OR REPLACE FUNCTION update_token_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  NEW.access_count = NEW.access_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE patient_portal_tokens IS 'Tokens de acesso único para o Portal do Aluno (read-only)';
COMMENT ON COLUMN patient_portal_tokens.token IS 'Token único e aleatório para acesso sem senha';
COMMENT ON COLUMN patient_portal_tokens.is_active IS 'Se o token está ativo ou foi revogado';
COMMENT ON COLUMN patient_portal_tokens.expires_at IS 'Data de expiração opcional do token (NULL = não expira)';
COMMENT ON COLUMN patient_portal_tokens.access_count IS 'Número de vezes que o portal foi acessado com este token';

