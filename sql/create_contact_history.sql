-- Adicionar campo para registrar último contato do nutricionista
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS ultimo_contato_nutricionista TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN patients.ultimo_contato_nutricionista IS 'Última vez que o nutricionista entrou em contato com o paciente (registrado via sistema)';

-- Criar tabela de histórico de contatos do nutricionista
-- IMPORTANTE: Usa telefone como chave (padrão do sistema)
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone VARCHAR(20) NOT NULL, -- Telefone do paciente (chave de ligação)
  patient_name VARCHAR(255), -- Nome do paciente (para facilitar consultas)
  contact_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  contact_type VARCHAR(50) DEFAULT 'manual', -- manual, whatsapp, phone, etc
  notes TEXT,
  created_by VARCHAR(255), -- email do usuário que registrou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_history_telefone ON contact_history(telefone);
CREATE INDEX IF NOT EXISTS idx_contact_history_contact_date ON contact_history(contact_date DESC);

-- Comentários
COMMENT ON TABLE contact_history IS 'Histórico completo de todos os contatos do nutricionista com pacientes';
COMMENT ON COLUMN contact_history.telefone IS 'Telefone do paciente (chave de ligação entre tabelas)';
COMMENT ON COLUMN contact_history.patient_name IS 'Nome do paciente (cache para facilitar consultas)';
COMMENT ON COLUMN contact_history.contact_date IS 'Data e hora do contato';
COMMENT ON COLUMN contact_history.contact_type IS 'Tipo de contato: manual, whatsapp, phone, email, etc';
COMMENT ON COLUMN contact_history.notes IS 'Observações sobre o contato';
COMMENT ON COLUMN contact_history.created_by IS 'Usuário que registrou o contato';

-- Habilitar RLS (Row Level Security)
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura de histórico de contatos" ON contact_history
  FOR SELECT
  USING (true);

-- Política: Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção de histórico de contatos" ON contact_history
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização de histórico de contatos" ON contact_history
  FOR UPDATE
  USING (true);
