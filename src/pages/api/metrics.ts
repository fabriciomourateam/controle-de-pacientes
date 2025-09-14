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

    const { period = '12' } = req.query;

    // Buscar métricas do usuário
    const { data: metrics, error } = await supabase
      .from('dashboard_metricas')
      .select('*')
      .eq('user_id', userId)
      .order('mes_numero', { ascending: true })
      .limit(parseInt(period as string));

    if (error) {
      throw error;
    }

    // Calcular estatísticas
    const totalPatients = metrics?.length || 0;
    const avgRetention = metrics?.reduce((acc, m) => acc + (m.percentual_renovacao * 100), 0) / totalPatients || 0;
    const avgChurn = metrics?.reduce((acc, m) => acc + (m.percentual_churn * 100), 0) / totalPatients || 0;
    const totalGrowth = metrics?.reduce((acc, m) => acc + m.crescimento_mensal, 0) || 0;

    res.status(200).json({
      success: true,
      data: {
        metrics,
        statistics: {
          totalPatients,
          avgRetention: Math.round(avgRetention * 100) / 100,
          avgChurn: Math.round(avgChurn * 100) / 100,
          totalGrowth: Math.round(totalGrowth * 100) / 100
        },
        period: parseInt(period as string)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
