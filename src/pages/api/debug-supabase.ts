import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    console.log('=== DEBUG SUPABASE ===');
    console.log('Dados recebidos:', JSON.stringify(data, null, 2));
    console.log('=====================');

    // Primeiro, vamos ver quais colunas existem na tabela
    const { data: columns, error: columnsError } = await supabase
      .from('patients')
      .select('*')
      .limit(0);

    if (columnsError) {
      console.error('Erro ao buscar colunas:', columnsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar colunas da tabela',
        details: columnsError
      });
    }

    // Tentar inserir um registro de teste
    const testData = {
      nome: 'Teste Debug',
      telefone: '(11) 99999-9999',
      plano: 'TESTE'
    };

    console.log('Tentando inserir dados de teste:', testData);

    const { data: result, error: insertError } = await supabase
      .from('patients')
      .insert(testData)
      .select('id');

    if (insertError) {
      console.error('Erro ao inserir:', insertError);
      return res.status(400).json({
        success: false,
        error: 'Erro ao inserir dados',
        details: insertError,
        testData: testData
      });
    }

    console.log('Sucesso ao inserir:', result);

    return res.status(200).json({
      success: true,
      message: 'Dados inseridos com sucesso',
      result: result,
      testData: testData
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    });
  }
}
