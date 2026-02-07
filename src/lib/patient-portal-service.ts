// Serviço para gerenciar Portal do Aluno
import { supabase } from '@/integrations/supabase/client';

export interface PortalToken {
  id: string;
  telefone: string;
  token: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  last_accessed_at: string | null;
  access_count: number;
}

/**
 * Gerar ou recuperar token de acesso para um paciente
 */
export async function getOrCreatePatientToken(telefone: string): Promise<{ token: string; isNew: boolean } | null> {
  try {
    // Verificar se já existe um token ativo
    const { data: existingToken, error: fetchError } = await supabase
      .from('patient_portal_tokens')
      .select('*')
      .eq('telefone', telefone)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = nenhum resultado
      console.error('Erro ao buscar token:', fetchError);
      
      // Se a tabela não existe, mostrar erro específico
      if (fetchError.code === '42P01') {
        console.error('❌ TABELA patient_portal_tokens NÃO EXISTE!');
        console.error('Execute o SQL: sql/create_patient_portal_tokens.sql no Supabase');
      }
      
      return null;
    }

    // Se já existe um token válido, retornar
    if (existingToken) {
      // Verificar se expirou
      if (existingToken.expires_at) {
        const expiresAt = new Date(existingToken.expires_at);
        if (expiresAt < new Date()) {
          // Token expirado, criar novo
          await revokeToken(existingToken.token);
        } else {
          return { token: existingToken.token, isNew: false };
        }
      } else {
        return { token: existingToken.token, isNew: false };
      }
    }

    // Criar novo token
    const newToken = generateToken();
    
    const { data: createdToken, error: createError } = await supabase
      .from('patient_portal_tokens')
      .insert({
        telefone,
        token: newToken,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar token:', createError);
      return null;
    }

    return { token: createdToken.token, isNew: true };
  } catch (error) {
    console.error('Erro no getOrCreatePatientToken:', error);
    return null;
  }
}

/**
 * Verificar se um token é válido e retornar o telefone do paciente.
 * Usa RPC get_phone_from_portal_token para token do banco (anon não lê patient_portal_tokens por RLS).
 */
export async function validateToken(token: string): Promise<string | null> {
  try {
    // 1) Token do banco (link enviado pelo nutri): validar via RPC (não lê patient_portal_tokens)
    const { data: phoneFromRpc, error: rpcError } = await supabase.rpc('get_phone_from_portal_token', {
      portal_token: token
    });
    if (!rpcError && phoneFromRpc && typeof phoneFromRpc === 'string') {
      return phoneFromRpc;
    }

    // 2) Token temporário do login por telefone (formato: base64 de "telefone:timestamp")
    try {
      const decoded = atob(token);
      const [phone, timestamp] = decoded.split(':');
      
      if (phone && timestamp) {
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        const daysDiff = (now - tokenTime) / (1000 * 60 * 60 * 24);
        
        // Token válido por 30 dias (para PWA funcionar bem)
        if (daysDiff < 30) {
          // Verificar se o paciente existe (RLS: só vê se telefone tem token ativo)
          const { data: patient } = await supabase
            .from('patients')
            .select('telefone')
            .eq('telefone', phone)
            .single();
          
          if (patient) {
            return phone;
          }
        }
      }
    } catch (e) {
      // Não é um token temporário
    }

    return null;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return null;
  }
}

/**
 * Revogar um token (desativar)
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patient_portal_tokens')
      .update({ is_active: false })
      .eq('token', token);

    return !error;
  } catch (error) {
    console.error('Erro ao revogar token:', error);
    return false;
  }
}

/**
 * Listar todos os tokens de um paciente
 */
export async function listPatientTokens(telefone: string): Promise<PortalToken[]> {
  try {
    const { data, error } = await supabase
      .from('patient_portal_tokens')
      .select('*')
      .eq('telefone', telefone)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar tokens:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao listar tokens:', error);
    return [];
  }
}

/**
 * Gerar token aleatório seguro
 */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  
  // Gerar token de 32 caracteres
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Gerar URL completa do portal para um paciente
 */
export function getPortalUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/portal/${token}`;
}

/**
 * Copiar URL do portal para clipboard
 */
export async function copyPortalUrl(token: string): Promise<boolean> {
  try {
    const url = getPortalUrl(token);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Erro ao copiar URL:', error);
    return false;
  }
}

