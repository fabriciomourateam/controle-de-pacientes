-- Adicionar campo para notificações lidas na tabela user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS read_notifications JSONB DEFAULT '[]';

-- Comentário explicativo
COMMENT ON COLUMN user_preferences.read_notifications IS 'Array de IDs das notificações que foram marcadas como lidas pelo usuário';
