-- Sistema de Gestão de Check-ins - Sem referência a notes_count na view
-- Execute este script após adicionar as colunas

-- PARTE 1: Criar tabela para anotações dos check-ins
CREATE TABLE IF NOT EXISTS checkin_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    checkin_id UUID NOT NULL REFERENCES checkin(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PARTE 2: Criar função para updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PARTE 3: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_status ON checkin(status);
CREATE INDEX IF NOT EXISTS idx_checkin_assigned_to ON checkin(assigned_to);
CREATE INDEX IF NOT EXISTS idx_checkin_locked_by ON checkin(locked_by);
CREATE INDEX IF NOT EXISTS idx_checkin_notes_checkin_id ON checkin_notes(checkin_id);
CREATE INDEX IF NOT EXISTS idx_checkin_notes_user_id ON checkin_notes(user_id);

-- PARTE 4: Criar trigger para updated_at na tabela checkin_notes
DROP TRIGGER IF EXISTS update_checkin_notes_updated_at ON checkin_notes;
CREATE TRIGGER update_checkin_notes_updated_at
    BEFORE UPDATE ON checkin_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- PARTE 5: Função para adquirir lock em um check-in
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

-- PARTE 6: Função para liberar lock de um check-in
CREATE OR REPLACE FUNCTION release_checkin_lock(checkin_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE checkin 
    SET locked_by = NULL, locked_at = NULL
    WHERE id = checkin_uuid AND locked_by = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PARTE 7: Função para limpar locks expirados
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

-- PARTE 8: Função para obter membros da equipe disponíveis
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

-- PARTE 9: Função para atualizar contador de notas (funciona mesmo se a coluna não existir)
CREATE OR REPLACE FUNCTION update_checkin_notes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Tentar atualizar notes_count se a coluna existir
        BEGIN
            UPDATE checkin 
            SET notes_count = COALESCE(notes_count, 0) + 1 
            WHERE id = NEW.checkin_id;
        EXCEPTION WHEN undefined_column THEN
            -- Ignorar se a coluna não existir
            NULL;
        END;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Tentar atualizar notes_count se a coluna existir
        BEGIN
            UPDATE checkin 
            SET notes_count = GREATEST(COALESCE(notes_count, 0) - 1, 0) 
            WHERE id = OLD.checkin_id;
        EXCEPTION WHEN undefined_column THEN
            -- Ignorar se a coluna não existir
            NULL;
        END;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- PARTE 10: Criar triggers para contador de notas
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

-- PARTE 11: Habilitar RLS na tabela checkin_notes
ALTER TABLE checkin_notes ENABLE ROW LEVEL SECURITY;

-- PARTE 12: Políticas RLS para checkin_notes
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

-- PARTE 13: Criar view para facilitar consultas (sem notes_count por enquanto)
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
    -- Calcular notes_count dinamicamente
    (SELECT COUNT(*) FROM checkin_notes cn WHERE cn.checkin_id = c.id) as notes_count
FROM checkin c
LEFT JOIN patients p ON p.telefone = c.telefone
LEFT JOIN auth.users assigned_user ON assigned_user.id = c.assigned_to
LEFT JOIN profiles assigned_profile ON assigned_profile.id = c.assigned_to
LEFT JOIN user_profiles assigned_up ON assigned_up.id = c.assigned_to
LEFT JOIN auth.users locked_user ON locked_user.id = c.locked_by
LEFT JOIN profiles locked_profile ON locked_profile.id = c.locked_by
LEFT JOIN user_profiles locked_up ON locked_up.id = c.locked_by;

-- PARTE 14: Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION acquire_checkin_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_checkin_lock TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_locks TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_team_members TO authenticated;
GRANT SELECT ON checkin_with_team_info TO authenticated;

-- Finalizado!
SELECT 'Sistema de Gestão de Check-ins instalado com sucesso!' as resultado;