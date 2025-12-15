-- ============================================
-- ADICIONAR COLUNA PERMISSIONS EM TEAM_MEMBERS
-- ============================================
-- A coluna permissions permite personalizar permissões
-- individuais de cada membro, sobrescrevendo o perfil base

-- Adicionar coluna permissions
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT NULL;

-- Adicionar comentário
COMMENT ON COLUMN team_members.permissions IS 'Permissões personalizadas do membro (sobrescreve o perfil base se definido)';

-- Verificar estrutura
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
AND column_name = 'permissions';

-- Sucesso!
SELECT 'Coluna permissions adicionada com sucesso!' as status;
