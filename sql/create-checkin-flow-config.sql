-- Tabela para armazenar configuracao do fluxo de check-in
-- O fluxo e um JSON editavel que define perguntas, opcoes e mensagens condicionais

CREATE TABLE IF NOT EXISTS checkin_flow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL DEFAULT 'Check-In Mensal',
  flow JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkin_flow_config_user_id ON checkin_flow_config(user_id);

CREATE OR REPLACE FUNCTION update_checkin_flow_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_checkin_flow_config_updated_at
  BEFORE UPDATE ON checkin_flow_config
  FOR EACH ROW
  EXECUTE FUNCTION update_checkin_flow_config_updated_at();

ALTER TABLE checkin_flow_config ENABLE ROW LEVEL SECURITY;

-- Owner pode ler/escrever seus proprios fluxos
CREATE POLICY "users_can_manage_own_flow"
ON checkin_flow_config
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Acesso publico para leitura (service role le para renderizar o chat)
CREATE POLICY "public_can_read_active_flow"
ON checkin_flow_config
FOR SELECT
TO anon
USING (is_active = true);
