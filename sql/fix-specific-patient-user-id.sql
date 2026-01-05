-- ============================================
-- CORRIGIR user_id DO PACIENTE ESPECÍFICO
-- ============================================

-- 1. Ver dados do paciente antes da correção
SELECT 
  'ANTES da correção' as status,
  id,
  nome,
  telefone,
  user_id as user_id_atual,
  auth.uid() as user_id_correto
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone = '5511989330147';

-- 2. Verificar qual user_id deveria ter (seu user_id)
SELECT 
  'User ID correto' as info,
  'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid as seu_user_id,
  auth.uid() as usuario_logado_atual;

-- 3. Atualizar o user_id do paciente para o correto
-- Opção A: Usar seu user_id específico
UPDATE patients 
SET user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid
WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147')
  AND user_id != 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid;

-- Opção B: Usar o usuário logado atual (descomente se preferir)
-- UPDATE patients 
-- SET user_id = auth.uid()
-- WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147')
--   AND user_id != auth.uid();

-- 4. Verificar dados após correção
SELECT 
  'DEPOIS da correção' as status,
  id,
  nome,
  telefone,
  user_id as user_id_atual,
  CASE 
    WHEN user_id = 'a9798432-60bd-4ac8-a035-d139a47ad59b'::uuid THEN '✅ Corrigido!'
    WHEN user_id = auth.uid() THEN '✅ Corrigido (usando auth.uid())!'
    ELSE '❌ Ainda incorreto'
  END as status_correcao
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone = '5511989330147';

-- 5. Testar se agora consegue acessar
SELECT 
  'Teste de acesso' as info,
  COUNT(*) as pacientes_visiveis
FROM patients
WHERE (nome ILIKE '%Barbara%Zara%Lamonica%' OR telefone = '5511989330147')
  AND (
    user_id = auth.uid()
    OR
    (get_member_owner_id() IS NOT NULL AND user_id = get_member_owner_id())
    OR
    user_id IS NULL
  );
