import { useEffect, useState } from 'react';

/**
 * Hook para obter intervalo de refetch baseado na visibilidade da página
 * Retorna false se a página não está visível, ou o intervalo base caso contrário
 */
export function useRefetchInterval(baseInterval: number): number | false {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Se a página não está visível, não refetch
  if (!isVisible) {
    return false;
  }

  return baseInterval;
}

