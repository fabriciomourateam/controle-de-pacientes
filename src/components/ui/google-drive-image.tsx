import { useState } from 'react';

interface GoogleDriveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

/**
 * Componente para exibir imagens do Google Drive
 * Usa iframe como fallback quando a imagem direta falha por CORS
 */
export function GoogleDriveImage({ src, alt, className, onClick, onError }: GoogleDriveImageProps) {
  // Sempre usar iframe para Google Drive (mais confiável)
  const [useIframe, setUseIframe] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Extrair ID do Google Drive
  const getFileId = (url: string): string | null => {
    const patterns = [
      /open\?id=([^&]+)/,
      /\/file\/d\/([^/]+)/,
      /uc\?.*id=([^&]+)/,
      /\/d\/([^/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const fileId = getFileId(src);

  const handleImageError = () => {
    console.log('🔄 Imagem falhou, tentando iframe...', { src, fileId });
    setImageError(true);
    setUseIframe(true);
    if (onError) onError();
  };

  // Se não conseguiu extrair ID ou não é Google Drive, usar img normal
  if (!fileId || !src.includes('drive.google.com')) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onClick={onClick}
        onError={onError}
      />
    );
  }

  // Tentar carregar como imagem primeiro
  if (!useIframe) {
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    console.log('📸 Tentando carregar imagem:', { fileId, imageUrl });
    return (
      <img 
        src={imageUrl}
        alt={alt} 
        className={className}
        onClick={onClick}
        onError={handleImageError}
        loading="lazy"
      />
    );
  }

  // Fallback: usar iframe (funciona sempre, mas menos performático)
  return (
    <div 
      className={className} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
      }}
    >
      <iframe
        src={`https://drive.google.com/file/d/${fileId}/preview`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        allow="autoplay"
        title={alt}
      />
      {/* Botão de zoom sobre o iframe */}
      {onClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            console.log('🔍 Botão de zoom clicado!', { url: src, alt });
            onClick();
          }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Ampliar foto"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
      )}
    </div>
  );
}
