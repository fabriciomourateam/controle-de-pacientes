-- ============================================
-- SISTEMA DE GESTÃO DE EQUIPE E PERMISSÕES
-- ============================================

-- Tabela de perfis de acesso (roles)
CREATE TABLE IF NOT EXISTS team_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT FALSE, -- Roles padrão do sistema não podem ser deletados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros da equipe
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Nutricionista dono
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Usuário do membro (se já tiver conta)
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  last_access TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(owner_id, email)
);

-- Tabela de log de acessos (auditoria)
CREATE TABLE IF NOT EXISTS team_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir perfis padrão do sistema
INSERT INTO team_roles (name, description, permissions, is_system_role) VALUES
('Administrador', 'Acesso total a todas as funcionalidades', '{
  "dashboard": true,
  "patients": true,
  "checkins": true,
  "diets": true,
  "metrics": true,
  "reports": true,
  "team": true,
  "settings": true,
  "billing": true
}', true),

('Estagiário', 'Acesso a dashboard, checkins, pacientes e planos alimentares', '{
  "dashboard": true,
  "patients": true,
  "checkins": true,
  "diets": true,
  "metrics": false,
  "reports": false,
  "team": false,
  "settings": false,
  "billing": false
}', true),

('Vendedor', 'Acesso apenas a métricas comerciais e relatórios', '{
  "dashboard": false,
  "patients": false,
  "checkins": false,
  "diets": false,
  "metrics": true,
  "reports": true,
  "team": false,
  "settings": false,
  "billing": false
}', true),

('Assistente', 'Acesso a dashboard, pacientes e checkins', '{
  "dashboard": true,
  "patients": true,
  "checkins": true,
  "diets": false,
  "metrics": false,
  "reports": false,
  "team": false,
  "settings": false,
  "billing": false
}', true),

('Nutricionista', 'Acesso a funcionalidades clínicas sem gestão', '{
  "dashboard": true,
  "patients": true,
  "checkins": true,
  "diets": true,
  "metrics": false,
  "reports": true,
  "team": false,
  "settings": false,
  "billing": false
}', true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);
CREATE INDEX IF NOT EXISTS idx_team_access_logs_member ON team_access_logs(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_access_logs_created ON team_access_logs(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_roles_updated_at
  BEFORE UPDATE ON team_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_access_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para team_roles
CREATE POLICY "Usuários podem ver roles" ON team_roles
  FOR SELECT USING (true);

-- Políticas para team_members
CREATE POLICY "Owners podem ver seus membros" ON team_members
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners podem inserir membros" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners podem atualizar seus membros" ON team_members
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners podem deletar seus membros" ON team_members
  FOR DELETE USING (auth.uid() = owner_id);

-- Políticas para team_access_logs
CREATE POLICY "Owners podem ver logs de seus membros" ON team_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = team_access_logs.team_member_id
      AND team_members.owner_id = auth.uid()
    )
  );

CREATE POLICY "Sistema pode inserir logs" ON team_access_logs
  FOR INSERT WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE team_roles IS 'Perfis de acesso com permissões específicas';
COMMENT ON TABLE team_members IS 'Membros da equipe de cada nutricionista';
COMMENT ON TABLE team_access_logs IS 'Log de acessos e ações dos membros da equipe';

COMMENT ON COLUMN team_roles.permissions IS 'JSON com permissões granulares: {
  dashboard: boolean,
  patients: {view, create, edit, delete},
  checkins: {view, create, edit, delete},
  diets: {view, create, edit, delete, release},
  metrics: {view_sales, view_retention, export},
  reports: {clinical, financial, export},
  team: {view, create, edit, delete},
  settings: {account, integrations},
  billing: {view, manage}
}';
COMMENT ON COLUMN team_members.owner_id IS 'ID do nutricionista dono da equipe';
COMMENT ON COLUMN team_members.user_id IS 'ID do usuário autenticado (quando aceitar convite)';
COMMENT ON COLUMN team_members.is_active IS 'Se o membro está ativo ou foi desativado';
