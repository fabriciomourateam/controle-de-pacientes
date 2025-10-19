-- Popular a tabela page_passwords com as senhas das seções do sistema
-- Execute este script no SQL Editor do Supabase

-- Inserir as senhas para cada seção
INSERT INTO page_passwords (page_name, password_hash, is_active, description) VALUES
  ('Dashboard', 'Dashboard', true, 'Acesso à página principal do dashboard'),
  ('Pacientes', 'Pacientes', true, 'Acesso à gestão de pacientes'),
  ('Checkins', 'Checkins', true, 'Acesso aos check-ins'),
  ('Planos', 'Planos', true, 'Acesso aos planos'),
  ('Métricas Operacionais', 'Operacional', true, 'Acesso às métricas operacionais'),
  ('Métricas Comerciais', 'Comercial', true, 'Acesso às métricas comerciais'),
  ('Workspace', 'Workspace', true, 'Acesso ao workspace'),
  ('Bioimpedância', 'Bioimpedância', true, 'Acesso à bioimpedância'),
  ('Relatórios', 'Relatórios', true, 'Acesso aos relatórios')
ON CONFLICT (page_name) DO UPDATE 
  SET password_hash = EXCLUDED.password_hash,
      is_active = EXCLUDED.is_active,
      description = EXCLUDED.description,
      updated_at = NOW();

-- Verificar se os dados foram inseridos
SELECT page_name, password_hash, is_active, description, created_at, updated_at 
FROM page_passwords 
ORDER BY page_name;

