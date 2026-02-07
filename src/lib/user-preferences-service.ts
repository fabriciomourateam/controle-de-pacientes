import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from './auth-helpers';

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
  // Obter o ID do usuário autenticado do Supabase
  // Se não estiver autenticado, usa fallback para localStorage (compatibilidade)
  private async getUserId(): Promise<string> {
    const supabaseUserId = await getCurrentUserId();
    if (supabaseUserId) {
      return supabaseUserId;
    }
    
    // Fallback para desenvolvimento ou quando não há autenticação
    let userId = localStorage.getItem('user_session_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_session_id', userId);
    }
    return userId;
  }

  // Buscar preferências do usuário
  async getUserPreferences(): Promise<UserPreferences | null> {
    const supabaseUserId = await getCurrentUserId();
    const localStorageUserId = localStorage.getItem('user_session_id');
    
    console.log('🔍 [UserPreferences] Buscando preferências:', {
      supabaseUserId,
      localStorageUserId
    });
    
    try {
      // Primeiro tenta buscar com o user_id do Supabase (novo formato)
      if (supabaseUserId) {
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', supabaseUserId);

        if (!supabaseError && supabaseData && supabaseData.length > 0) {
          let prefs = supabaseData[0];
          const hasRenewals = prefs?.filters?.sent_renewals && prefs.filters.sent_renewals.length > 0;
          
          console.log('✅ [UserPreferences] Encontradas preferências com Supabase user_id:', {
            user_id: prefs.user_id,
            sent_renewals_count: prefs?.filters?.sent_renewals?.length || 0,
            sent_renewals: prefs?.filters?.sent_renewals || [],
            filters_keys: Object.keys(prefs?.filters || {}),
            hasRenewals
          });
          
          // Se não tem renovações, buscar em outras preferências do mesmo usuário
          if (!hasRenewals) {
            console.log('🔍 [UserPreferences] Nenhuma renovação encontrada, buscando em outras preferências...');
            
            // Buscar todas as preferências que tenham sent_renewals (pode ser de user_id antigo)
            const { data: allPrefsWithRenewals, error: searchError } = await supabase
              .from('user_preferences')
              .select('*')
              .not('filters->sent_renewals', 'is', null);
            
            if (!searchError && allPrefsWithRenewals && allPrefsWithRenewals.length > 0) {
              console.log('🔍 [UserPreferences] Encontradas outras preferências com sent_renewals:', {
                count: allPrefsWithRenewals.length,
                user_ids: allPrefsWithRenewals.map(p => p.user_id),
                renewals_counts: allPrefsWithRenewals.map(p => p?.filters?.sent_renewals?.length || 0)
              });
              
              // Tentar encontrar preferências que possam ser do mesmo usuário
              // (por exemplo, se o user_id antigo está relacionado de alguma forma)
              for (const otherPref of allPrefsWithRenewals) {
                if (otherPref.user_id !== supabaseUserId && otherPref.filters?.sent_renewals?.length > 0) {
                  console.log('🔄 [UserPreferences] Encontradas renovações em outro user_id, migrando...', {
                    other_user_id: otherPref.user_id,
                    renewals_count: otherPref.filters.sent_renewals.length
                  });
                  
                  // Mesclar renovações
                  const mergedRenewals = [
                    ...(prefs?.filters?.sent_renewals || []),
                    ...(otherPref.filters.sent_renewals || [])
                  ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicatas
                  
                  // Preservar renewal_templates de ambos (preferir o que tiver mais)
                  const prefsTemplates = prefs?.filters?.renewal_templates;
                  const otherTemplates = otherPref.filters?.renewal_templates;
                  const mergedTemplates = Array.isArray(prefsTemplates) && prefsTemplates.length > 0
                    ? prefsTemplates
                    : (Array.isArray(otherTemplates) && otherTemplates.length > 0 ? otherTemplates : prefsTemplates || []);
                  
                  const mergedFilters = {
                    ...prefs.filters,
                    sent_renewals: mergedRenewals,
                    renewal_templates: mergedTemplates
                  };
                  
                  const { data: updatedPrefs, error: updateError } = await supabase
                    .from('user_preferences')
                    .update({
                      filters: mergedFilters,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', supabaseUserId)
                    .select()
                    .single();
                  
                  if (!updateError && updatedPrefs) {
                    console.log('✅ [UserPreferences] Renovações migradas com sucesso:', {
                      total_renewals: mergedRenewals.length
                    });
                    return updatedPrefs;
                  }
                }
              }
            }
          }
          
          // Extrair templates de um objeto filters (qualquer chave que seja array ou objeto de modelos)
          const extractTemplatesFromFilters = (filters: any): any[] => {
            if (!filters || typeof filters !== 'object') return [];
            const out: any[] = [];
            for (const key of Object.keys(filters)) {
              const val = filters[key];
              if (Array.isArray(val)) {
                for (const t of val) {
                  if (!t || typeof t !== 'object') continue;
                  const message = (t.message ?? t.content ?? t.text ?? t.body ?? '').toString().trim();
                  const title = (t.title ?? t.name ?? t.label ?? '').toString().trim();
                  if (message || title) out.push({ id: t.id || crypto.randomUUID(), title: title || 'Sem título', message });
                }
              } else if (val && typeof val === 'object' && !Array.isArray(val) && (val.message ?? val.content ?? val.title ?? val.name ?? val.body)) {
                const message = (val.message ?? val.content ?? val.text ?? val.body ?? '').toString().trim();
                const title = (val.title ?? val.name ?? val.label ?? '').toString().trim();
                if (message || title) out.push({ id: val.id || crypto.randomUUID(), title: title || 'Sem título', message });
              }
            }
            return out;
          };

          // Mesclar templates da própria linha (todas as chaves de filters que parecem templates)
          const fromCurrentRow = extractTemplatesFromFilters(prefs.filters);
          // Log para debug: quais chaves existem em filters (ajuda a achar onde os modelos estão)
          const filterKeys = Object.keys(prefs.filters || {});
          if (filterKeys.length) {
            const keyInfo = filterKeys.map((k) => {
              const v = (prefs.filters as any)[k];
              const typ = Array.isArray(v) ? `array[${v.length}]` : typeof v;
              return `${k}: ${typ}`;
            });
            console.log('📋 [UserPreferences] Chaves em filters:', keyInfo.join(', '));
          }
          const seen = new Set<string>();
          const merged: any[] = [];
          for (const t of fromCurrentRow) {
            const key = `${t.title}|${t.message}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(t);
          }

          // Também buscar em outras linhas (se RLS permitir)
          const { data: allPrefs } = await supabase.from('user_preferences').select('user_id, filters');
          if (allPrefs?.length) {
            for (const row of allPrefs) {
              const fromRow = extractTemplatesFromFilters(row.filters);
              for (const t of fromRow) {
                const key = `${t.title}|${t.message}`;
                if (seen.has(key)) continue;
                seen.add(key);
                merged.push(t);
              }
            }
          }

          const currentCount = Array.isArray(prefs.filters?.renewal_templates) ? prefs.filters.renewal_templates.length : 0;
          if (merged.length > 0) {
            const mergedFilters = { ...prefs.filters, renewal_templates: merged };
            prefs = { ...prefs, filters: mergedFilters };
            if (merged.length > currentCount) {
              await supabase.from('user_preferences').update({
                filters: mergedFilters,
                updated_at: new Date().toISOString()
              }).eq('user_id', supabaseUserId);
            }
          }
          
          return prefs;
        }

        console.log('⚠️ [UserPreferences] Nenhuma preferência encontrada com Supabase user_id, tentando localStorage...');

        // Se não encontrou com Supabase ID, tenta buscar com localStorage ID (dados antigos)
        if (localStorageUserId) {
          const { data: oldData, error: oldError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', localStorageUserId);

          if (!oldError && oldData && oldData.length > 0) {
            console.log('🔄 [UserPreferences] Encontradas preferências antigas, migrando...', {
              oldUserId: localStorageUserId,
              newUserId: supabaseUserId,
              sent_renewals: oldData[0]?.filters?.sent_renewals?.length || 0
            });
            
            const oldPreferences = oldData[0];
            
            // Criar/atualizar com o novo user_id, mesclando com dados existentes se houver
            const { data: existingNewData } = await supabase
              .from('user_preferences')
              .select('*')
              .eq('user_id', supabaseUserId)
              .maybeSingle();

            // Mesclar dados antigos com novos (se existirem)
            const mergedFilters = {
              ...(existingNewData?.filters || {}),
              ...oldPreferences.filters,
              // Garantir que sent_renewals seja mesclado (união de arrays)
              sent_renewals: [
                ...(existingNewData?.filters?.sent_renewals || []),
                ...(oldPreferences.filters?.sent_renewals || [])
              ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicatas
            };

            const { data: migratedData, error: migrateError } = await supabase
              .from('user_preferences')
              .upsert({
                user_id: supabaseUserId,
                filters: mergedFilters,
                sorting: oldPreferences.sorting || existingNewData?.sorting,
                visible_columns: oldPreferences.visible_columns || existingNewData?.visible_columns,
                page_size: oldPreferences.page_size || existingNewData?.page_size,
                read_notifications: oldPreferences.read_notifications || existingNewData?.read_notifications,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })
              .select()
              .single();

            if (!migrateError && migratedData) {
              console.log('✅ [UserPreferences] Migração concluída:', {
                sent_renewals: migratedData?.filters?.sent_renewals?.length || 0
              });
              return migratedData;
            } else if (migrateError) {
              console.error('❌ [UserPreferences] Erro na migração:', migrateError);
            }
          } else {
            console.log('ℹ️ [UserPreferences] Nenhuma preferência encontrada com localStorage user_id');
          }
        }
      } else {
        console.log('⚠️ [UserPreferences] Usuário não autenticado, usando localStorage user_id');
        // Se não há Supabase user_id, usar localStorage (fallback)
        if (localStorageUserId) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', localStorageUserId);

          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            return fallbackData[0];
          }
        }
      }

      // Se não encontrou nada, retorna null
      console.log('ℹ️ [UserPreferences] Nenhuma preferência encontrada');
      return null;
    } catch (error) {
      console.error('❌ [UserPreferences] Erro na consulta de preferências:', error);
      return null;
    }
  }

  // Método com fallback para problemas de schema cache
  async upsertUserPreferencesWithFallback(preferences: Partial<UserPreferences>): Promise<UserPreferences | null> {
    console.log('Tentando salvar com fallback...', preferences);
    
    // Se tiver read_notifications, tentar salvar no campo filters diretamente para evitar erro
    if (preferences.read_notifications) {
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
    const supabaseUserId = await getCurrentUserId();
    const userId = supabaseUserId || await this.getUserId(); // Usar Supabase ID se disponível
    
    // Primeiro, buscar preferências existentes (isso também faz a migração se necessário)
    const existingPrefs = await this.getUserPreferences();
    
    try {
      // Mesclar preferências existentes com as novas
      const mergedPreferences = {
        ...(existingPrefs || {}),
        ...preferences,
        user_id: userId, // Garantir que sempre use o user_id correto
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_preferences')
        .upsert(mergedPreferences, {
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
