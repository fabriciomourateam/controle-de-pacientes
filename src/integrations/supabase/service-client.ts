// Cliente Supabase com Service Role Key - BYPASSA RLS
// ⚠️ ATENÇÃO: Use APENAS em servidor/backend, NUNCA no frontend!
// Este cliente ignora todas as políticas RLS

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qhzifnyjyxdushxorzrk.supabase.co";

// ⚠️ IMPORTANTE: Adicione esta variável no seu .env ou configure no Supabase Dashboard
// Para obter a Service Role Key:
// 1. Acesse Supabase Dashboard
// 2. Vá em Settings > API
// 3. Copie a "service_role" key (NÃO a anon key!)
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada. Webhooks do n8n podem não funcionar.');
}

// Cliente com Service Role - bypassa RLS
export const supabaseService = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

