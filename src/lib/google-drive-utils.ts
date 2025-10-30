/**
 * Converte URL do Google Drive para formato de visualização direta
 * 
 * Formatos aceitos:
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/uc?id=FILE_ID
 * 
 * Para imagens: https://lh3.googleusercontent.com/d/FILE_ID
 * Para vídeos: https://drive.google.com/uc?export=download&id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string | null, isVideo: boolean = false): string | null {
  if (!url) return null;
  
  // Se não for URL do Google Drive, retorna como está
  if (!url.includes('drive.google.com')) {
    return url;
  }

  try {
    // Extrair o ID do arquivo de diferentes formatos
    let fileId: string | null = null;

    // Formato: https://drive.google.com/open?id=FILE_ID
    if (url.includes('open?id=')) {
      const match = url.match(/open\?id=([^&]+)/);
      fileId = match ? match[1] : null;
    }
    
    // Formato: https://drive.google.com/file/d/FILE_ID/view
    else if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^/]+)/);
      fileId = match ? match[1] : null;
    }
    
    // Formato: https://drive.google.com/uc?id=FILE_ID
    else if (url.includes('uc?id=')) {
      const match = url.match(/uc\?id=([^&]+)/);
      fileId = match ? match[1] : null;
    }

    // Se encontrou o ID, retorna URL apropriada
    if (fileId) {
      // Para vídeos, usar formato de download direto
      if (isVideo) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
      // Para imagens, usar googleusercontent
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Se não conseguiu extrair, retorna a URL original
    return url;
  } catch (error) {
    console.error('Erro ao converter URL do Google Drive:', error);
    return url;
  }
}

/**
 * Verifica se uma URL é do Google Drive
 */
export function isGoogleDriveUrl(url: string | null): boolean {
  if (!url) return false;
  return url.includes('drive.google.com');
}
