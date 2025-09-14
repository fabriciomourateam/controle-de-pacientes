import { NextApiRequest, NextApiResponse } from 'next';
import { validateApiKey } from '@/lib/api-keys-service';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Validar API Key
    const apiKey = req.headers.authorization?.replace('Bearer ', '');
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key não fornecida' });
    }

    const { valid, userId } = await validateApiKey(apiKey);
    if (!valid || !userId) {
      return res.status(401).json({ error: 'API Key inválida' });
    }

    // Buscar pacientes do usuário
    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: patients,
      count: patients?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de pacientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
