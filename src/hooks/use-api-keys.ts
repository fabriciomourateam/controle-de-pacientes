import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();

  // Carregar API Keys
  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar API Keys",
        variant: "destructive",
      });
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

  return {
    apiKeys,
    loading,
    saving,
    loadApiKeys,
    createNewApiKey,
    removeApiKey,
  };
};
