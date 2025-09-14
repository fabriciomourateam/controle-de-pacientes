import { NextApiRequest, NextApiResponse } from 'next';
import { validateApiKey } from '@/lib/api-keys-service';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Listar checkins
    return await getCheckins(req, res);
  } else if (req.method === 'POST') {
    // Criar checkin
    return await createCheckin(req, res);
  } else {
    return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function getCheckins(req: NextApiRequest, res: NextApiResponse) {
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

    // Buscar checkins do usuário
    const { data: checkins, error } = await supabase
      .from('checkins')
      .select(`
        *,
        patients:patient_id (
          name,
          email,
          telefone
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: checkins,
      count: checkins?.length || 0
    });

  } catch (error) {
    console.error('Erro ao buscar checkins:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function createCheckin(req: NextApiRequest, res: NextApiResponse) {
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

    const { patient_id, score, feedback, notes } = req.body;

    if (!patient_id || !score) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Criar checkin
    const { data: checkin, error } = await supabase
      .from('checkins')
      .insert({
        user_id: userId,
        patient_id,
        score,
        feedback,
        notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data: checkin,
      message: 'Checkin criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar checkin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
