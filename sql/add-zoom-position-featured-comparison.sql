-- Adicionar campos de zoom e posição para as fotos da comparação destacada

-- Campos para foto "Antes"
ALTER TABLE featured_photo_comparison 
ADD COLUMN IF NOT EXISTS before_zoom NUMERIC(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS before_position_x NUMERIC(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS before_position_y NUMERIC(6,2) DEFAULT 0;

-- Campos para foto "Depois"
ALTER TABLE featured_photo_comparison 
ADD COLUMN IF NOT EXISTS after_zoom NUMERIC(3,1) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS after_position_x NUMERIC(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_position_y NUMERIC(6,2) DEFAULT 0;

-- Comentários
COMMENT ON COLUMN featured_photo_comparison.before_zoom IS 'Nível de zoom da foto "Antes" (0.5 a 3.0)';
COMMENT ON COLUMN featured_photo_comparison.before_position_x IS 'Posição X da foto "Antes" em pixels';
COMMENT ON COLUMN featured_photo_comparison.before_position_y IS 'Posição Y da foto "Antes" em pixels';
COMMENT ON COLUMN featured_photo_comparison.after_zoom IS 'Nível de zoom da foto "Depois" (0.5 a 3.0)';
COMMENT ON COLUMN featured_photo_comparison.after_position_x IS 'Posição X da foto "Depois" em pixels';
COMMENT ON COLUMN featured_photo_comparison.after_position_y IS 'Posição Y da foto "Depois" em pixels';
