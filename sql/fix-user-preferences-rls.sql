-- ============================================================================
-- CORRIGIR RLS DE USER_PREFERENCES - VERSÃO COMPLETA
-- ============================================================================
-- Permitir que todos os usuários autenticados salvem suas preferências
-- ============================================================================

-- 1. Verificar se a tabela existe e criar se necessário
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_preferences') THEN
    RAISE NOTICE 'Tabela user_preferences não existe. Criando...';
    
    CREATE TABLE user_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    );
    
    -- Habilitar RLS
    ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Tabela user_preferences criada com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela user_preferences já existe.';
  END IF;
END $$;

-- 2. Remover TODAS as políticas antigas
DROP POLICY IF EXISTS "user_preferences_simple" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_all" ON user_preferences;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários autenticados podem ver suas preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir suas preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar suas preferências" ON user_preferences;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar suas preferências" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_select" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_update" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_delete" ON user_preferences;

-- 3. Criar UMA ÚNICA política permissiva para todos os usuários autenticados
CREATE POLICY "user_preferences_full_access"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (
    -- Permitir acesso se o user_id corresponde ao usuário autenticado
    -- Suporta tanto UUID direto quanto formato 'user_UUID'
    user_id = auth.uid()::text OR
    user_id = 'user_' || auth.uid()::text OR
    user_id = 'default_user' -- Permitir acesso ao usuário padrão temporário
  )
  WITH CHECK (
    -- Permitir criar/atualizar se o user_id corresponde ao usuário autenticado
    user_id = auth.uid()::text OR
    user_id = 'user_' || auth.uid()::text OR
    user_id = 'default_user' -- Permitir criar para usuário padrão temporário
  );

-- 4. Garantir que RLS está habilitado
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 6. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================================================
-- FIM
-- ============================================================================
