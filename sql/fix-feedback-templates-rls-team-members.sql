-- Corrigir RLS para templates de feedback com suporte a membros da equipe
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover políticas antigas que não incluem membros da equipe
DROP POLICY IF EXISTS "Users can view own templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can view templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can create templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can update templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can delete templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can manage their own prompt templates" ON feedback_prompt_templates;

-- 2. Políticas para feedback_prompt_templates com suporte a equipe
-- SELECT: Owner ou membro da equipe pode ver templates do owner
CREATE POLICY "Users can view templates" ON feedback_prompt_templates
    FOR SELECT USING (
        -- Owner vê seus próprios templates
        auth.uid() = user_id OR
        -- Membro da equipe vê templates do owner
        user_id IN (
            SELECT owner_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- INSERT: Qualquer usuário pode criar seus próprios templates
CREATE POLICY "Users can create templates" ON feedback_prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Owner pode atualizar seus templates, membros também podem atualizar templates do owner
CREATE POLICY "Users can update templates" ON feedback_prompt_templates
    FOR UPDATE USING (
        -- Owner pode atualizar seus próprios templates
        auth.uid() = user_id OR
        -- Membro da equipe pode atualizar templates do owner
        user_id IN (
            SELECT owner_id FROM team_members 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- DELETE: Apenas owner pode deletar seus templates
CREATE POLICY "Users can delete templates" ON feedback_prompt_templates
    FOR DELETE USING (auth.uid() = user_id);








