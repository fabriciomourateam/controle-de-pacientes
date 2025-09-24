-- Tabela para logs de sincronização do Notion
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'running')),
  details JSONB,
  sync_type TEXT DEFAULT 'manual' CHECK (sync_type IN ('manual', 'scheduled', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sync_logs_timestamp ON sync_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs(sync_type);

-- Comentários
COMMENT ON TABLE sync_logs IS 'Logs de sincronização do Notion com o Supabase';
COMMENT ON COLUMN sync_logs.timestamp IS 'Data e hora da sincronização';
COMMENT ON COLUMN sync_logs.status IS 'Status da sincronização: success, error, running';
COMMENT ON COLUMN sync_logs.details IS 'Detalhes da sincronização em formato JSON';
COMMENT ON COLUMN sync_logs.sync_type IS 'Tipo de sincronização: manual, scheduled, auto';

-- Verificar se a tabela foi criada
SELECT 
  'sync_logs table created successfully' as status,
  COUNT(*) as current_records
FROM sync_logs;
