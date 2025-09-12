import { supabase } from '@/integrations/supabase/client';

// Teste para verificar se o relacionamento por telefone está funcionando
export async function testCheckinRelationship() {
  console.log('Testando relacionamento entre checkin e patients...');

  try {
    // 1. Testar se conseguimos buscar pacientes
    console.log('1. Buscando pacientes...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nome, telefone')
      .limit(5);
    
    if (patientsError) {
      console.error('Erro ao buscar pacientes:', patientsError);
      return;
    }
    
    console.log('Pacientes encontrados:', patients?.length || 0);
    console.log('Telefones dos pacientes:', patients?.map(p => p.telefone));

    // 2. Testar se conseguimos buscar checkins
    console.log('2. Buscando checkins...');
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkin')
      .select('id, telefone, mes_ano, data_preenchimento')
      .limit(5);
    
    if (checkinsError) {
      console.error('Erro ao buscar checkins:', checkinsError);
      return;
    }
    
    console.log('Checkins encontrados:', checkins?.length || 0);
    console.log('Telefones dos checkins:', checkins?.map(c => c.telefone));

    // 3. Testar relacionamento com JOIN manual
    console.log('3. Testando JOIN manual por telefone...');
    if (patients && patients.length > 0 && checkins && checkins.length > 0) {
      const telefoneTeste = patients[0].telefone;
      
      const { data: checkinWithPatient, error: joinError } = await supabase
        .from('checkin')
        .select(`
          *,
          patient:patients!inner(
            id,
            nome,
            apelido,
            telefone,
            plano
          )
        `)
        .eq('telefone', telefoneTeste)
        .limit(3);
      
      if (joinError) {
        console.error('Erro no JOIN manual:', joinError);
      } else {
        console.log('JOIN manual funcionando:', checkinWithPatient?.length || 0, 'checkins com paciente');
      }
    } else {
      console.log('Nao ha dados suficientes para testar JOIN manual');
    }

    // 4. Testar relacionamento com Foreign Key
    console.log('4. Testando relacionamento com Foreign Key...');
    const { data: checkinWithFK, error: fkError } = await supabase
      .from('checkin')
      .select(`
        *,
        patient:patients!inner(
          id,
          nome,
          apelido,
          telefone,
          plano
        )
      `)
      .limit(3);
    
    if (fkError) {
      console.error('Erro no relacionamento FK:', fkError);
    } else {
      console.log('Relacionamento FK funcionando:', checkinWithFK?.length || 0, 'checkins com paciente');
    }

    // 5. Verificar telefones em comum
    console.log('5. Verificando telefones em comum...');
    if (patients && checkins) {
      const telefonesPatients = new Set(patients.map(p => p.telefone).filter(Boolean));
      const telefonesCheckins = new Set(checkins.map(c => c.telefone).filter(Boolean));
      
      const telefonesComuns = [...telefonesPatients].filter(t => telefonesCheckins.has(t));
      console.log('Telefones em comum:', telefonesComuns.length);
      console.log('Lista de telefones comuns:', telefonesComuns);
    }

    console.log('Teste de relacionamento concluido!');

  } catch (error) {
    console.error('Erro inesperado no teste:', error);
  }
}

// Teste para inserir um checkin com telefone existente
export async function testInsertCheckinWithExistingPhone() {
  console.log('Testando insercao de checkin com telefone existente...');

  try {
    // 1. Buscar um paciente existente
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nome, telefone')
      .limit(1);
    
    if (patientsError || !patients || patients.length === 0) {
      console.error('Erro ao buscar paciente ou nenhum paciente encontrado:', patientsError);
      return;
    }

    const paciente = patients[0];
    console.log('Paciente encontrado:', paciente.nome, '- Telefone:', paciente.telefone);

    // 2. Criar checkin com o telefone do paciente
    const checkinData = {
      telefone: paciente.telefone,
      data_checkin: new Date().toISOString().split('T')[0],
      mes_ano: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      peso: 70.5,
      medida: 1.75,
      treino: 'Treino A - Peito e Triceps',
      cardio: '30 min esteira',
      agua: '2.5L',
      sono: '8h',
      ref_livre: 'Pizza no domingo',
      beliscos: 'Nenhum',
      pontos_treinos: 8,
      pontos_cardios: 7,
      pontos_agua: 9,
      pontos_sono: 8,
      total_pontuacao: 32,
      percentual_aproveitamento: 80.0
    };

    const { data: checkin, error: checkinError } = await supabase
      .from('checkin')
      .insert(checkinData)
      .select()
      .single();

    if (checkinError) {
      console.error('Erro ao inserir checkin:', checkinError);
      return;
    }

    console.log('Checkin criado com sucesso!');
    console.log('ID do checkin:', checkin.id);
    console.log('Dados do checkin:', checkin);

    // 3. Verificar se o relacionamento está funcionando
    const { data: checkinWithPatient, error: relationError } = await supabase
      .from('checkin')
      .select(`
        *,
        patient:patients!inner(
          id,
          nome,
          apelido,
          telefone,
          plano
        )
      `)
      .eq('id', checkin.id)
      .single();

    if (relationError) {
      console.error('Erro ao verificar relacionamento:', relationError);
    } else {
      console.log('Relacionamento verificado com sucesso!');
      console.log('Checkin com dados do paciente:', checkinWithPatient);
    }

  } catch (error) {
    console.error('Erro inesperado no teste de insercao:', error);
  }
}

