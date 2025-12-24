-- Sistema de Feedback de Check-in - SQL Completo
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela para templates de prompt
CREATE TABLE IF NOT EXISTS feedback_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  
  -- Configurações da IA
  ai_model VARCHAR(100) DEFAULT 'claude-3-5-sonnet-20241022',
  max_tokens INTEGER DEFAULT 1200,
  temperature DECIMAL(3,2) DEFAULT 0.3,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON feedback_prompt_templates(is_active, user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE feedback_prompt_templates ENABLE ROW LEVEL SECURITY;

-- 4. Criar política RLS para templates
DROP POLICY IF EXISTS "Users can manage their own prompt templates" ON feedback_prompt_templates;
CREATE POLICY "Users can manage their own prompt templates" ON feedback_prompt_templates
  FOR ALL USING (auth.uid() = user_id);

-- 5. Inserir template padrão do Fabricio
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
) VALUES (
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
{fechamento com próximos passos baseado no que foi dito acima}
Se tiver alguma dúvida pode me mandar aqui',
  true,
  true,
  'claude-3-5-sonnet-20241022',
  1200,
  0.3,
  auth.uid()
) ON CONFLICT DO NOTHING;