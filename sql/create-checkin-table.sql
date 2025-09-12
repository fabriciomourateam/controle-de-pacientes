-- Criar tabela checkin completa
CREATE TABLE IF NOT EXISTS checkin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  data_checkin DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_ano TEXT NOT NULL,
  data_preenchimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Dados físicos
  peso NUMERIC(5, 2) NULL,
  medida NUMERIC(5, 2) NULL,
  
  -- Dados de treino e exercícios
  treino TEXT NULL,
  cardio TEXT NULL,
  agua TEXT NULL,
  sono TEXT NULL,
  
  -- Dados de alimentação
  ref_livre TEXT NULL,
  beliscos TEXT NULL,
  oq_comeu_ref_livre TEXT NULL,
  oq_beliscou TEXT NULL,
  comeu_menos TEXT NULL,
  fome_algum_horario TEXT NULL,
  alimento_para_incluir TEXT NULL,
  
  -- Dados de avaliação física
  melhora_visual TEXT NULL,
  quais_pontos TEXT NULL,
  objetivo TEXT NULL,
  dificuldades TEXT NULL,
  
  -- Dados de bem-estar
  stress TEXT NULL,
  libido TEXT NULL,
  tempo TEXT NULL,
  descanso TEXT NULL,
  tempo_cardio TEXT NULL,
  
  -- Fotos (URLs)
  foto_1 TEXT NULL,
  foto_2 TEXT NULL,
  foto_3 TEXT NULL,
  foto_4 TEXT NULL,
  
  -- Contato
  telefone_checkin TEXT NULL,
  
  -- Pontuação
  pontos_treinos INTEGER NULL,
  pontos_cardios INTEGER NULL,
  pontos_descanso_entre_series INTEGER NULL,
  pontos_refeicao_livre INTEGER NULL,
  pontos_beliscos INTEGER NULL,
  pontos_agua INTEGER NULL,
  pontos_sono INTEGER NULL,
  pontos_qualidade_sono INTEGER NULL,
  pontos_stress INTEGER NULL,
  pontos_libido INTEGER NULL,
  total_pontuacao INTEGER NULL,
  percentual_aproveitamento NUMERIC(5, 2) NULL,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint única por telefone e mês/ano
  CONSTRAINT unique_checkin_per_month UNIQUE (telefone, mes_ano)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_telefone ON checkin(telefone);
CREATE INDEX IF NOT EXISTS idx_checkin_data ON checkin(data_checkin);
CREATE INDEX IF NOT EXISTS idx_checkin_mes_ano ON checkin(mes_ano);

-- RLS (Row Level Security)
ALTER TABLE checkin ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita
CREATE POLICY "Enable all operations for authenticated users" ON checkin
FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_checkin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_checkin_updated_at_trigger 
    BEFORE UPDATE ON checkin 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checkin_updated_at();

-- Criar foreign key para relacionar com patients
ALTER TABLE checkin 
ADD CONSTRAINT checkin_telefone_fkey 
FOREIGN KEY (telefone) REFERENCES patients(telefone);

-- Verificar se a tabela foi criada corretamente
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'checkin' 
ORDER BY ordinal_position;

