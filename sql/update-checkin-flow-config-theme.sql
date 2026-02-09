-- Adicionar campos de tema e imagem à tabela checkin_flow_config
-- Execute DEPOIS de criar a tabela base (create-checkin-flow-config.sql)

-- Adicionar coluna de tema (cores customizáveis)
ALTER TABLE checkin_flow_config ADD COLUMN IF NOT EXISTS theme JSONB DEFAULT '{
  "bg_gradient_from": "#020617",
  "bg_gradient_via": "#172554",
  "bg_gradient_to": "#020617",
  "bot_bubble_bg": "rgba(30,41,59,0.8)",
  "bot_bubble_text": "#e2e8f0",
  "user_bubble_bg": "#2563eb",
  "user_bubble_text": "#ffffff",
  "button_bg": "#2563eb",
  "button_hover_bg": "#1d4ed8",
  "button_text": "#ffffff",
  "option_bg": "rgba(30,41,59,0.5)",
  "option_border": "rgba(51,65,85,0.5)",
  "option_text": "#e2e8f0",
  "header_bg": "transparent",
  "header_text": "#ffffff",
  "input_bg": "rgba(30,41,59,0.5)",
  "input_border": "rgba(51,65,85,0.5)",
  "input_text": "#ffffff",
  "accent_color": "#3b82f6"
}';

-- Adicionar coluna de imagem do cabeçalho
ALTER TABLE checkin_flow_config ADD COLUMN IF NOT EXISTS header_image_url TEXT DEFAULT NULL;

-- Adicionar coluna de descrição
ALTER TABLE checkin_flow_config ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
