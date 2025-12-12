// Polyfill para @supabase/node-fetch usando fetch nativo do navegador
// Este polyfill permite que o Supabase funcione no navegador sem node-fetch

// Verificar se window está disponível
if (typeof window === 'undefined') {
  throw new Error('This polyfill requires a browser environment');
}

// Verificar se fetch está disponível
if (typeof window.fetch === 'undefined') {
  throw new Error('fetch is not available in this environment');
}

// Usar fetch nativo do navegador com proteção
const nativeFetch = window.fetch.bind(window);

// Exportar fetch
export const fetch = nativeFetch;
export default nativeFetch;

// Exportar Headers, Request e Response diretamente do window
// Com verificação de segurança para evitar erros de prototype
export const Headers = (typeof window !== 'undefined' && window.Headers) ? window.Headers : undefined;
export const Request = (typeof window !== 'undefined' && window.Request) ? window.Request : undefined;
export const Response = (typeof window !== 'undefined' && window.Response) ? window.Response : undefined;

