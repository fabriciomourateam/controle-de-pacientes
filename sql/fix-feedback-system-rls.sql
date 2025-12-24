-- Corrigir RLS para sistema de feedback de check-in
-- Execute este SQL no Supabase SQL Editor

-- 1. Habilitar RLS nas tabelas
ALTER TABLE feedback_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_feedback_analysis ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can create templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON feedback_prompt_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON feedback_prompt_templates;

-- Políticas para feedback_prompt_templates com suporte a equipe
-- Permitir que usuários vejam seus próprios templates ou de sua equipe
CREATE POLICY "Users can view templates" ON feedback_prompt_templates
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT member_user_id FROM team_members 
            WHERE owner_user_id = user_id AND status = 'active'
        ) OR
        user_id IN (
            SELECT owner_user_id FROM team_members 
            WHERE member_user_id = auth.uid() AND status = 'active'
        )
    );

-- Permitir que usuários criem templates
CREATE POLICY "Users can create templates" ON feedback_prompt_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários atualizem seus próprios templates ou de sua equipe
CREATE POLICY "Users can update templates" ON feedback_prompt_templates
    FOR UPDATE USING (
        auth.uid() = user_id OR
        auth.uid() IN (
            SELECT member_user_id FROM team_members 
            WHERE owner_user_id = user_id AND status = 'active'
        ) OR
        user_id IN (
            SELECT owner_user_id FROM team_members 
            WHERE member_user_id = auth.uid() AND status = 'active'
        )
    );

-- Permitir que usuários deletem seus próprios templates
CREATE POLICY "Users can delete templates" ON feedback_prompt_templates
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Remover políticas existentes para checkin_feedback_analysis
DROP POLICY IF EXISTS "Users can view own feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can create feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can update own feedback analysis" ON checkin_feedback_analysis;
DROP POLICY IF EXISTS "Users can delete own feedback analysis" ON checkin_feedback_analysis;

-- Políticas para checkin_feedback_analysis com suporte a equipe
-- Permitir que usuários vejam suas próprias análises ou de sua equipe
CREATE POLICY "Users can view feedback analysis" ON checkin_feedback_analysis
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        ) OR
        auth.uid() IN (
            SELECT member_user_id FROM team_members tm
            JOIN patients p ON p.user_id = tm.owner_user_id
            WHERE p.id = patient_id AND tm.status = 'active'
        ) OR
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN team_members tm ON tm.owner_user_id = auth.uid()
            WHERE p.user_id = tm.member_user_id AND tm.status = 'active'
        )
    );

-- Permitir que usuários criem análises para seus pacientes ou de sua equipe
CREATE POLICY "Users can create feedback analysis" ON checkin_feedback_analysis
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        ) OR
        auth.uid() IN (
            SELECT member_user_id FROM team_members tm
            JOIN patients p ON p.user_id = tm.owner_user_id
            WHERE p.id = patient_id AND tm.status = 'active'
        ) OR
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN team_members tm ON tm.owner_user_id = auth.uid()
            WHERE p.user_id = tm.member_user_id AND tm.status = 'active'
        )
    );

-- Permitir que usuários atualizem suas próprias análises ou de sua equipe
CREATE POLICY "Users can update feedback analysis" ON checkin_feedback_analysis
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        ) OR
        auth.uid() IN (
            SELECT member_user_id FROM team_members tm
            JOIN patients p ON p.user_id = tm.owner_user_id
            WHERE p.id = patient_id AND tm.status = 'active'
        ) OR
        patient_id IN (
            SELECT p.id FROM patients p
            JOIN team_members tm ON tm.owner_user_id = auth.uid()
            WHERE p.user_id = tm.member_user_id AND tm.status = 'active'
        )
    );

-- Permitir que usuários deletem suas próprias análises
CREATE POLICY "Users can delete feedback analysis" ON checkin_feedback_analysis
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM patients WHERE id = patient_id
        )
    );

-- 4. Inserir template padrão se não existir
INSERT INTO feedback_prompt_templates (
  name, 
  description, 
  prompt_template, 
  is_active, 
  is_default,
  ai_model,
  max_tokens,
  temperature,
  user_id
) 
SELECT 
  'Template Padrão Fabricio',
  'Template original com o estilo e formato personalizado do Fabricio Moura',
  'Quero que você seja eu, Fabricio Moura, nutricionista e treinador, com mais de 500 alunos ativos.

*Objetivo:* Responder como eu, especialista em análise de check-ins, entregando feedback objetivo, claro e motivador. O foco é resumir evolução, pontos de melhoria, ajustes e próximos passos — sem introduções longas, direto na estrutura abaixo.

*DADOS DO PACIENTE:*
Nome: {patientName}

*DADOS DO CHECK-IN ATUAL:*
{checkinData}

*DADOS COMPARATIVOS DE EVOLUÇÃO:*
{evolutionData}

*MINHAS OBSERVAÇÕES DE MELHORAS:*
{observedImprovements}

*AJUSTES QUE FIZ NA DIETA:*
{dietAdjustments}

*INSTRUÇÕES:*
- SEMPRE use minha linguagem: empatia, descontração, clareza e carisma;
- Não faça introduções fora da estrutura. Comece direto com: 📌 *FEEDBACK DO CHECK-IN*;
- Seja direto e enxuto, sem repetir demais as mesmas informações;
- Não repita métricas já ditas (exemplo: quantos treinos e cardios fez, quantas refeições livres fez, quanto de água bebeu, quanto tempo de sono);
- Não descreva alimentos específicos, apenas estratégias;
- Não dê sugestões sobre os treinos e cardios;
- Use gírias leves que eu costumo usar: show, top, perfeito;
- Evite termos: arrasou, tentar, acho;
- Dê espaçamento de linhas a cada duas frases com pontos finais.

*Formato de saída esperado:*
📌 *FEEDBACK DO CHECK-IN*
📈 *Progresso e Evolução:* {resumo objetivo da evolução, mencionando as métricas quando houver}
💡 *Pontos de Melhoria:*
{oportunidade 1}
{oportunidade 2}
🔄 *Ajustes no Planejamento:*
- {ajustes feitos e motivo, mencione em quais refeições foram feitas modificações (se houver), sempre frisando o objetivo de recomposição corporal, visando trazer aumento de massa muscular enquanto perde gordura}
📢 *Conclusão e Próximos Passos:*
{fechamento com próximos passos baseados no que foi dito acima}
Se tiver alguma dúvida pode me mandar aqui',
  true,
  true,
  'claude-3-5-sonnet-20241022',
  1200,
  0.3,
  auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM feedback_prompt_templates 
    WHERE user_id = auth.uid() AND name = 'Template Padrão Fabricio'
);