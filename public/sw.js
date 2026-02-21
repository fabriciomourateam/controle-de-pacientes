// Service Worker para PWA
const CACHE_NAME = 'controle-pacientes-v6'; // Incrementar versão para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  // Forçar atualização imediata, não esperar pelo cache
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        // Não fazer cache de arquivos estáticos com hash - deixar o Vite gerenciar
        return cache.addAll(urlsToCache.filter(url => {
          // Não fazer cache de arquivos com hash (assets)
          return !url.includes('/assets/');
        }));
      })
      .catch((error) => {
        console.log('Erro ao abrir cache:', error);
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Não fazer cache de requisições de API, Supabase ou rotas do servidor do vite
  if (
    url.pathname.startsWith('/rest/v1/') ||
    url.pathname.startsWith('/auth/v1/') ||
    url.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return; // Deixar o navegador buscar normalmente
  }

  // Não fazer cache de arquivos com hash - sempre buscar do servidor
  if (event.request.url.includes('/assets/')) {
    return; // Deixar o navegador buscar normalmente
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('Service Worker Fetch Erro:', error);
        // Em caso de erro, buscar do servidor
        return fetch(event.request);
      })
  );
});

// Atualizar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // Forçar controle imediato de todas as páginas
        return self.clients.claim();
      });
    })
  );
});
