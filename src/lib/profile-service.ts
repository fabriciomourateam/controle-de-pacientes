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
  checkin_slug?: string;
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
        return null;
      }

      // 1. Buscar dados principais do user_profiles view (sem tipagem na view)
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('user_profiles' as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfileError) {
        if (userProfileError.code === 'PGRST116') {
          // Perfil não existe, retornar dados básicos
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
            checkin_slug: '',
            avatar_url: user.user_metadata?.avatar_url || null
          };
        }
        throw userProfileError;
      }

      // 2. Buscar checkin_slug da tabela profiles original (que tem o campo novo)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('checkin_slug')
        .eq('id', user.id)
        .maybeSingle();

      // Merge dos dados
      return {
        ...userProfileData,
        checkin_slug: profileData?.checkin_slug || ''
      };

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

      // Remover checkin_slug do objeto que vai para user_profiles (pois a view pode não ter o campo)
      const { checkin_slug, ...viewData } = profileData;

      // 1. Salvar dados gerais na view user_profiles
      const { data: savedViewData, error: viewError } = await supabase
        .from('user_profiles' as any)
        .upsert(viewData, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (viewError) throw viewError;

      // 2. Salvar checkin_slug diretamente na tabela profiles
      if (checkin_slug !== undefined) {
        const { error: slugError } = await supabase
          .from('profiles')
          .update({ checkin_slug: checkin_slug || null })
          .eq('id', user.id);

        if (slugError) throw slugError;
      }

      return {
        ...savedViewData,
        checkin_slug: checkin_slug || ''
      };
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
