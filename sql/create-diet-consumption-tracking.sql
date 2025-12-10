-- =====================================================
-- TABELAS PARA RASTREAMENTO DE CONSUMO E GAMIFICAÇÃO
-- =====================================================

-- 1. HISTÓRICO DE CONSUMO DIÁRIO
CREATE TABLE IF NOT EXISTS diet_daily_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE SET NULL,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Totais consumidos no dia
  total_calories_consumed NUMERIC(8, 2) DEFAULT 0,
  total_protein_consumed NUMERIC(8, 2) DEFAULT 0,
  total_carbs_consumed NUMERIC(8, 2) DEFAULT 0,
  total_fats_consumed NUMERIC(8, 2) DEFAULT 0,
  
  -- Metas do plano
  target_calories NUMERIC(8, 2),
  target_protein NUMERIC(8, 2),
  target_carbs NUMERIC(8, 2),
  target_fats NUMERIC(8, 2),
  
  -- Percentual de conclusão
  completion_percentage NUMERIC(5, 2) DEFAULT 0,
  
  -- Refeições consumidas (JSON array de meal_ids)
  consumed_meals JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma entrada por paciente por dia
  CONSTRAINT unique_patient_consumption_per_day UNIQUE (patient_id, consumption_date)
);

CREATE INDEX IF NOT EXISTS idx_diet_daily_consumption_patient_id ON diet_daily_consumption(patient_id);
CREATE INDEX IF NOT EXISTS idx_diet_daily_consumption_date ON diet_daily_consumption(consumption_date);
CREATE INDEX IF NOT EXISTS idx_diet_daily_consumption_plan_id ON diet_daily_consumption(diet_plan_id);
CREATE INDEX IF NOT EXISTS idx_diet_daily_consumption_patient_date ON diet_daily_consumption(patient_id, consumption_date DESC);

-- 2. SISTEMA DE PONTOS E GAMIFICAÇÃO
CREATE TABLE IF NOT EXISTS patient_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Pontos totais acumulados
  total_points INTEGER DEFAULT 0,
  
  -- Pontos por categoria
  points_diet INTEGER DEFAULT 0, -- Pontos por seguir dieta
  points_consistency INTEGER DEFAULT 0, -- Pontos por consistência
  points_achievements INTEGER DEFAULT 0, -- Pontos por conquistas
  
  -- Nível atual (baseado em pontos)
  current_level INTEGER DEFAULT 1,
  
  -- Estatísticas
  total_days_tracked INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- Sequência de dias seguidos
  longest_streak INTEGER DEFAULT 0,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_patient_points UNIQUE (patient_id)
);

CREATE INDEX IF NOT EXISTS idx_patient_points_patient_id ON patient_points(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_points_level ON patient_points(current_level DESC);

-- 3. HISTÓRICO DE PONTOS (para gráficos e histórico)
CREATE TABLE IF NOT EXISTS patient_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  points_id UUID REFERENCES patient_points(id) ON DELETE CASCADE,
  
  -- Pontos ganhos nesta ação
  points_earned INTEGER NOT NULL,
  
  -- Tipo de ação que gerou os pontos
  action_type TEXT NOT NULL, -- 'meal_consumed', 'daily_complete', 'streak', 'achievement'
  
  -- Descrição da ação
  action_description TEXT,
  
  -- Data da ação
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_points_history_patient_id ON patient_points_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_points_history_date ON patient_points_history(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_points_history_points_id ON patient_points_history(points_id);

-- 4. CONQUISTAS (ACHIEVEMENTS)
CREATE TABLE IF NOT EXISTS patient_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Tipo de conquista
  achievement_type TEXT NOT NULL, -- 'first_meal', 'week_complete', 'month_complete', 'streak_7', 'streak_30', etc.
  
  -- Nome e descrição
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  
  -- Pontos ganhos
  points_earned INTEGER DEFAULT 0,
  
  -- Data de conquista
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uma conquista por tipo por paciente
  CONSTRAINT unique_patient_achievement UNIQUE (patient_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_patient_achievements_patient_id ON patient_achievements(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_achievements_type ON patient_achievements(achievement_type);

-- 5. CONFIGURAÇÃO DE CONQUISTAS (template)
CREATE TABLE IF NOT EXISTS achievement_templates (
  achievement_type TEXT PRIMARY KEY,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  points_earned INTEGER DEFAULT 0,
  icon_name TEXT, -- Nome do ícone (ex: 'trophy', 'star', 'fire')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir conquistas padrão
INSERT INTO achievement_templates (achievement_type, achievement_name, achievement_description, points_earned, icon_name) VALUES
  ('first_meal', 'Primeiro Passo', 'Marcou sua primeira refeição!', 10, 'star'),
  ('day_complete', 'Dia Completo', 'Completou todas as refeições do dia!', 50, 'check-circle'),
  ('week_complete', 'Semana Perfeita', 'Completou todos os dias da semana!', 200, 'trophy'),
  ('streak_3', 'Em Chamas', '3 dias seguidos completando a dieta!', 100, 'flame'),
  ('streak_7', 'Semana de Ferro', '7 dias seguidos completando a dieta!', 300, 'flame'),
  ('streak_30', 'Mês de Aço', '30 dias seguidos completando a dieta!', 1000, 'flame'),
  ('perfect_day', 'Dia Perfeito', '100% das calorias e macros atingidos!', 75, 'award'),
  ('month_complete', 'Mês Completo', 'Completou todos os dias do mês!', 500, 'medal')
ON CONFLICT (achievement_type) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_diet_consumption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_diet_daily_consumption_updated_at
BEFORE UPDATE ON diet_daily_consumption
FOR EACH ROW
EXECUTE FUNCTION update_diet_consumption_updated_at();

CREATE TRIGGER trigger_update_patient_points_updated_at
BEFORE UPDATE ON patient_points
FOR EACH ROW
EXECUTE FUNCTION update_diet_consumption_updated_at();

-- 6. DESAFIOS DIÁRIOS (METAS)
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_key TEXT NOT NULL UNIQUE, -- 'hidratacao', 'sono_qualidade', etc
  challenge_name TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  emoji TEXT,
  icon_name TEXT, -- Nome do ícone lucide-react
  points_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. REGISTRO DE DESAFIOS COMPLETADOS
CREATE TABLE IF NOT EXISTS patient_daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  challenge_key TEXT NOT NULL,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- Notas opcionais sobre a conclusão
  
  CONSTRAINT unique_patient_challenge_per_day UNIQUE (patient_id, challenge_key, completion_date)
);

CREATE INDEX IF NOT EXISTS idx_patient_daily_challenges_patient_id ON patient_daily_challenges(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_daily_challenges_date ON patient_daily_challenges(completion_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_key ON daily_challenges(challenge_key);

-- Inserir desafios padrão
INSERT INTO daily_challenges (challenge_key, challenge_name, challenge_description, emoji, icon_name, points_earned) VALUES
  ('hidratacao', 'Hidratação', 'Beba 2,5 litros de água no dia', '💧', 'Droplets', 100),
  ('sono_qualidade', 'Sono de Qualidade', 'Durma pelo menos 6 horas', '😴', 'Moon', 50),
  ('evitar_ultraprocessados', 'Evite Ultraprocessados', 'Passe o dia todo sem consumir alimentos ultraprocessados (biscoitos, embutidos, salgadinhos etc)', '🚫', 'ShieldX', 50),
  ('dormir_sem_celular', 'Dormir sem Celular', 'Evitar celular por pelo menos 1 hora antes de dormir', '📵', 'Smartphone', 50),
  ('atividade_fisica', 'Atividade Física', 'Pratique pelo menos 30 minutos de exercício no dia', '🏋️‍♀️', 'Dumbbell', 100),
  ('seguiu_dieta', 'Siga a Dieta', 'Siga seu plano alimentar corretamente no dia (sem comer a mais nem a menos)', '🥗', 'UtensilsCrossed', 100),
  ('registro_visual', 'Registro Visual', 'Tire uma foto de alguma refeição ou do treino e marque nos Stories do Instagram @fabriciomourateam', '📸', 'Camera', 50),
  ('organizar_refeicoes', 'Organize suas refeições do dia seguinte', 'Planejar ou separar o que vai comer no dia seguinte (pode incluir marmitas, lanches, frutas etc.)', '📋', 'CalendarCheck', 50)
ON CONFLICT (challenge_key) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_daily_challenges_updated_at
BEFORE UPDATE ON daily_challenges
FOR EACH ROW
EXECUTE FUNCTION update_diet_consumption_updated_at();

-- Comentários
COMMENT ON TABLE diet_daily_consumption IS 'Rastreamento diário de consumo de dieta por paciente';
COMMENT ON TABLE patient_points IS 'Sistema de pontos e gamificação por paciente';
COMMENT ON TABLE patient_points_history IS 'Histórico de pontos ganhos para gráficos';
COMMENT ON TABLE patient_achievements IS 'Conquistas desbloqueadas pelos pacientes';
COMMENT ON TABLE achievement_templates IS 'Templates de conquistas disponíveis';
COMMENT ON TABLE daily_challenges IS 'Desafios diários disponíveis para pacientes';
COMMENT ON TABLE patient_daily_challenges IS 'Registro de desafios completados pelos pacientes';

