-- Corrigir RLS para sistema de feedback de check-in com suporte a membros da equipe
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover políticas antigas que não incluem membros da equipe
DROP POLICY IF EXISTS "Users can view own feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can create feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can update own feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can delete own feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can manage their own feedback analysis" ON checkin_feedback_analysis;

-- 2. Políticas para checkin_feedback_analysis com suporte a equipe
-- SELECT: Owner ou membro da equipe do owner
CREATE POLICY "Users can view feedback analysis" ON checkin_feedback_analysis
    FOR SELECT USING (
        -- Owner vê seus próprios feedbacks
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        ) OR
        -- Membro da equipe vê feedbacks dos pacientes do owner
        auth.uid() IN (
            SELECT tm.user_id FROM team_members tm
            JOIN patients p ON p.user_id = tm.owner_id
            WHERE p.id = patient_id AND tm.is_active = true AND tm.user_id IS NOT NULL
        )
    );

-- INSERT: Owner ou membro da equipe do owner
CREATE POLICY "Users can create feedback analysis" ON checkin_feedback_analysis
    FOR INSERT WITH CHECK (
        -- Owner pode criar feedbacks para seus pacientes
        patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        ) OR
        -- Membro da equipe pode criar feedbacks para pacientes do owner
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN team_members tm ON tm.owner_id = p.user_id
            WHERE tm.user_id = auth.uid() AND tm.is_active = true
        )
    );

-- UPDATE: Owner ou membro da equipe do owner
CREATE POLICY "Users can update feedback analysis" ON checkin_feedback_analysis
    FOR UPDATE USING (
        -- Owner pode atualizar seus próprios feedbacks
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        ) OR
        -- Membro da equipe pode atualizar feedbacks dos pacientes do owner
        auth.uid() IN (
            SELECT tm.user_id FROM team_members tm
            JOIN patients p ON p.user_id = tm.owner_id
            WHERE p.id = patient_id AND tm.is_active = true AND tm.user_id IS NOT NULL
        )
    );

-- DELETE: Apenas owner (membros não podem deletar)
CREATE POLICY "Users can delete feedback analysis" ON checkin_feedback_analysis
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        )
    );





