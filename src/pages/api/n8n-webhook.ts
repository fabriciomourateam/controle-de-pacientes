import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseService } from '@/integrations/supabase/service-client';

// ⚠️ IMPORTANTE: Este webhook usa Service Role Key para bypassar RLS
// Os dados serão vinculados ao primeiro usuário do sistema (ou você pode configurar um user_id específico)

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

    // Função para obter user_id padrão (seu usuário)
    // Busca o user_id de um paciente existente (que já foi migrado)
    const getDefaultUserId = async (): Promise<string> => {
      // Buscar user_id de um paciente existente (que já foi migrado para você)
      const { data: patients, error: patientError } = await supabaseService
        .from('patients')
        .select('user_id')
        .not('user_id', 'is', null)
        .limit(1);
      
      if (!patientError && patients && patients.length > 0 && (patients[0] as any).user_id) {
        const userId = (patients[0] as any).user_id;
        console.log('✅ Usando user_id de paciente existente:', userId);
        return userId;
      }
      
      throw new Error('Não foi possível determinar user_id. Certifique-se de que há pacientes migrados no sistema.');
    };

    // Função para buscar paciente por telefone flexível (últimos 8 dígitos)
    const findPatientByPhone = async (phone: string) => {
      const normalizedPhone = normalizePhone(phone);
      console.log(`Buscando paciente com telefone normalizado: ${normalizedPhone}`);
      
      // Buscar por telefone exato primeiro (usando service client para bypassar RLS)
      let { data: existingPatient, error: checkError } = await supabaseService
        .from('patients')
        .select('id, telefone, user_id')
        .eq('telefone', normalizedPhone)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Erro ao verificar paciente:', checkError);
        throw checkError;
      }

      // Se não encontrou, buscar pelos últimos 8 dígitos
      if (!existingPatient && normalizedPhone.length >= 8) {
        const last8Digits = normalizedPhone.slice(-8);
        console.log(`Buscando pelos últimos 8 dígitos: ${last8Digits}`);
        
        const { data: patients, error: searchError } = await supabaseService
          .from('patients')
          .select('id, telefone, user_id')
          .like('telefone', `%${last8Digits}`);

        if (searchError) {
          console.error('Erro ao buscar paciente por últimos dígitos:', searchError);
          throw searchError;
        }

        if (patients && patients.length > 0) {
          existingPatient = patients[0] as any;
          const patient = existingPatient as any;
          console.log(`Paciente encontrado pelos últimos 8 dígitos: ${patient.telefone}`);
        }
      }

      return existingPatient;
    };

    // Função para verificar se paciente existe e criar/atualizar se necessário
    const ensurePatientExists = async (telefone: string, inputData: any) => {
      // Obter user_id padrão
      const defaultUserId = await getDefaultUserId();
      
      // Buscar paciente com busca flexível
      const existingPatient = await findPatientByPhone(telefone);

      // Se paciente não existe, criar um básico
      if (!existingPatient) {
        const normalizedPhone = normalizePhone(telefone);
        console.log(`Paciente com telefone ${telefone} (normalizado: ${normalizedPhone}) não encontrado. Criando paciente básico...`);
        
        const newPatient = {
          telefone: normalizedPhone, // Salvar telefone normalizado
          user_id: defaultUserId, // ⚠️ IMPORTANTE: Vincular ao usuário padrão
          nome: inputData.nome || `Paciente ${normalizedPhone}`,
          apelido: inputData.apelido || null,
          email: inputData.email || null,
          genero: inputData.genero || null,
          data_nascimento: inputData.data_nascimento || null,
          inicio_acompanhamento: new Date().toISOString().split('T')[0],
          plano: inputData.plano || 'Plano Básico',
          observacao: `Paciente criado automaticamente via checkin (telefone original: ${telefone})`
        };

        // Usar service client para bypassar RLS
        const { data: createdPatient, error: createError } = await supabaseService
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

      // Se paciente existe, atualizar dados se necessário
      // (mas não vamos atualizar tudo, apenas se houver dados novos importantes)
      const existingPatientData = existingPatient as any;
      if (inputData.nome && inputData.nome !== existingPatientData.nome) {
        const { error: updateError } = await supabaseService
          .from('patients')
          .update({ 
            nome: inputData.nome,
            // Manter o user_id existente
            user_id: existingPatientData.user_id || defaultUserId
          })
          .eq('id', existingPatientData.id);
        
        if (updateError) {
          console.error('Erro ao atualizar paciente:', updateError);
          // Não lançar erro, apenas logar
        }
      }

      const patient = existingPatient as any;
      console.log(`Paciente encontrado: ${patient.telefone} (ID: ${patient.id})`);
      return patient.id;
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
      
      // Obter user_id padrão para os checkins
      const defaultUserId = await getDefaultUserId();
      
      // Adicionar user_id a todos os checkins
      const processedDataWithUserId = processedData.map((item: any) => ({
        ...item,
        user_id: defaultUserId
      }));

      const { data: result, error } = await supabaseService
        .from('checkin')
        .insert(processedDataWithUserId)
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
      
      // Obter user_id padrão para o checkin
      const defaultUserId = await getDefaultUserId();
      
      // Adicionar user_id ao checkin
      const mappedDataWithUserId = {
        ...mappedData,
        user_id: defaultUserId
      };
      
      const { data: result, error } = await supabaseService
        .from('checkin')
        .insert(mappedDataWithUserId)
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
