/**
 * Helpers para autenticação e multi-tenancy
 * Funções utilitárias para trabalhar com usuários autenticados
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Obtém o ID do usuário autenticado atual
 * @returns UUID do usuário ou null se não estiver autenticado
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    
    return user?.id || null;
  } catch (error) {
    console.error('Erro ao obter ID do usuário:', error);
    return null;
  }
}

/**
 * Obtém o usuário autenticado atual completo
 * @returns User object ou null se não estiver autenticado
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Erro ao obter usuário:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 * @returns true se estiver autenticado, false caso contrário
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}

/**
 * Garante que o user_id seja incluído em um objeto de insert/update
 * Se user_id não estiver definido, adiciona o ID do usuário atual
 * @param data Objeto de dados para insert/update
 * @returns Objeto com user_id garantido
 */
export async function ensureUserId<T extends { user_id?: string | null }>(
  data: T
): Promise<T & { user_id: string }> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }
  
  return {
    ...data,
    user_id: data.user_id || userId,
  };
}

/**
 * Hook para obter o ID do usuário atual de forma reativa
 * Use este hook em componentes React
 */
export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserId() {
      const id = await getCurrentUserId();
      setUserId(id);
      setLoading(false);
    }

    fetchUserId();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const id = await getCurrentUserId();
          setUserId(id);
        } else if (event === 'SIGNED_OUT') {
          setUserId(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, loading };
}

