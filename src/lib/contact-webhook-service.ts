import { getUserWebhookUrl } from './webhook-config-service';

/**
 * Serviço para enviar mensagens de áudio via webhook
 */
export const contactWebhookService = {
  /**
   * Envia uma mensagem de áudio para um paciente via webhook
   * @param telefone Número do telefone do paciente
   * @param nome Nome do paciente
   * @returns true se enviado com sucesso, false caso contrário
   */
  async sendContactMessage(telefone: string, nome: string): Promise<boolean> {
    try {
      // Buscar webhook configurado para o usuário atual
      let webhookUrl = await getUserWebhookUrl('contact');
      
      // Se não tiver webhook configurado, usar o padrão de produção
      if (!webhookUrl) {
        webhookUrl = 'https://n8n.shapepro.shop/webhook/enviarmsg';
      }

      // Preparar dados para enviar
      const payload = {
        telefone: telefone.replace(/\D/g, ''), // Remover formatação
        nome: nome,
        timestamp: new Date().toISOString(),
      };

      // Fazer requisição POST para o webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error('Erro ao chamar webhook:', response.status, response.statusText);
        return false;
      }

      const result = await response.json().catch(() => ({}));
      console.log('Webhook chamado com sucesso:', result);
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem via webhook:', error);
      return false;
    }
  },
};

