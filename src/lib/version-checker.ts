// Sistema de detecção de versão para forçar atualização quando há nova versão

const VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'app_version_last_check';
const CHECK_INTERVAL = 5 * 60 * 1000; // Verificar a cada 5 minutos

// Versão atual do app (será atualizada automaticamente no build)
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || Date.now().toString();

/**
 * Verifica se há uma nova versão disponível
 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    // Verificar se já checou recentemente
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    if (lastCheck && Date.now() - parseInt(lastCheck) < CHECK_INTERVAL) {
      return false;
    }

    // Buscar versão do servidor (arquivo version.json)
    const response = await fetch('/version.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.log('Arquivo version.json não encontrado');
      return false;
    }

    const data = await response.json();
    const serverVersion = data.version;
    const storedVersion = localStorage.getItem(VERSION_KEY);

    // Atualizar timestamp da última verificação
    localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());

    // Se não tem versão armazenada, salvar a atual
    if (!storedVersion) {
      localStorage.setItem(VERSION_KEY, serverVersion);
      return false;
    }

    // Se versão mudou, há atualização disponível
    if (storedVersion !== serverVersion) {
      console.log(`Nova versão disponível: ${serverVersion} (atual: ${storedVersion})`);
      return true;
    }

    return false;
  } catch (error) {
    console.warn('Erro ao verificar atualizações:', error);
    return false;
  }
}

/**
 * Força atualização da página (hard refresh)
 */
export function forceUpdate(): void {
  // Limpar cache do service worker se existir
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }

  // Limpar caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }

  // Atualizar versão armazenada antes de recarregar
  fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
    .then(res => res.json())
    .then(data => {
      localStorage.setItem(VERSION_KEY, data.version);
    })
    .finally(() => {
      // Hard refresh
      window.location.reload();
    });
}

/**
 * Inicia verificação periódica de atualizações
 */
export function startVersionChecker(onUpdateAvailable: () => void): () => void {
  // Verificar imediatamente
  checkForUpdates().then(hasUpdate => {
    if (hasUpdate) onUpdateAvailable();
  });

  // Verificar periodicamente
  const interval = setInterval(async () => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) onUpdateAvailable();
  }, CHECK_INTERVAL);

  // Verificar quando a janela ganha foco
  const handleFocus = async () => {
    const hasUpdate = await checkForUpdates();
    if (hasUpdate) onUpdateAvailable();
  };
  window.addEventListener('focus', handleFocus);

  // Retornar função de cleanup
  return () => {
    clearInterval(interval);
    window.removeEventListener('focus', handleFocus);
  };
}
