import { supabase } from '@/integrations/supabase/client';

interface PhotoMigrationResult {
  success: boolean;
  newUrl?: string;
  error?: string;
}

/**
 * Verifica se a URL é do Typebot (externa)
 */
export function isTypebotUrl(url: string | null): boolean {
  if (!url) return false;
  
  // URLs do Typebot geralmente contêm esses padrões
  const typebotPatterns = [
    'typebot.io',
    'typebot-uploads',
    's3.amazonaws.com',
    'storage.googleapis.com',
    'cloudinary.com',
    // Adicione outros padrões conforme necessário
  ];
  
  // Verifica se NÃO é do Supabase
  const isSupabase = url.includes(supabase.storage.url);
  
  return !isSupabase && typebotPatterns.some(pattern => url.includes(pattern));
}

/**
 * Faz download da foto da URL externa e upload para o Supabase Storage
 */
export async function migratePhotoToSupabase(
  photoUrl: string,
  telefone: string,
  checkinId: string,
  photoIndex: number
): Promise<PhotoMigrationResult> {
  try {
    console.log(`📸 Migrando foto ${photoIndex} do check-in ${checkinId}...`);
    
    // 1. Fazer download da foto
    const response = await fetch(photoUrl);
    if (!response.ok) {
      throw new Error(`Falha ao baixar foto: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // 2. Gerar nome único para o arquivo
    const fileExt = photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${telefone}_checkin_${checkinId}_foto${photoIndex}_${Date.now()}.${fileExt}`;
    const filePath = `patient-photos/${fileName}`;
    
    // 3. Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('patient-photos')
      .upload(filePath, blob, {
        contentType: blob.type,
        upsert: false
      });
    
    if (uploadError) {
      throw uploadError;
    }
    
    // 4. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('patient-photos')
      .getPublicUrl(filePath);
    
    console.log(`✅ Foto ${photoIndex} migrada com sucesso!`);
    console.log(`   URL antiga: ${photoUrl.substring(0, 50)}...`);
    console.log(`   URL nova: ${publicUrl}`);
    
    return {
      success: true,
      newUrl: publicUrl
    };
    
  } catch (error) {
    console.error(`❌ Erro ao migrar foto ${photoIndex}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Migra todas as fotos de um check-in
 */
export async function migrateCheckinPhotos(checkin: any): Promise<boolean> {
  const updates: any = {};
  let hasUpdates = false;
  
  // Verificar e migrar cada foto
  for (let i = 1; i <= 4; i++) {
    const photoField = `foto_${i}`;
    const photoUrl = checkin[photoField];
    
    if (photoUrl && isTypebotUrl(photoUrl)) {
      console.log(`🔄 Detectada foto ${i} do Typebot, iniciando migração...`);
      
      const result = await migratePhotoToSupabase(
        photoUrl,
        checkin.telefone,
        checkin.id,
        i
      );
      
      if (result.success && result.newUrl) {
        updates[photoField] = result.newUrl;
        hasUpdates = true;
      }
    }
  }
  
  // Se houver fotos migradas, atualizar o banco
  if (hasUpdates) {
    const { error } = await supabase
      .from('checkin')
      .update(updates)
      .eq('id', checkin.id);
    
    if (error) {
      console.error('❌ Erro ao atualizar URLs no banco:', error);
      return false;
    }
    
    console.log(`✅ Check-in ${checkin.id} atualizado com novas URLs`);
    return true;
  }
  
  return false;
}

/**
 * Migra fotos de múltiplos check-ins
 */
export async function migrateMultipleCheckins(checkins: any[]): Promise<number> {
  let migratedCount = 0;
  
  for (const checkin of checkins) {
    const migrated = await migrateCheckinPhotos(checkin);
    if (migrated) {
      migratedCount++;
    }
  }
  
  return migratedCount;
}

