-- Verificar fotos do paciente específico
SELECT 
  id,
  nome,
  telefone,
  foto_inicial_frente,
  foto_inicial_lado,
  foto_inicial_lado_2,
  foto_inicial_costas,
  peso_inicial,
  altura_inicial,
  data_fotos_iniciais,
  created_at
FROM patients
WHERE telefone = '5511961752137';

-- Verificar check-ins com fotos
SELECT 
  id,
  data_checkin,
  peso,
  foto_1,
  foto_2,
  foto_3,
  foto_4,
  created_at
FROM checkin
WHERE telefone = '5511961752137'
ORDER BY data_checkin DESC;
