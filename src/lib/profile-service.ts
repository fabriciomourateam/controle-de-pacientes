import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  crm: string;
  clinic: string;
  address: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export const profileService = {
  // Buscar perfil do usuário atual
  async getProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Retornar null em vez de lançar erro quando não há usuário autenticado
        return null;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Perfil não existe, retornar dados básicos do auth
          return {
            id: user.id,
            name: user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
            specialty: '',
            crm: '',
            clinic: '',
            address: '',
            bio: '',
            avatar_url: user.user_metadata?.avatar_url || null
          };
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  },

  // Salvar/atualizar perfil
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const profileData = {
        ...profile,
        id: user.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      throw error;
    }
  },

  // Atualizar senha
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  },

  // Upload de avatar
  async uploadAvatar(file: File): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Caminho mais simples, sem pasta

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          upsert: true // Permite sobrescrever arquivo existente
        });

      if (uploadError) {
        console.error('Erro de upload:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do avatar:', error);
      throw error;
    }
  }
};
