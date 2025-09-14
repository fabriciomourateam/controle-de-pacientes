-- Criar tabela para proteção por senha de páginas
CREATE TABLE IF NOT EXISTS page_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  description TEXT
);

-- Habilitar RLS
ALTER TABLE page_passwords ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - apenas usuários autenticados podem ver
CREATE POLICY "Authenticated users can view page passwords" ON page_passwords
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política para INSERT/UPDATE/DELETE - apenas admins (você pode ajustar conforme necessário)
CREATE POLICY "Admins can manage page passwords" ON page_passwords
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_page_passwords_page_name ON page_passwords(page_name);
CREATE INDEX IF NOT EXISTS idx_page_passwords_is_active ON page_passwords(is_active);

-- Inserir senha padrão para a página de planos
INSERT INTO page_passwords (page_name, password_hash, description, created_by)
VALUES (
  'plans',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- hash para "F@123"
  'Senha de acesso à página de planos',
  (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (page_name) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE page_passwords IS 'Tabela para armazenar senhas de proteção de páginas';
COMMENT ON COLUMN page_passwords.password_hash IS 'Hash bcrypt da senha para segurança';
COMMENT ON COLUMN page_passwords.page_name IS 'Nome da página protegida (ex: plans, reports)';
COMMENT ON COLUMN page_passwords.is_active IS 'Se a proteção por senha está ativa';
