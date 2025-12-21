// Service Worker para PWA
const CACHE_NAME = 'controle-pacientes-v5'; // Incrementar versão para forçar atualização
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
      .catch(() => {
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
