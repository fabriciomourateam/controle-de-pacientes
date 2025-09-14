import { useState, useEffect } from 'react';
import { profileService, UserProfile } from '@/lib/profile-service';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar perfil
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await profileService.getProfile();
      
      if (profileData) {
        setProfile(profileData);
      } else {
        // Usuário não autenticado - criar perfil padrão
        setProfile({
          id: '',
          name: '',
          email: '',
          phone: '',
          specialty: '',
          crm: '',
          clinic: '',
          address: '',
          bio: '',
          avatar_url: null
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar perfil
  const saveProfile = async (profileData: UserProfile) => {
    try {
      setSaving(true);
      setError(null);
      
      // Verificar se o usuário está autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado. Faça login para salvar o perfil.');
      }
      
      const savedProfile = await profileService.saveProfile(profileData);
      setProfile(savedProfile);
      toast({
        title: "Sucesso",
        description: "Perfil salvo com sucesso!",
      });
      return savedProfile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar perfil';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Atualizar senha
  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setSaving(true);
      setError(null);
      await profileService.updatePassword(currentPassword, newPassword);
      toast({
        title: "Sucesso",
        description: "Senha atualizada com sucesso!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar senha';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Upload de avatar
  const uploadAvatar = async (file: File) => {
    try {
      setSaving(true);
      setError(null);
      const avatarUrl = await profileService.uploadAvatar(file);
      
      if (profile) {
        const updatedProfile = { ...profile, avatar_url: avatarUrl };
        await saveProfile(updatedProfile);
      }
      
      return avatarUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload do avatar';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Carregar perfil na inicialização
  useEffect(() => {
    loadProfile();
  }, []);

  return {
    profile,
    loading,
    saving,
    error,
    loadProfile,
    saveProfile,
    updatePassword,
    uploadAvatar
  };
}
