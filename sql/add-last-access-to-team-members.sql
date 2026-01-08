-- Adicionar campo last_access à tabela team_members se não existir
DO $
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_members' AND column_name = 'last_access') THEN
        ALTER TABLE team_members ADD COLUMN last_access TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna last_access adicionada à tabela team_members';
    ELSE
        RAISE NOTICE 'Coluna last_access já existe na tabela team_members';
    END IF;
END $;

-- Verificar a estrutura atualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
AND column_name IN ('last_access', 'created_at', 'updated_at')
ORDER BY ordinal_position;