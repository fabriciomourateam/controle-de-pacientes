export const config = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  
  // URLs do proxy baseado no ambiente
  proxyUrl: import.meta.env.PROD 
    ? 'https://seu-dominio.com/api/notion-proxy'  // Substitua pela sua URL de produção
    : 'http://localhost:3001/api/notion-proxy',
  
  // Configurações do Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
};

// Função para obter URL do proxy dinamicamente
export function getProxyUrl(): string {
  // Se estiver em produção e a URL estiver configurada
  if (config.isProduction && config.proxyUrl.includes('seu-dominio.com')) {
    console.warn('⚠️ URL do proxy de produção não configurada, usando localhost');
    return 'http://localhost:3001/api/notion-proxy';
  }
  
  return config.proxyUrl;
}

// Função para verificar se o proxy está disponível
export async function checkProxyHealth(): Promise<boolean> {
  try {
    const response = await fetch(getProxyUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true })
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Proxy não está disponível:', error);
    return false;
  }
}


