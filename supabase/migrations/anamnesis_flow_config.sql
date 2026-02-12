-- ====================================
-- Tabela: anamnesis_flow_config
-- Editor de Anamnese (multi-tenant)
-- ====================================

CREATE TABLE IF NOT EXISTS public.anamnesis_flow_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Minha Anamnese',
  description text,
  flow jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  final_message jsonb NOT NULL DEFAULT '{"title":"Anamnese enviada!","subtitle":"Seus dados foram enviados com sucesso.","footer":"Tenho certeza que você terá ótimos resultados! 🎯"}'::jsonb,
  terms_url text NOT NULL DEFAULT 'https://drive.google.com/file/d/1KuLkE5WpEeqX6MYFI46VhySng5UOK-nY/view?usp=sharing',
  terms_text text NOT NULL DEFAULT 'Antes de seguir, é importante que você conheça os termos do nosso acompanhamento.',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca por user_id
CREATE INDEX IF NOT EXISTS idx_anamnesis_flow_config_user_id ON public.anamnesis_flow_config(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.anamnesis_flow_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: cada nutricionista só acessa seus próprios fluxos
CREATE POLICY "anamnesis_flow_config_select" ON public.anamnesis_flow_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "anamnesis_flow_config_insert" ON public.anamnesis_flow_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "anamnesis_flow_config_update" ON public.anamnesis_flow_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "anamnesis_flow_config_delete" ON public.anamnesis_flow_config
  FOR DELETE USING (auth.uid() = user_id);

-- Política pública para leitura (formulário do paciente precisa ler o flow ativo)
CREATE POLICY "anamnesis_flow_config_public_read" ON public.anamnesis_flow_config
  FOR SELECT TO anon USING (is_active = true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_anamnesis_flow_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_anamnesis_flow_config_timestamp
  BEFORE UPDATE ON public.anamnesis_flow_config
  FOR EACH ROW
  EXECUTE FUNCTION update_anamnesis_flow_config_updated_at();
