-- Atualizar foreign key para usar telefone em ambas as tabelas
-- Primeiro, remover a constraint antiga se existir
ALTER TABLE checkin DROP CONSTRAINT IF EXISTS checkin_telefone_fkey;

-- Criar nova foreign key usando telefone em ambas as tabelas
ALTER TABLE checkin 
ADD CONSTRAINT checkin_telefone_fkey 
FOREIGN KEY (telefone) REFERENCES patients(telefone);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_checkin_telefone ON checkin(telefone);
CREATE INDEX IF NOT EXISTS idx_patients_telefone ON patients(telefone);

-- Verificar se a constraint foi criada corretamente
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='checkin';

