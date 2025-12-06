/**
 * Configuração da integração com Kiwify
 * 
 * Configure as variáveis de ambiente no arquivo .env.local:
 * 
 * VITE_KIWIFY_CHECKOUT_BASIC=https://pay.kiwify.com.br/SEU_CHECKOUT_BASIC
 * VITE_KIWIFY_CHECKOUT_SILVER=https://pay.kiwify.com.br/SEU_CHECKOUT_SILVER
 * VITE_KIWIFY_CHECKOUT_BLACK=https://pay.kiwify.com.br/SEU_CHECKOUT_BLACK
 * 
 * Para webhooks (opcional):
 * VITE_KIWIFY_CLIENT_ID=SEU_CLIENT_ID
 * VITE_KIWIFY_CLIENT_SECRET=SEU_CLIENT_SECRET
 * VITE_KIWIFY_ACCOUNT_ID=SEU_ACCOUNT_ID
 */

export const kiwifyConfig = {
  /**
   * URLs de checkout diretas da Kiwify
   * 
   * Os nomes dos planos devem corresponder aos valores na coluna 'name' 
   * da tabela 'subscription_plans' no banco de dados:
   * - 'basic' → Plano Basic (R$ 49,90)
   * - 'intermediate' → Plano Silver (R$ 89,90)
   * - 'advanced' → Plano Black (R$ 149,90)
   */
  checkoutUrls: {
    basic: import.meta.env.VITE_KIWIFY_CHECKOUT_BASIC || '',
    intermediate: import.meta.env.VITE_KIWIFY_CHECKOUT_SILVER || '',
    advanced: import.meta.env.VITE_KIWIFY_CHECKOUT_BLACK || '',
  },

  /**
   * Credenciais para webhooks/API (opcional)
   */
  credentials: {
    clientId: import.meta.env.VITE_KIWIFY_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_KIWIFY_CLIENT_SECRET || '',
    accountId: import.meta.env.VITE_KIWIFY_ACCOUNT_ID || '',
  },

  /**
   * Verificar se a configuração está completa
   */
  isConfigured(): boolean {
    const missingCheckouts = Object.entries(this.checkoutUrls)
      .filter(([_, url]) => !url)
      .map(([planName]) => planName);

    if (missingCheckouts.length > 0) {
      console.warn(
        `⚠️ URLs de checkout não configuradas para os planos: ${missingCheckouts.join(', ')}. ` +
        `Configure as variáveis VITE_KIWIFY_CHECKOUT_* no .env.local`
      );
      return false;
    }

    return true;
  },

  /**
   * Obter URL de checkout por nome do plano
   */
  getCheckoutUrl(planName: string): string | null {
    const url = this.checkoutUrls[planName as keyof typeof this.checkoutUrls];
    
    if (!url) {
      console.error(`❌ URL de checkout não encontrada para o plano: ${planName}`);
      return null;
    }

    return url;
  }
};

