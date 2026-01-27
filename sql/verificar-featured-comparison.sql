-- ============================================
-- VERIFICAÇÃO: Comparação Destacada Antes/Depois
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Copie e cole cada bloco separadamente

-- ============================================
-- 1. VER TODAS AS COMPARAÇÕES CADASTRADAS
-- ============================================
SELECT 
  id,
  telefone,
  title,
  description,
  is_visible,
  before_photo_date,
  after_photo_date,
  before_weight,
  after_weight,
  created_at,
  updated_at
FROM featured_photo_comparison
ORDER BY created_at DESC;

-- INTERPRETAÇÃO:
-- - Se retornar VAZIO (0 linhas): Nenhuma comparação foi criada ainda
-- - Se retornar dados: Veja o campo "is_visible"
--   * is_visible = true: Comparação deve aparecer no público
--   * is_visible = false: Comparação está oculta

-- ============================================
-- 2. VER APENAS COMPARAÇÕES VISÍVEIS
-- ============================================
SELECT 
  id,
  telefone,
  title,
  is_visible,
  before_photo_date,
  after_photo_date
FROM featured_photo_comparison
WHERE is_visible = true
ORDER BY created_at DESC;

-- INTERPRETAÇÃO:
-- - Se retornar VAZIO: Nenhuma comparação visível (todas ocultas ou não existem)
-- - Se retornar dados: Essas comparações DEVEM aparecer no portal público

-- ============================================
-- 3. VERIFICAR COMPARAÇÃO DE UM TELEFONE ESPECÍFICO
-- ============================================
-- ⚠️ IMPORTANTE: SUBSTITUA '5511999999999' pelo telefone do paciente
SELECT 
  id,
  telefone,
  title,
  description,
  is_visible,
  before_photo_url,
  after_photo_url,
  before_photo_date,
  after_photo_date,
  before_weight,
  after_weight,
  created_at,
  updated_at
FROM featured_photo_comparison
WHERE telefone = '5511999999999';

-- INTERPRETAÇÃO:
-- - Se retornar VAZIO: Esse paciente não tem comparação criada
--   → Solução: Criar usando botão "Criar Antes/Depois" no PatientPortal
-- - Se retornar 1 linha com is_visible = false: Comparação existe mas está oculta
--   → Solução: Execute o UPDATE do bloco 4
-- - Se retornar 1 linha com is_visible = true: Comparação existe e está visível
--   → Solução: Verificar logs do navegador (F12)

-- ============================================
-- 4. TORNAR COMPARAÇÃO VISÍVEL
-- ============================================
-- ⚠️ IMPORTANTE: SUBSTITUA '5511999999999' pelo telefone do paciente
-- Execute este UPDATE se a comparação existe mas is_visible = false
UPDATE featured_photo_comparison
SET is_visible = true
WHERE telefone = '5511999999999';

-- RESULTADO ESPERADO:
-- "UPDATE 1" = Comparação foi atualizada com sucesso
-- "UPDATE 0" = Nenhuma comparação encontrada para esse telefone

-- ============================================
-- 5. VERIFICAR URLs DAS FOTOS
-- ============================================
SELECT 
  telefone,
  title,
  is_visible,
  before_photo_url,
  after_photo_url,
  LENGTH(before_photo_url) as before_url_length,
  LENGTH(after_photo_url) as after_url_length
FROM featured_photo_comparison;

-- INTERPRETAÇÃO:
-- - before_url_length e after_url_length devem ser > 0
-- - URLs devem começar com "https://" ou "http://"
-- - Se URLs estiverem vazias ou inválidas: Deletar e criar novamente

-- ============================================
-- 6. DELETAR COMPARAÇÃO (para criar novamente)
-- ============================================
-- ⚠️ IMPORTANTE: SUBSTITUA '5511999999999' pelo telefone do paciente
-- Use este comando se quiser deletar e criar uma nova comparação
DELETE FROM featured_photo_comparison
WHERE telefone = '5511999999999';

-- RESULTADO ESPERADO:
-- "DELETE 1" = Comparação foi deletada com sucesso
-- "DELETE 0" = Nenhuma comparação encontrada para esse telefone

-- ============================================
-- 7. VERIFICAR POLICIES (RLS)
-- ============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'featured_photo_comparison';

-- INTERPRETAÇÃO:
-- Deve ter pelo menos estas policies:
-- - "Service role can access all" (para acesso público)
-- - "Users can view own featured comparison" (para usuários autenticados)
-- - "Users can manage own featured comparison" (para criar/editar)

-- ============================================
-- 8. CRIAR POLICY SE NÃO EXISTIR
-- ============================================
-- Execute este bloco se a policy "Service role can access all" não existir
CREATE POLICY IF NOT EXISTS "Service role can access all"
  ON featured_photo_comparison
  FOR SELECT
  USING (true);

-- ============================================
-- 9. ESTATÍSTICAS GERAIS
-- ============================================
SELECT 
  COUNT(*) as total_comparacoes,
  COUNT(*) FILTER (WHERE is_visible = true) as visiveis,
  COUNT(*) FILTER (WHERE is_visible = false) as ocultas,
  MIN(created_at) as primeira_criacao,
  MAX(created_at) as ultima_criacao
FROM featured_photo_comparison;

-- INTERPRETAÇÃO:
-- - total_comparacoes: Quantas comparações existem no total
-- - visiveis: Quantas estão visíveis no portal público
-- - ocultas: Quantas estão ocultas
-- - primeira_criacao: Data da primeira comparação criada
-- - ultima_criacao: Data da última comparação criada

-- ============================================
-- 10. VERIFICAR TABELA EXISTE
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'featured_photo_comparison'
) as tabela_existe;

-- INTERPRETAÇÃO:
-- - true: Tabela existe
-- - false: Tabela NÃO existe (precisa executar create-featured-comparison-table.sql)

-- ============================================
-- RESUMO DOS COMANDOS MAIS USADOS
-- ============================================

-- Ver comparação de um paciente específico:
-- SELECT * FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE';

-- Tornar comparação visível:
-- UPDATE featured_photo_comparison SET is_visible = true WHERE telefone = 'SEU_TELEFONE';

-- Deletar comparação:
-- DELETE FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE';

-- Ver todas as comparações:
-- SELECT telefone, title, is_visible, created_at FROM featured_photo_comparison ORDER BY created_at DESC;
