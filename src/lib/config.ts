export const config = {
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
  
  // URLs do proxy baseado no ambiente
  proxyUrl: import.meta.env.PROD 
    ? 'https://painel-fmteam.vercel.app/api/notion-proxy'
    : 'http://localhost:3001/api/notion-proxy',
  
  // Credenciais padrão do Notion (usadas em dev e prod)
  notion: {
    apiKey: import.meta.env.VITE_NOTION_API_KEY || 'ntn_E50356294261kVEmTcoS17ZLs24AVhXystP6D6Th84L8Yb',
    databaseId: import.meta.env.VITE_NOTION_DATABASE_ID || '631cf85b608d4c1693b772bfe0822f64'
  },
  
  // Configurações do Supabase
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
};

// Função para obter URL do proxy dinamicamente
export function getProxyUrl(): string {
  // Se estiver em produção e a URL estiver configurada
  if (config.isProduction && config.proxyUrl.includes('painel-fmteam.vercel.app')) {
    console.log('✅ Usando proxy de produção:', config.proxyUrl);
    return config.proxyUrl;
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



