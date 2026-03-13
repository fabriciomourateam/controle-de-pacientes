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
 * Comprime e redimensiona uma imagem usando Canvas
 * @param file - Arquivo de imagem original (JPEG, PNG, WebP)
 * @param maxWidth - Largura máxima (padrão 1600px para manter nitidez)
 * @param quality - Qualidade da compressão (0-1), padrão 0.85
 * @returns Promise com o arquivo comprimido
 */
async function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionamento proporcional se maior que o limite
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // Fallback para original se falhar o contexto
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const originalName = file.name.split('.').slice(0, -1).join('.');
            const compressedFile = new File([blob], `${originalName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            console.log('📉 Imagem comprimida:', {
              nome: file.name,
              original: `${(file.size / 1024).toFixed(2)} KB`,
              comprimida: `${(compressedFile.size / 1024).toFixed(2)} KB`,
              dimensoes: `${width}x${height}`
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Converte um arquivo HEIC para JPEG
 */
export async function convertHeicToJpeg(
  heicFile: File,
  quality: number = 0.85
): Promise<File> {
  try {
    console.log('🔄 Convertendo HEIC para JPEG:', heicFile.name);
    
    const jpegBlob = await heic2any({
      blob: heicFile,
      toType: 'image/jpeg',
      quality: quality,
    });

    const blob = Array.isArray(jpegBlob) ? jpegBlob[0] : jpegBlob;
    const originalName = heicFile.name.replace(/\.heic$/i, '').replace(/\.heif$/i, '');
    const jpegFile = new File([blob], `${originalName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    // Após converter de HEIC, passamos pela compressão/redimensionamento padrão
    return await compressImage(jpegFile);
  } catch (error) {
    console.error('❌ Erro ao converter HEIC:', error);
    // Tenta retornar o original ou falhar graciosamente
    return heicFile;
  }
}

/**
 * Processa um arquivo de foto, comprimindo e convertendo se necessário.
 * Esta é a função principal que deve ser usada antes de cada upload.
 */
export async function processPhotoFile(
  file: File,
  quality: number = 0.85
): Promise<File> {
  try {
    // 1. Se for HEIC, converte para JPEG (que já chama compressImage internamente)
    if (isHeicFile(file)) {
      return await convertHeicToJpeg(file, quality);
    }
    
    // 2. Se for outra imagem, aplica compressão e redimensionamento
    if (file.type.startsWith('image/')) {
      return await compressImage(file, 1600, quality);
    }

    return file;
  } catch (e) {
    console.error('Erro no processamento da foto:', e);
    return file;
  }
}

/**
 * Processa múltiplos arquivos de foto em paralelo
 */
export async function processMultiplePhotoFiles(
  files: File[],
  quality: number = 0.85
): Promise<File[]> {
  return Promise.all(files.map(file => processPhotoFile(file, quality)));
}
