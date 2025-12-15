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

// Interfaces para preferências de pacientes
export interface PatientViewPreferences {
  user_id: string;
  filters: {
    search?: string;
    status?: string;
    plan?: string;
    dateRange?: { start: string; end: string };
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  visible_columns: string[];
  column_order?: string[]; // Ordem das colunas
  page_size: number;
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
      // Primeiro tenta buscar sem .single() para ver se a tabela existe
      const { data: allData, error: listError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId);

      if (listError) {
        console.error('Erro na consulta da tabela user_preferences:', listError);
        throw listError;
      }

      console.log('Resultado da consulta (array):', allData);

      if (!allData || allData.length === 0) {
        console.log('Preferências não encontradas para novo usuário:', userId);
        return null;
      }

      const data = allData[0]; // Pega o primeiro resultado
      console.log('Preferências carregadas:', data);
      return data;
    } catch (error) {
      console.error('Erro na consulta de preferências:', error);
      return null;
    }
  }

  // Método com fallback para problemas de schema cache
  async upsertUserPreferencesWithFallback(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    console.log('Tentando salvar com fallback...', preferences);
    
    // Se tiver read_notifications, tentar salvar no campo filters diretamente para evitar erro
    if (preferences.read_notifications) {
      console.log('Usando fallback direto em filters para read_notifications...');
      
      const currentPrefs = await this.getUserPreferences();
      const updatedFilters = {
        ...(currentPrefs?.filters || {}),
        read_notifications: preferences.read_notifications
      };
      
      return await this.upsertUserPreferences({
        filters: updatedFilters
      });
    }
    
    // Para outros campos, usar método normal
    return await this.upsertUserPreferences(preferences);
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
        
        // Se o erro for por coluna não encontrada, tentar criar apenas com campos básicos
        if (error.code === 'PGRST204' && error.message.includes('read_notifications')) {
          console.warn('Coluna read_notifications não encontrada. Execute o SQL para adicionar a coluna.');
          console.warn('SQL necessário: ALTER TABLE user_preferences ADD COLUMN read_notifications JSONB DEFAULT \'[]\';');
          return null;
        }
        
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
    try {
      const preferences = await this.getUserPreferences();
      
      // Tentar primeiro o campo read_notifications, depois usar fallback no filters
      let readNotifications: string[] = [];
      
      if (preferences?.read_notifications) {
        readNotifications = preferences.read_notifications;
      } else if (preferences?.filters?.read_notifications) {
        readNotifications = preferences.filters.read_notifications;
      }
      
      return readNotifications;
    } catch (error) {
      // Silenciar erros de notificações para evitar poluição do console
      return [];
    }
  }

  // Marcar notificação como lida
  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const currentReadNotifications = await this.getReadNotifications();
      
      if (currentReadNotifications.includes(notificationId)) {
        return true; // Já está marcada como lida
      }

      const updatedReadNotifications = [...currentReadNotifications, notificationId];
      
      // Tentar salvar no campo dedicado primeiro, depois usar fallback
      let result = await this.upsertUserPreferencesWithFallback({
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
      
      const result = await this.upsertUserPreferencesWithFallback({
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

  // Funções específicas para preferências de pacientes
  getDefaultPreferences(): PatientViewPreferences {
    return {
      user_id: '',
      filters: {
        search: undefined,
        status: undefined,
        plan: undefined,
        dateRange: undefined
      },
      sorting: {
        field: 'created_at',
        direction: 'desc'
      },
      visible_columns: ['nome', 'apelido', 'telefone', 'email', 'plano', 'data_vencimento', 'status', 'created_at'],
      page_size: 20
    };
  }

  async getPatientPreferences(userId: string): Promise<PatientViewPreferences | null> {
    try {
      const preferences = await this.getUserPreferences();
      if (!preferences) return null;

      return {
        user_id: userId,
        filters: preferences.filters?.patientFilters || this.getDefaultPreferences().filters,
        sorting: preferences.sorting || this.getDefaultPreferences().sorting,
        visible_columns: preferences.visible_columns || this.getDefaultPreferences().visible_columns,
        page_size: preferences.page_size || this.getDefaultPreferences().page_size
      };
    } catch (error) {
      console.error('Erro ao buscar preferências de pacientes:', error);
      return null;
    }
  }

  async savePatientPreferences(preferences: PatientViewPreferences): Promise<PatientViewPreferences> {
    try {
      const currentPrefs = await this.getUserPreferences();
      
      const updatedPrefs = await this.upsertUserPreferences({
        filters: {
          ...(currentPrefs?.filters || {}),
          patientFilters: preferences.filters
        },
        sorting: preferences.sorting,
        visible_columns: preferences.visible_columns,
        page_size: preferences.page_size
      });

      if (!updatedPrefs) {
        console.warn('Não foi possível salvar preferências no banco, usando apenas localmente');
        return preferences; // Retornar preferências mesmo sem salvar
      }

      return preferences;
    } catch (error) {
      console.warn('Erro ao salvar preferências de pacientes (continuando com preferências locais):', error);
      return preferences; // Retornar preferências mesmo com erro
    }
  }
}

export const userPreferencesService = new UserPreferencesService();
