-- =====================================================
-- SISTEMA DE REUNIÕES E ACOMPANHAMENTO DIÁRIO DA EQUIPE
-- =====================================================

-- Tabela de Reuniões
CREATE TABLE IF NOT EXISTS team_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('daily', 'weekly', 'biweekly', 'monthly')),
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  participants TEXT[], -- Array de IDs dos participantes
  topics TEXT[], -- Tópicos discutidos
  decisions TEXT[], -- Decisões tomadas
  action_items JSONB, -- [{task: string, responsible: string, deadline: date}]
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Acompanhamento Diário (Daily Standup)
CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id),
  report_date DATE NOT NULL,
  tasks_completed TEXT NOT NULL, -- Demandas feitas hoje
  tasks_planned TEXT NOT NULL, -- Demandas que serão feitas amanhã
  blockers TEXT, -- Dúvidas e dificuldades
  observations TEXT, -- Observações
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'bad', 'terrible')), -- Humor do dia
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id, report_date)
);

-- Tabela de Itens de Ação (Action Items)
CREATE TABLE IF NOT EXISTS action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES team_meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_team_meetings_owner ON team_meetings(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_meetings_date ON team_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_team_meetings_type ON team_meetings(meeting_type);

CREATE INDEX IF NOT EXISTS idx_daily_reports_owner ON daily_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_member ON daily_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

CREATE INDEX IF NOT EXISTS idx_action_items_owner ON action_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_action_items_assigned ON action_items(assigned_to);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);
CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE team_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

-- Policies para team_meetings
CREATE POLICY "Owners can view their meetings"
  ON team_meetings FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.owner_id = team_meetings.owner_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert meetings"
  ON team_meetings FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their meetings"
  ON team_meetings FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their meetings"
  ON team_meetings FOR DELETE
  USING (owner_id = auth.uid());

-- Policies para daily_reports
CREATE POLICY "Users can view reports from their team"
  ON daily_reports FOR SELECT
  USING (
    owner_id = auth.uid() OR
    member_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.owner_id = daily_reports.owner_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert their reports"
  ON daily_reports FOR INSERT
  WITH CHECK (
    member_id = auth.uid() AND (
      owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.owner_id = daily_reports.owner_id
        AND team_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own reports"
  ON daily_reports FOR UPDATE
  USING (member_id = auth.uid());

CREATE POLICY "Owners can delete reports"
  ON daily_reports FOR DELETE
  USING (owner_id = auth.uid());

-- Policies para action_items
CREATE POLICY "Users can view action items from their team"
  ON action_items FOR SELECT
  USING (
    owner_id = auth.uid() OR
    assigned_to = auth.uid() OR
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.owner_id = action_items.owner_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and team members can insert action items"
  ON action_items FOR INSERT
  WITH CHECK (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.owner_id = action_items.owner_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and assigned users can update action items"
  ON action_items FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    assigned_to = auth.uid()
  );

CREATE POLICY "Owners can delete action items"
  ON action_items FOR DELETE
  USING (owner_id = auth.uid());

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_meetings_updated_at
  BEFORE UPDATE ON team_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_reports_updated_at
  BEFORE UPDATE ON daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON action_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
