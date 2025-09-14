import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface PagePassword {
  id: string;
  page_name: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
}

// Verificar senha de uma página
export const verifyPagePassword = async (pageName: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('page_passwords')
      .select('password_hash, is_active')
      .eq('page_name', pageName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar senha da página:', error);
      return false;
    }

    // Verificar senha com bcrypt
    const isValid = await bcrypt.compare(password, data.password_hash);
    return isValid;
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};

// Buscar todas as páginas protegidas
export const getProtectedPages = async (): Promise<PagePassword[]> => {
  try {
    const { data, error } = await supabase
      .from('page_passwords')
      .select('*')
      .eq('is_active', true)
      .order('page_name');

    if (error) {
      console.error('Erro ao buscar páginas protegidas:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar páginas protegidas:', error);
    return [];
  }
};

// Criar/atualizar senha de uma página
export const setPagePassword = async (pageName: string, password: string, description?: string): Promise<boolean> => {
  try {
    // Gerar hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { error } = await supabase
      .from('page_passwords')
      .upsert({
        page_name: pageName,
        password_hash: passwordHash,
        description: description || `Proteção para página ${pageName}`,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar senha da página:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar senha:', error);
    return false;
  }
};

// Desativar proteção de uma página
export const disablePageProtection = async (pageName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('page_passwords')
      .update({ is_active: false })
      .eq('page_name', pageName);

    if (error) {
      console.error('Erro ao desativar proteção:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao desativar proteção:', error);
    return false;
  }
};

// Ativar proteção de uma página
export const enablePageProtection = async (pageName: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('page_passwords')
      .update({ is_active: true })
      .eq('page_name', pageName);

    if (error) {
      console.error('Erro ao ativar proteção:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao ativar proteção:', error);
    return false;
  }
};
