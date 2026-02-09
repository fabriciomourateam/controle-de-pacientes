-- Tabela para controlar acesso de usuarios a rotas restritas
-- Admin (fabriciomouratreinador@gmail.com) togga on/off por usuario
-- Por padrao, novos usuarios NAO tem acesso (todos false)

-- 1. Criar tabela
CREATE TABLE IF NOT EXISTS user_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  route_metrics BOOLEAN DEFAULT false,
  route_commercial_metrics BOOLEAN DEFAULT false,
  route_reports BOOLEAN DEFAULT false,
  route_plans BOOLEAN DEFAULT false,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar indice
CREATE INDEX IF NOT EXISTS idx_user_access_control_user_id ON user_access_control(user_id);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_access_control_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_access_control_updated_at
  BEFORE UPDATE ON user_access_control
  FOR EACH ROW
  EXECUTE FUNCTION update_user_access_control_updated_at();

-- 4. Habilitar RLS
ALTER TABLE user_access_control ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Qualquer autenticado pode ler o PROPRIO registro
CREATE POLICY "users_can_read_own_access"
ON user_access_control
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_admin_user());

-- Somente admin pode inserir
CREATE POLICY "admin_can_insert_access"
ON user_access_control
FOR INSERT
TO authenticated
WITH CHECK (is_admin_user());

-- Somente admin pode atualizar
CREATE POLICY "admin_can_update_access"
ON user_access_control
FOR UPDATE
TO authenticated
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Somente admin pode deletar
CREATE POLICY "admin_can_delete_access"
ON user_access_control
FOR DELETE
TO authenticated
USING (is_admin_user());
