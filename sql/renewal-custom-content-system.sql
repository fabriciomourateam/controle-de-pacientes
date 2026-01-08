-- Sistema de Conteúdo Personalizado para Relatórios de Renovação
-- Permite editar e salvar textos personalizados para cada paciente

-- Tabela para armazenar conteúdo personalizado dos relatórios
CREATE TABLE IF NOT EXISTS renewal_custom_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_telefone TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Conteúdos personalizáveis
    summary_content TEXT, -- "Sua Evolução" - texto principal
    achievements_content TEXT, -- "Conquistas Alcançadas"
    improvement_areas_content TEXT, -- "Áreas de Melhoria" 
    highlights_content TEXT, -- "Destaques da Evolução"
    next_cycle_goals_content TEXT, -- "Metas para o Próximo Ciclo"
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices únicos
    UNIQUE(patient_telefone, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_renewal_custom_content_patient_telefone ON renewal_custom_content(patient_telefone);
CREATE INDEX IF NOT EXISTS idx_renewal_custom_content_user_id ON renewal_custom_content(user_id);
CREATE INDEX IF NOT EXISTS idx_renewal_custom_content_updated_at ON renewal_custom_content(updated_at);

-- RLS (Row Level Security)
ALTER TABLE renewal_custom_content ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem apenas seus próprios conteúdos
CREATE POLICY "Users can view own renewal custom content" ON renewal_custom_content
    FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários autenticados criarem conteúdo
CREATE POLICY "Users can create own renewal custom content" ON renewal_custom_content
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para usuários autenticados atualizarem seus próprios conteúdos
CREATE POLICY "Users can update own renewal custom content" ON renewal_custom_content
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários autenticados deletarem seus próprios conteúdos
CREATE POLICY "Users can delete own renewal custom content" ON renewal_custom_content
    FOR DELETE USING (auth.uid() = user_id);

-- Política para membros da equipe acessarem conteúdos do owner
CREATE POLICY "Team members can access owner renewal custom content" ON renewal_custom_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid()
            AND tm.owner_id = renewal_custom_content.user_id
            AND tm.is_active = true
        )
    );

-- Política para membros da equipe criarem conteúdos para o owner
CREATE POLICY "Team members can create renewal custom content for owner" ON renewal_custom_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid()
            AND tm.owner_id = renewal_custom_content.user_id
            AND tm.is_active = true
        )
    );

-- Política para membros da equipe atualizarem conteúdos do owner
CREATE POLICY "Team members can update owner renewal custom content" ON renewal_custom_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid()
            AND tm.owner_id = renewal_custom_content.user_id
            AND tm.is_active = true
        )
    );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_renewal_custom_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_renewal_custom_content_updated_at
    BEFORE UPDATE ON renewal_custom_content
    FOR EACH ROW
    EXECUTE FUNCTION update_renewal_custom_content_updated_at();

-- Comentários para documentação
COMMENT ON TABLE renewal_custom_content IS 'Armazena conteúdo personalizado editável para relatórios de renovação';
COMMENT ON COLUMN renewal_custom_content.patient_telefone IS 'Telefone do paciente (chave de identificação)';
COMMENT ON COLUMN renewal_custom_content.user_id IS 'ID do usuário proprietário (profissional)';
COMMENT ON COLUMN renewal_custom_content.summary_content IS 'Conteúdo personalizado da seção "Sua Evolução"';
COMMENT ON COLUMN renewal_custom_content.achievements_content IS 'Conteúdo personalizado da seção "Conquistas Alcançadas"';
COMMENT ON COLUMN renewal_custom_content.improvement_areas_content IS 'Conteúdo personalizado da seção "Áreas de Melhoria"';
COMMENT ON COLUMN renewal_custom_content.highlights_content IS 'Conteúdo personalizado da seção "Destaques da Evolução"';
COMMENT ON COLUMN renewal_custom_content.next_cycle_goals_content IS 'Conteúdo personalizado da seção "Metas para o Próximo Ciclo"';