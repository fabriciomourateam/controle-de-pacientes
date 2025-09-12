import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let data = req.body;
    
    // Log dos dados recebidos para debug
    console.log('=== DADOS DE CHECKIN RECEBIDOS DO TYPEBOT/SHEETS ===');
    console.log('Raw body:', req.body);
    console.log('Body type:', typeof req.body);
    console.log('Body stringified:', JSON.stringify(data, null, 2));
    console.log('==================================================');
    
    // Se o body for uma string, tentar fazer parse
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON format',
          details: parseError
        });
      }
    }
    
    // Verificar se data é válido
    if (!data || (typeof data !== 'object' && !Array.isArray(data))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format - expected object or array'
      });
    }

    // Função para normalizar telefone - remove +55, 9 extra e mantém apenas números
    const normalizePhone = (phone: string): string => {
      // Remove tudo que não é número
      const numbersOnly = phone.replace(/\D/g, '');
      
      // Remove código do país (55) se presente
      let cleanPhone = numbersOnly;
      if (numbersOnly.startsWith('55') && numbersOnly.length > 10) {
        cleanPhone = numbersOnly.substring(2);
      }
      
      // Remove 9 extra se presente (formato antigo: 9XXXXXXXX)
      if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
        cleanPhone = cleanPhone.substring(1);
      }
      
      return cleanPhone;
    };

    // Função para buscar paciente por telefone flexível (últimos 8 dígitos)
    const findPatientByPhone = async (phone: string) => {
      const normalizedPhone = normalizePhone(phone);
      console.log(`Buscando paciente com telefone normalizado: ${normalizedPhone}`);
      
      // Buscar por telefone exato primeiro
      let { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id, telefone')
        .eq('telefone', normalizedPhone)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar paciente:', checkError);
        throw checkError;
      }

      // Se não encontrou, buscar pelos últimos 8 dígitos
      if (!existingPatient && normalizedPhone.length >= 8) {
        const last8Digits = normalizedPhone.slice(-8);
        console.log(`Buscando pelos últimos 8 dígitos: ${last8Digits}`);
        
        const { data: patients, error: searchError } = await supabase
          .from('patients')
          .select('id, telefone')
          .like('telefone', `%${last8Digits}`);

        if (searchError) {
          console.error('Erro ao buscar paciente por últimos dígitos:', searchError);
          throw searchError;
        }

        if (patients && patients.length > 0) {
          existingPatient = patients[0];
          console.log(`Paciente encontrado pelos últimos 8 dígitos: ${existingPatient.telefone}`);
        }
      }

      return existingPatient;
    };

    // Função para verificar se paciente existe e criar se necessário
    const ensurePatientExists = async (telefone: string, inputData: any) => {
      // Buscar paciente com busca flexível
      const existingPatient = await findPatientByPhone(telefone);

      // Se paciente não existe, criar um básico
      if (!existingPatient) {
        const normalizedPhone = normalizePhone(telefone);
        console.log(`Paciente com telefone ${telefone} (normalizado: ${normalizedPhone}) não encontrado. Criando paciente básico...`);
        
        const newPatient = {
          telefone: normalizedPhone, // Salvar telefone normalizado
          nome: inputData.nome || `Paciente ${normalizedPhone}`,
          apelido: inputData.apelido || null,
          email: inputData.email || null,
          genero: inputData.genero || null,
          data_nascimento: inputData.data_nascimento || null,
          inicio_acompanhamento: new Date().toISOString().split('T')[0],
          plano: inputData.plano || 'Plano Básico',
          observacao: `Paciente criado automaticamente via checkin (telefone original: ${telefone})`
        };

        const { data: createdPatient, error: createError } = await supabase
          .from('patients')
          .insert(newPatient)
          .select('id')
          .single();

        if (createError) {
          console.error('Erro ao criar paciente:', createError);
          throw createError;
        }

        console.log(`Paciente criado com ID: ${createdPatient.id}`);
        return createdPatient.id;
      }

      console.log(`Paciente encontrado: ${existingPatient.telefone} (ID: ${existingPatient.id})`);
      return existingPatient.id;
    };

    // Função para mapear dados do Typebot/Sheets para Supabase checkin
    const mapToCheckin = (inputData: any) => {
      const mapped: any = {};
      
      // Campos obrigatórios - usar telefone normalizado
      if (inputData.telefone) mapped.telefone = normalizePhone(inputData.telefone);
      if (inputData.mes_ano) mapped.mes_ano = inputData.mes_ano;
      
      // Campos opcionais com valores padrão
      mapped.data_checkin = inputData.data_checkin || new Date().toISOString().split('T')[0];
      mapped.data_preenchimento = inputData.data_preenchimento || new Date().toISOString();
      
      // Mapear todos os campos possíveis - aceita qualquer formato
      const allFields = [
        'peso', 'medida', 'treino', 'cardio', 'agua', 'sono', 'ref_livre', 'beliscos',
        'oq_comeu_ref_livre', 'oq_beliscou', 'comeu_menos', 'fome_algum_horario',
        'alimento_para_incluir', 'melhora_visual', 'quais_pontos', 'objetivo',
        'dificuldades', 'stress', 'libido', 'tempo', 'descanso', 'tempo_cardio',
        'foto_1', 'foto_2', 'foto_3', 'foto_4', 'telefone_checkin',
        'pontos_treinos', 'pontos_cardios', 'pontos_descanso_entre_series',
        'pontos_refeicao_livre', 'pontos_beliscos', 'pontos_agua', 'pontos_sono',
        'pontos_qualidade_sono', 'pontos_stress', 'pontos_libido',
        'total_pontuacao', 'percentual_aproveitamento'
      ];
      
      // Mapear todos os campos - aceita qualquer valor (string, number, null, etc.)
      allFields.forEach(field => {
        if (inputData[field] !== undefined && inputData[field] !== null) {
          // Converter para string para garantir compatibilidade
          mapped[field] = String(inputData[field]);
        }
      });
      
      return mapped;
    };

    // Se for um array, processar em lote
    if (Array.isArray(data)) {
      const processedData = [];
      
      for (const item of data) {
        // Verificar/criar paciente primeiro
        if (item.telefone) {
          await ensurePatientExists(item.telefone, item);
        }
        
        // Mapear dados para checkin
        const mappedData = mapToCheckin(item);
        processedData.push(mappedData);
      }
      
      const { data: result, error } = await supabase
        .from('checkin')
        .insert(processedData)
        .select('id');
      
      if (error) {
        console.error('Erro ao inserir dados de checkin:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
          details: error
        });
      }
      
      return res.status(200).json({
        success: true,
        imported: result?.length || 0,
        total: data.length
      });
    } else {
      // Se for um objeto único
      // Verificar/criar paciente primeiro
      if (data.telefone) {
        await ensurePatientExists(data.telefone, data);
      }
      
      const mappedData = mapToCheckin(data);
      
      const { data: result, error } = await supabase
        .from('checkin')
        .insert(mappedData)
        .select('id');
      
      if (error) {
        console.error('Erro ao inserir dados de checkin:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
          details: error
        });
      }
      
      return res.status(200).json({
        success: true,
        imported: 1,
        checkin_id: result?.[0]?.id
      });
    }
  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: String(error)
    });
  }
}
