-- =====================================================
-- ATUALIZAR POLÍTICAS RLS DA TABELA contact_history
-- Para garantir multi-tenancy (isolamento por usuário)
-- =====================================================

-- 1. Habilitar RLS (se ainda não estiver)
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Permitir leitura de histórico de contatos" ON contact_history;
DROP POLICY IF EXISTS "Permitir inserção de histórico de contatos" ON contact_history;
DROP POLICY IF EXISTS "Permitir atualização de histórico de contatos" ON contact_history;
DROP POLICY IF EXISTS "Users can only see their own contact history" ON contact_history;
DROP POLICY IF EXISTS "Users can only insert their own contact history" ON contact_history;
DROP POLICY IF EXISTS "Users can only update their own contact history" ON contact_history;
DROP POLICY IF EXISTS "Users can only delete their own contact history" ON contact_history;

-- 3. Criar novas políticas com multi-tenancy (isolamento por user_id)
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

-- 4. O trigger set_user_id_contact_history já existe, então está tudo certo!

-- Verificar se há registros sem user_id e migrar para o primeiro usuário (se necessário)
DO $$
DECLARE
    first_user_id UUID;
    records_count INTEGER;
BEGIN
    -- Contar registros sem user_id
    SELECT COUNT(*) INTO records_count
    FROM contact_history
    WHERE user_id IS NULL;
    
    IF records_count > 0 THEN
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
                records_count,
                first_user_id;
        END IF;
    ELSE
        RAISE NOTICE 'Todos os registros de contact_history já têm user_id.';
    END IF;
END $$;
