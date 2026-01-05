-- ============================================
-- CORRIGIR ESPAÇOS NO TELEFONE DO PACIENTE
-- ============================================

-- 1. Ver pacientes com espaços no telefone
SELECT 
  'Pacientes com espaços no telefone' as info,
  id,
  nome,
  telefone,
  LENGTH(telefone) as tamanho_antes,
  LENGTH(TRIM(telefone)) as tamanho_depois
FROM patients
WHERE telefone != TRIM(telefone);

-- 2. Corrigir o telefone da Barbara (remover espaços)
UPDATE patients 
SET telefone = TRIM(telefone)
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone LIKE '%5511989330147%';

-- 3. Corrigir TODOS os telefones com espaços (opcional, mas recomendado)
UPDATE patients 
SET telefone = TRIM(telefone)
WHERE telefone != TRIM(telefone);

-- 4. Verificar se foi corrigido
SELECT 
  'Após correção' as info,
  id,
  nome,
  telefone,
  LENGTH(telefone) as tamanho,
  telefone = '5511989330147' as telefone_correto
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone LIKE '%5511989330147%';

-- 5. Testar busca após correção
SELECT 
  'Teste de busca após correção' as info,
  COUNT(*) as encontrados
FROM patients
WHERE telefone = '5511989330147';
