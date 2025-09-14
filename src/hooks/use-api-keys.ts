import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  getApiKeys, 
  createApiKey, 
  deleteApiKey, 
  ApiKey, 
  CreateApiKeyData 
} from '@/lib/api-keys-service';

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Verificar se o usuário está autenticado
  const checkAuthentication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      return !!user;
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Carregar API Keys
  const loadApiKeys = async () => {
    try {
      setLoading(true);
      
      // Verificar autenticação primeiro
      const isAuth = await checkAuthentication();
      if (!isAuth) {
        setApiKeys([]);
        return;
      }

      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      // Não mostrar toast de erro se não estiver autenticado
      if (isAuthenticated) {
        toast({
          title: "Erro",
          description: "Erro ao carregar API Keys",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Criar nova API Key
  const createNewApiKey = async (data: CreateApiKeyData) => {
    try {
      setSaving(true);
      const { key, apiKey } = await createApiKey(data);
      
      setApiKeys(prev => [apiKey, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "API Key criada com sucesso!",
      });

      return { key, apiKey };
    } catch (error) {
      console.error('Erro ao criar API Key:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar API Key",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Excluir API Key
  const removeApiKey = async (keyId: string) => {
    try {
      setSaving(true);
      await deleteApiKey(keyId);
      
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      toast({
        title: "Sucesso",
        description: "API Key excluída com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir API Key:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir API Key",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Carregar API Keys na inicialização
  useEffect(() => {
    loadApiKeys();
  }, []);

  // Escutar mudanças na autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
        loadApiKeys();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setApiKeys([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    apiKeys,
    loading,
    saving,
    isAuthenticated,
    loadApiKeys,
    createNewApiKey,
    removeApiKey,
  };
};
