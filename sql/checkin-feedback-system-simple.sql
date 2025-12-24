-- Sistema de Feedback de Check-in (Versão Simplificada)
-- Criação das tabelas para o sistema de feedback automatizado

-- Tabela para templates de prompt editáveis
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

-- Tabela para análises de check-in e feedbacks gerados
CREATE TABLE IF NOT EXISTS checkin_feedback_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_telefone TEXT NOT NULL, -- Usar telefone como identificador do paciente
  checkin_id UUID, -- Referência ao check-in
  checkin_date DATE NOT NULL,
  
  -- Dados do check-in (backup/referência)
  checkin_data JSONB,
  evolution_data JSONB,
  
  -- Suas anotações manuais
  observed_improvements TEXT,
  diet_adjustments TEXT,
  
  -- Feedback gerado
  generated_feedback TEXT,
  feedback_status VARCHAR(20) DEFAULT 'draft', -- draft, approved, sent
  prompt_template_id UUID REFERENCES feedback_prompt_templates(id),
  
  -- Controle de envio
  sent_at TIMESTAMP,
  sent_via VARCHAR(50), -- 'whatsapp', 'manual', 'api'
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_patient ON checkin_feedback_analysis(patient_telefone);
CREATE INDEX IF NOT EXISTS idx_checkin_feedback_date ON checkin_feedback_analysis(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_active ON feedback_prompt_templates(is_active, user_id);

-- RLS (Row Level Security)
ALTER TABLE feedback_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_feedback_analysis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para templates
DROP POLICY IF EXISTS "Users can manage their own prompt templates" ON feedback_prompt_templates;
CREATE POLICY "Users can manage their own prompt templates" ON feedback_prompt_templates
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para análises de feedback
DROP POLICY IF EXISTS "Users can manage their own feedback analysis" ON checkin_feedback_analysis;
CREATE POLICY "Users can manage their own feedback analysis" ON checkin_feedback_analysis
  FOR ALL USING (auth.uid() = user_id);