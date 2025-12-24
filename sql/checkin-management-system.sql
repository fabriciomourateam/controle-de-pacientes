-- Sistema de Gestão de Check-ins com Status, Responsáveis, Anotações e Lock
-- Execute este SQL no Supabase SQL Editor
-- Integrado com estrutura existente de team_members e profiles

-- 1. Adicionar colunas à tabela checkin para gestão
ALTER TABLE checkin 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes_count INTEGER DEFAULT 0;

-- Atualizar trigger de updated_at se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_checkin_updated_at') THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ language 'plpgsql';

        CREATE TRIGGER update_checkin_updated_at
            BEFORE UPDATE ON checkin
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 2. Criar tabela para anotações dos check-ins
CREATE TABLE IF NOT EXISTS checkin_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkin_id UUID NOT NULL REFERENCES checkin(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_status ON checkin(status);
CREATE INDEX IF NOT EXISTS idx_checkin_assigned_to ON checkin(assigned_to);
CREATE INDEX IF NOT EXISTS idx_checkin_locked_by ON checkin(locked_by);
CREATE INDEX IF NOT EXISTS idx_checkin_notes_checkin_id ON checkin_notes(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_notes_user_id ON checkin_notes(user_id);

-- 4. Criar trigger para atualizar updated_at na tabela checkin_notes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_checkin_notes_updated_at') THEN
        CREATE TRIGGER update_checkin_notes_updated_at
            BEFORE UPDATE ON checkin_notes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 5. Função para adquirir lock em um check-in
CREATE OR REPLACE FUNCTION acquire_checkin_lock(checkin_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_lock_user UUID;
    current_lock_time TIMESTAMP WITH TIME ZONE;
    lock_timeout INTERVAL := '30 minutes';
BEGIN
    -- Verificar se já existe um lock válido
    SELECT locked_by, locked_at INTO current_lock_user, current_lock_time
    FROM checkin 
    WHERE id = checkin_uuid;
    
    -- Se não há lock ou o lock expirou ou é do mesmo usuário
    IF current_lock_user IS NULL 
       OR current_lock_time < (NOW() - lock_timeout)
       OR current_lock_user = user_uuid THEN
        
        -- Adquirir o lock
        UPDATE checkin 
        SET locked_by = user_uuid, locked_at = NOW()
        WHERE id = checkin_uuid;
        
        RETURN TRUE;
    ELSE
        -- Lock já existe e é válido
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para liberar lock de um check-in
CREATE OR REPLACE FUNCTION release_checkin_lock(checkin_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE checkin 
    SET locked_by = NULL, locked_at = NULL
    WHERE id = checkin_uuid AND locked_by = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Função para limpar locks expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    lock_timeout INTERVAL := '30 minutes';
    cleaned_count INTEGER;
BEGIN
    UPDATE checkin 
    SET locked_by = NULL, locked_at = NULL
    WHERE locked_at < (NOW() - lock_timeout);
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para obter membros da equipe disponíveis (integrada com sua estrutura)
CREATE OR REPLACE FUNCTION get_available_team_members()
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    email TEXT,
    is_owner BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    -- Primeiro o próprio usuário (owner)
    SELECT 
        auth.uid() as user_id,
        COALESCE(p.full_name, up.name, u.email) as name,
        u.email,
        TRUE as is_owner
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    LEFT JOIN user_profiles up ON up.id = u.id
    WHERE u.id = auth.uid()
    
    UNION ALL
    
    -- Depois os membros da equipe
    SELECT 
        tm.user_id as user_id,
        COALESCE(p.full_name, up.name, tm.name, u.email) as name,
        u.email,
        FALSE as is_owner
    FROM team_members tm
    JOIN auth.users u ON u.id = tm.user_id
    LEFT JOIN profiles p ON p.id = tm.user_id
    LEFT JOIN user_profiles up ON up.id = tm.user_id
    WHERE tm.owner_id = auth.uid() 
    AND tm.is_active = true
    
    ORDER BY is_owner DESC, name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para atualizar contador de notas
CREATE OR REPLACE FUNCTION update_checkin_notes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE checkin 
        SET notes_count = notes_count + 1 
        WHERE id = NEW.checkin_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE checkin 
        SET notes_count = GREATEST(notes_count - 1, 0) 
        WHERE id = OLD.checkin_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para contador de notas
DROP TRIGGER IF EXISTS checkin_notes_count_insert ON checkin_notes;
CREATE TRIGGER checkin_notes_count_insert
    AFTER INSERT ON checkin_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_notes_count();

DROP TRIGGER IF EXISTS checkin_notes_count_delete ON checkin_notes;
CREATE TRIGGER checkin_notes_count_delete
    AFTER DELETE ON checkin_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_checkin_notes_count();

-- 10. Habilitar RLS nas novas tabelas
ALTER TABLE checkin_notes ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para checkin_notes (integradas com team_members)
-- Usuários podem ver anotações de check-ins que têm acesso
DROP POLICY IF EXISTS "Users can view checkin notes" ON checkin_notes;
CREATE POLICY "Users can view checkin notes" ON checkin_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM checkin c
            WHERE c.id = checkin_notes.checkin_id
            AND (
                -- Proprietário do paciente
                c.user_id = auth.uid() OR
                -- Membro da equipe ativo
                auth.uid() IN (
                    SELECT tm.user_id FROM team_members tm
                    WHERE tm.owner_id = c.user_id AND tm.is_active = true
                ) OR
                -- Proprietário da equipe
                c.user_id IN (
                    SELECT tm.owner_id FROM team_members tm
                    WHERE tm.user_id = auth.uid() AND tm.is_active = true
                )
            )
        )
    );

-- Usuários podem criar anotações em check-ins que têm acesso
DROP POLICY IF EXISTS "Users can create checkin notes" ON checkin_notes;
CREATE POLICY "Users can create checkin notes" ON checkin_notes
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM checkin c
            WHERE c.id = checkin_notes.checkin_id
            AND (
                -- Proprietário do paciente
                c.user_id = auth.uid() OR
                -- Membro da equipe ativo
                auth.uid() IN (
                    SELECT tm.user_id FROM team_members tm
                    WHERE tm.owner_id = c.user_id AND tm.is_active = true
                ) OR
                -- Proprietário da equipe
                c.user_id IN (
                    SELECT tm.owner_id FROM team_members tm
                    WHERE tm.user_id = auth.uid() AND tm.is_active = true
                )
            )
        )
    );

-- Usuários podem atualizar suas próprias anotações
DROP POLICY IF EXISTS "Users can update own checkin notes" ON checkin_notes;
CREATE POLICY "Users can update own checkin notes" ON checkin_notes
    FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem deletar suas próprias anotações
DROP POLICY IF EXISTS "Users can delete own checkin notes" ON checkin_notes;
CREATE POLICY "Users can delete own checkin notes" ON checkin_notes
    FOR DELETE USING (auth.uid() = user_id);

-- 12. Criar view para facilitar consultas de check-ins com informações de equipe
CREATE OR REPLACE VIEW checkin_with_team_info AS
SELECT 
    c.*,
    p.nome as patient_name,
    p.user_id as patient_owner_id,
    assigned_user.email as assigned_to_email,
    COALESCE(assigned_profile.full_name, assigned_up.name, assigned_user.email) as assigned_to_name,
    locked_user.email as locked_by_email,
    COALESCE(locked_profile.full_name, locked_up.name, locked_user.email) as locked_by_name,
    CASE 
        WHEN c.locked_at IS NOT NULL AND c.locked_at > (NOW() - INTERVAL '30 minutes') 
        THEN TRUE 
        ELSE FALSE 
    END as is_locked,
    COALESCE(c.notes_count, 0) as notes_count
FROM checkin c
LEFT JOIN patients p ON p.telefone = c.telefone
LEFT JOIN auth.users assigned_user ON assigned_user.id = c.assigned_to
LEFT JOIN profiles assigned_profile ON assigned_profile.id = c.assigned_to
LEFT JOIN user_profiles assigned_up ON assigned_up.id = c.assigned_to
LEFT JOIN auth.users locked_user ON locked_user.id = c.locked_by
LEFT JOIN profiles locked_profile ON locked_profile.id = c.locked_by
LEFT JOIN user_profiles locked_up ON locked_up.id = c.locked_by;

-- 13. Comentários para documentação
COMMENT ON COLUMN checkin.status IS 'Status do check-in: pendente, em_analise, enviado';
COMMENT ON COLUMN checkin.assigned_to IS 'UUID do usuário responsável pelo check-in';
COMMENT ON COLUMN checkin.locked_by IS 'UUID do usuário que está editando o check-in';
COMMENT ON COLUMN checkin.locked_at IS 'Timestamp de quando o lock foi adquirido';
COMMENT ON COLUMN checkin.notes_count IS 'Contador de anotações do check-in';
COMMENT ON TABLE checkin_notes IS 'Anotações dos check-ins para comunicação da equipe';
COMMENT ON FUNCTION acquire_checkin_lock IS 'Adquire lock exclusivo para edição de check-in';
COMMENT ON FUNCTION release_checkin_lock IS 'Libera lock de edição de check-in';
COMMENT ON FUNCTION cleanup_expired_locks IS 'Remove locks expirados (executar periodicamente)';

-- 14. Atualizar contador de notas para check-ins existentes
UPDATE checkin SET notes_count = (
    SELECT COUNT(*) FROM checkin_notes cn WHERE cn.checkin_id = checkin.id
) WHERE notes_count IS NULL OR notes_count = 0;

-- 15. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION acquire_checkin_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_checkin_lock TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_locks TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_team_members TO authenticated;
GRANT SELECT ON checkin_with_team_info TO authenticated;

-- 16. Inserir dados de exemplo para status (se necessário)
-- UPDATE checkin SET status = 'pendente' WHERE status IS NULL;