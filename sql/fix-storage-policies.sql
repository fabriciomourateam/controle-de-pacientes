-- Corrigir políticas de storage para upload de avatar
-- Execute este SQL se já executou o create-user-profiles-table.sql

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can upload own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;

-- Criar políticas corrigidas
CREATE POLICY "Users can upload own profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Profile images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' 
    AND auth.uid() IS NOT NULL
  );

-- Verificar se o bucket existe e está configurado corretamente
UPDATE storage.buckets 
SET public = true 
WHERE id = 'profile-images';

-- Se o bucket não existir, criar
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;
