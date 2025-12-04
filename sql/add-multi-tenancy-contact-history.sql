-- =====================================================
-- ADICIONAR MULTI-TENANCY À TABELA contact_history
-- =====================================================

-- 1. Adicionar coluna user_id se não existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contact_history'
    ) THEN
        -- Adicionar coluna user_id se não existir
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'contact_history' AND column_name = 'user_id'
        ) THEN
            ALTER TABLE contact_history 
            ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_contact_history_user_id 
            ON contact_history(user_id);
            
            RAISE NOTICE 'Coluna user_id adicionada à tabela contact_history';
        END IF;
    END IF;
END $$;

-- 2. Migrar dados existentes para o usuário atual (se houver dados sem user_id)
-- ⚠️ ATENÇÃO: Este script assume que todos os contatos existentes pertencem ao primeiro usuário
-- Se você tiver múltiplos usuários, ajuste conforme necessário
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'contact_history'
    ) THEN
        -- Pegar o primeiro usuário (ou você pode especificar um email específico)
        SELECT id INTO first_user_id
        FROM auth.users
        ORDER BY created_at ASC
        LIMIT 1;
        
        IF first_user_id IS NOT NULL THEN
            -- Atualizar registros sem user_id
            UPDATE contact_history
            SET user_id = first_user_id
            WHERE user_id IS NULL;
            
            RAISE NOTICE 'Migrados % registros de contact_history para o usuário %',
                (SELECT COUNT(*) FROM contact_history WHERE user_id = first_user_id),
                first_user_id;
        END IF;
    END IF;
END $$;

-- 3. Habilitar RLS
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura de histórico de contatos" ON contact_history;
DROP POLICY IF EXISTS "Permitir inserção de histórico de contatos" ON contact_history;
DROP POLICY IF EXISTS "Permitir atualização de histórico de contatos" ON contact_history;

-- 5. Criar novas políticas com multi-tenancy
CREATE POLICY "Users can only see their own contact history" ON contact_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own contact history" ON contact_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own contact history" ON contact_history
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own contact history" ON contact_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Criar trigger para garantir user_id em inserts
DROP TRIGGER IF EXISTS set_user_id_contact_history ON contact_history;
CREATE TRIGGER set_user_id_contact_history
    BEFORE INSERT ON contact_history
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

RAISE NOTICE 'Multi-tenancy configurado para contact_history com sucesso!';

