-- =====================================================
-- SISTEMA DE EXAMES LABORATORIAIS
-- =====================================================

-- 1. TIPOS DE EXAMES (tabela de referência)
CREATE TABLE IF NOT EXISTS exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'geral', 'bioquimico', 'hormonal', 'hematologico', 'outros'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. EXAMES SOLICITADOS
CREATE TABLE IF NOT EXISTS laboratory_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  telefone TEXT NOT NULL,
  
  -- Dados do exame
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE SET NULL,
  exam_name TEXT NOT NULL, -- Nome do exame (ex: "Hemograma Completo")
  exam_category TEXT, -- Categoria do exame
  
  -- Solicitação
  requested_at DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by UUID REFERENCES auth.users(id), -- Nutricionista que solicitou
  instructions TEXT, -- Instruções para o paciente (jejum, horário, etc)
  notes TEXT, -- Observações internas
  
  -- Status
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
  
  -- Resultado (quando completo)
  completed_at DATE NULL,
  result_file_url TEXT NULL, -- URL do PDF/imagem do resultado
  result_notes TEXT NULL, -- Anotações sobre o resultado
  reviewed_by UUID REFERENCES auth.users(id), -- Quem revisou o resultado
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_exam_types_category ON exam_types(category);
CREATE INDEX IF NOT EXISTS idx_exam_types_active ON exam_types(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_laboratory_exams_user_id ON laboratory_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_patient_id ON laboratory_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_telefone ON laboratory_exams(telefone);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_status ON laboratory_exams(status);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_requested_at ON laboratory_exams(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_laboratory_exams_user_patient_status ON laboratory_exams(user_id, patient_id, status);

-- Foreign key para telefone
ALTER TABLE laboratory_exams 
ADD CONSTRAINT laboratory_exams_telefone_fkey 
FOREIGN KEY (telefone) REFERENCES patients(telefone) ON DELETE CASCADE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_laboratory_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_laboratory_exams_updated_at_trigger 
    BEFORE UPDATE ON laboratory_exams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_laboratory_exams_updated_at();

-- Habilitar RLS
ALTER TABLE exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_exams ENABLE ROW LEVEL SECURITY;

-- Políticas para exam_types (todos podem ler, apenas admins podem criar/editar)
CREATE POLICY "Anyone can read exam types" ON exam_types
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage exam types" ON exam_types
FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para laboratory_exams (multi-tenancy)
CREATE POLICY "Users can view their own exams" ON laboratory_exams
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exams" ON laboratory_exams
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exams" ON laboratory_exams
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exams" ON laboratory_exams
FOR DELETE USING (auth.uid() = user_id);

-- Inserir tipos de exames comuns
INSERT INTO exam_types (name, category, description) VALUES
  ('Hemograma Completo', 'hematologico', 'Hemograma completo com contagem de células'),
  ('Glicemia de Jejum', 'bioquimico', 'Glicemia em jejum'),
  ('Hemoglobina Glicada (HbA1c)', 'bioquimico', 'Hemoglobina glicada'),
  ('Colesterol Total e Frações', 'bioquimico', 'Colesterol total, HDL, LDL e VLDL'),
  ('Triglicerídeos', 'bioquimico', 'Triglicerídeos'),
  ('TSH', 'hormonal', 'Hormônio estimulante da tireóide'),
  ('T4 Livre', 'hormonal', 'Tiroxina livre'),
  ('T3', 'hormonal', 'Triiodotironina'),
  ('Vitamina D (25-OH)', 'bioquimico', 'Vitamina D'),
  ('Vitamina B12', 'bioquimico', 'Vitamina B12'),
  ('Ácido Fólico', 'bioquimico', 'Ácido fólico'),
  ('Ferritina', 'bioquimico', 'Ferritina'),
  ('Creatinina', 'bioquimico', 'Função renal'),
  ('Ureia', 'bioquimico', 'Função renal'),
  ('Ácido Úrico', 'bioquimico', 'Ácido úrico'),
  ('AST/TGO', 'bioquimico', 'Transaminase'),
  ('ALT/TGP', 'bioquimico', 'Transaminase'),
  ('Albumina', 'bioquimico', 'Albumina sérica'),
  ('Proteína Total', 'bioquimico', 'Proteínas totais'),
  ('Insulina de Jejum', 'hormonal', 'Insulina em jejum'),
  ('Cortisol', 'hormonal', 'Cortisol'),
  ('Testosterona', 'hormonal', 'Testosterona'),
  ('Progesterona', 'hormonal', 'Progesterona'),
  ('Estradiol', 'hormonal', 'Estradiol'),
  ('Outros', 'outros', 'Outros exames')
ON CONFLICT (name) DO NOTHING;

-- Trigger para garantir user_id automaticamente
DROP TRIGGER IF EXISTS set_user_id_laboratory_exams ON laboratory_exams;
CREATE TRIGGER set_user_id_laboratory_exams
    BEFORE INSERT ON laboratory_exams
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id();

-- Comentários
COMMENT ON TABLE exam_types IS 'Tipos de exames laboratoriais disponíveis';
COMMENT ON TABLE laboratory_exams IS 'Exames laboratoriais solicitados e seus resultados';
COMMENT ON COLUMN laboratory_exams.status IS 'Status: requested, scheduled, completed, cancelled';
COMMENT ON COLUMN laboratory_exams.result_file_url IS 'URL do arquivo PDF/imagem do resultado do exame';

