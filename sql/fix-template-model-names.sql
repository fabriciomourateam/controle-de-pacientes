-- Corrigir nomes de modelos inválidos nos templates de feedback
-- Execute este SQL no Supabase SQL Editor

-- Atualizar modelos inválidos para o modelo correto: claude-3-7-sonnet-20250219
UPDATE feedback_prompt_templates 
SET ai_model = 'claude-3-7-sonnet-20250219'
WHERE ai_model IN (
  'claude-3-5-sonnet-20241022', 
  'claude-3-5-sonnet-20240620',
  'claude-3-5-sonnet',
  'claude-sonnet-4-20250514'
);

-- Verificar se há outros modelos inválidos
SELECT id, name, ai_model 
FROM feedback_prompt_templates 
WHERE ai_model NOT IN (
  'claude-3-7-sonnet-20250219',
  'claude-3-opus-20240229',
  'claude-3-haiku-20240307',
  'claude-3-sonnet-20240229'
);

