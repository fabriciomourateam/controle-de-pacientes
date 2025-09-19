import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  id?: string;
  user_id: string;
  filters?: any;
  sorting?: any;
  visible_columns?: string[];
  page_size?: number;
  read_notifications?: string[];
  created_at?: string;
  updated_at?: string;
}

class UserPreferencesService {
  // Gerar um ID único do usuário baseado no navegador/sessão
  private getUserId(): string {
    let userId = localStorage.getItem('user_session_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_session_id', userId);
    }
    return userId;
  }

  // Buscar preferências do usuário
  async getUserPreferences(): Promise<UserPreferences | null> {
    const userId = this.getUserId();
    console.log('Buscando preferências para usuário:', userId);
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Não encontrado - isso é normal para novos usuários
          console.log('Preferências não encontradas para novo usuário:', userId);
          return null;
        }
        console.error('Erro ao buscar preferências:', error);
        throw error;
      }

      console.log('Preferências carregadas:', data);
      return data;
    } catch (error) {
      console.error('Erro na consulta de preferências:', error);
      return null;
    }
  }

  // Criar ou atualizar preferências
  async upsertUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    const userId = this.getUserId();
    console.log('Salvando preferências para usuário:', userId, preferences);
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar preferências:', error);
        throw error;
      }

      console.log('Preferências salvas com sucesso:', data);
      return data;
    } catch (error) {
      console.error('Erro na operação upsert:', error);
      return null;
    }
  }

  // Buscar notificações lidas
  async getReadNotifications(): Promise<string[]> {
    const preferences = await this.getUserPreferences();
    return preferences?.read_notifications || [];
  }

  // Marcar notificação como lida
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const currentReadNotifications = await this.getReadNotifications();
      
      if (currentReadNotifications.includes(notificationId)) {
        return true; // Já está marcada como lida
      }

      const updatedReadNotifications = [...currentReadNotifications, notificationId];
      
      const result = await this.upsertUserPreferences({
        read_notifications: updatedReadNotifications
      });

      return result !== null;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }

  // Marcar múltiplas notificações como lidas
  async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      const currentReadNotifications = await this.getReadNotifications();
      
      const newNotifications = notificationIds.filter(id => !currentReadNotifications.includes(id));
      
      if (newNotifications.length === 0) {
        return true; // Todas já estão marcadas como lidas
      }

      const updatedReadNotifications = [...currentReadNotifications, ...newNotifications];
      
      const result = await this.upsertUserPreferences({
        read_notifications: updatedReadNotifications
      });

      return result !== null;
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
      return false;
    }
  }

  // Limpar notificações antigas (opcional - para manter a base limpa)
  async cleanOldNotifications(daysToKeep: number = 30): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences?.read_notifications) return true;

      // Esta é uma limpeza simples - em um cenário real, você poderia 
      // filtrar baseado na data das notificações
      const result = await this.upsertUserPreferences({
        read_notifications: []
      });

      return result !== null;
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
      return false;
    }
  }
}

export const userPreferencesService = new UserPreferencesService();