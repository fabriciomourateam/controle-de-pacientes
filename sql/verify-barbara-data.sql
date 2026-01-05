-- ============================================
-- VERIFICAR DADOS DA BARBARA NO BANCO
-- ============================================

-- 1. Ver todos os dados da Barbara
SELECT 
  id,
  nome,
  telefone,
  LENGTH(telefone) as tamanho_telefone,
  peso_inicial,
  altura_inicial,
  medida_cintura_inicial,
  medida_quadril_inicial,
  foto_inicial_frente,
  foto_inicial_lado,
  foto_inicial_lado_2,
  foto_inicial_costas,
  data_fotos_iniciais,
  data_nascimento,
  user_id,
  created_at,
  updated_at
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone LIKE '%5511989330147%'
   OR telefone LIKE '%11989330147%'
ORDER BY updated_at DESC;

-- 2. Verificar se há dados iniciais salvos
SELECT 
  'Dados iniciais salvos?' as info,
  CASE 
    WHEN peso_inicial IS NOT NULL THEN '✅ Sim - Peso: ' || peso_inicial::text
    ELSE '❌ Não'
  END as peso,
  CASE 
    WHEN altura_inicial IS NOT NULL THEN '✅ Sim - Altura: ' || altura_inicial::text
    ELSE '❌ Não'
  END as altura,
  CASE 
    WHEN medida_cintura_inicial IS NOT NULL THEN '✅ Sim - Cintura: ' || medida_cintura_inicial::text
    ELSE '❌ Não'
  END as cintura,
  CASE 
    WHEN medida_quadril_inicial IS NOT NULL THEN '✅ Sim - Quadril: ' || medida_quadril_inicial::text
    ELSE '❌ Não'
  END as quadril,
  CASE 
    WHEN data_fotos_iniciais IS NOT NULL THEN '✅ Sim - Data: ' || data_fotos_iniciais::text
    ELSE '❌ Não'
  END as data_fotos
FROM patients
WHERE nome ILIKE '%Barbara%Zara%Lamonica%'
   OR telefone LIKE '%5511989330147%';
