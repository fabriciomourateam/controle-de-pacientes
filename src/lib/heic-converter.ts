/**
 * Utilitário para conversão automática de fotos HEIC para JPEG
 * 
 * Este módulo intercepta uploads de fotos e converte automaticamente
 * arquivos HEIC (formato padrão do iPhone) para JPEG antes do upload.
 * 
 * A conversão é transparente - o sistema continua trabalhando com JPEG
 * como sempre trabalhou.
 */

import heic2any from 'heic2any';

/**
 * Verifica se um arquivo é do tipo HEIC
 */
export function isHeicFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  
  return (
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif') ||
    fileType === 'image/heic' ||
    fileType === 'image/heif'
  );
}

/**
 * Converte um arquivo HEIC para JPEG
 * 
 * @param heicFile - Arquivo HEIC original
 * @param quality - Qualidade da conversão JPEG (0-1), padrão 0.9
 * @returns Promise com o arquivo JPEG convertido
 */
export async function convertHeicToJpeg(
  heicFile: File,
  quality: number = 0.9
): Promise<File> {
  try {
    console.log('🔄 Convertendo HEIC para JPEG:', heicFile.name);
    
    // Converte HEIC para Blob JPEG
    const jpegBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: quality,
    });

    // heic2any pode retornar um array de blobs se a imagem tiver múltiplas páginas
    // Pegamos apenas o primeiro blob
    const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;

    // Cria um novo File a partir do Blob
    const originalName = heicFile.name.replace(/\.heic$/i, '').replace(/\.heif$/i, '');
    const jpegFile = new File([blob], `${originalName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log('✅ Conversão concluída:', {
      original: `${heicFile.name} (${(heicFile.size / 1024).toFixed(2)} KB)`,
      converted: `${jpegFile.name} (${(jpegFile.size / 1024).toFixed(2)} KB)`,
    });

    return jpegFile;
  } catch (error) {
    console.error('❌ Erro ao converter HEIC:', error);
    throw new Error('Falha ao converter imagem HEIC. Por favor, tente com outro formato.');
  }
}

/**
 * Processa um arquivo de foto, convertendo automaticamente se for HEIC
 * 
 * Esta é a função principal que deve ser usada antes de fazer upload.
 * Se o arquivo for HEIC, converte para JPEG automaticamente.
 * Se já for outro formato, retorna o arquivo original sem modificações.
 * 
 * @param file - Arquivo de foto original
 * @param quality - Qualidade da conversão JPEG (0-1), padrão 0.9
 * @returns Promise com o arquivo processado (convertido ou original)
 * 
 * @example
 * ```typescript
 * const processedFile = await processPhotoFile(selectedFile);
 * // Agora pode fazer upload do processedFile normalmente
 * await uploadToSupabase(processedFile);
 * ```
 */
export async function processPhotoFile(
  file: File,
  quality: number = 0.9
): Promise<File> {
  // Se for HEIC, converte para JPEG
  if (isHeicFile(file)) {
    return await convertHeicToJpeg(file, quality);
  }
  
  // Se não for HEIC, retorna o arquivo original sem modificações
  return file;
}

/**
 * Processa múltiplos arquivos de foto, convertendo HEIC automaticamente
 * 
 * @param files - Array de arquivos de foto
 * @param quality - Qualidade da conversão JPEG (0-1), padrão 0.9
 * @returns Promise com array de arquivos processados
 */
export async function processMultiplePhotoFiles(
  files: File[],
  quality: number = 0.9
): Promise<File[]> {
  const processedFiles: File[] = [];
  
  for (const file of files) {
    const processedFile = await processPhotoFile(file, quality);
    processedFiles.push(processedFile);
  }
  
  return processedFiles;
}
