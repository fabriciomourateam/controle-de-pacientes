import { supabase } from '@/integrations/supabase/client';

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  permissions: string[];
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  expires_at?: string;
}

// Gerar chave API aleatória
export const generateApiKey = (): string => {
  const prefix = 'sk_';
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return prefix + key;
};

// Hash da chave para armazenamento seguro
export const hashApiKey = async (key: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Buscar API Keys do usuário
export const getApiKeys = async (): Promise<ApiKey[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar API Keys:', error);
    throw error;
  }
};

// Criar nova API Key
export const createApiKey = async (data: CreateApiKeyData): Promise<{ key: string; apiKey: ApiKey }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const rawKey = generateApiKey();
    const keyHash = await hashApiKey(rawKey);

    const { data: apiKey, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        name: data.name,
        key_hash: keyHash,
        permissions: data.permissions,
        expires_at: data.expires_at || null
      })
      .select()
      .single();

    if (error) throw error;

    return { key: rawKey, apiKey };
  } catch (error) {
    console.error('Erro ao criar API Key:', error);
    throw error;
  }
};

// Atualizar última utilização
export const updateLastUsed = async (keyId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('id', keyId);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao atualizar última utilização:', error);
    throw error;
  }
};

// Excluir API Key
export const deleteApiKey = async (keyId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao excluir API Key:', error);
    throw error;
  }
};

// Validar API Key
export const validateApiKey = async (key: string): Promise<{ valid: boolean; userId?: string; permissions?: string[] }> => {
  try {
    const keyHash = await hashApiKey(key);
    
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('user_id, permissions, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    // Verificar se não expirou
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false };
    }

    // Atualizar última utilização
    await updateLastUsed(data.id);

    return { 
      valid: true, 
      userId: data.user_id, 
      permissions: data.permissions 
    };
  } catch (error) {
    console.error('Erro ao validar API Key:', error);
    return { valid: false };
  }
};
