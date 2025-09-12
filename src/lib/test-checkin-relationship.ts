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
    console.log('\n📋 3. Testando JOIN manual por telefone...');
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
        .eq('telefone', telefoneTeste);
      
      if (joinError) {
        console.error('❌ Erro no JOIN:', joinError);
      } else {
        console.log('✅ JOIN funcionando! Checkins com paciente:', checkinWithPatient?.length || 0);
        console.log('📊 Dados do relacionamento:', checkinWithPatient);
      }
    }

    // 4. Testar relacionamento usando foreign key
    console.log('\n📋 4. Testando relacionamento com foreign key...');
    try {
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
        console.error('❌ Erro com foreign key:', fkError);
        console.log('💡 Isso é esperado se a foreign key ainda não foi criada no banco');
      } else {
        console.log('✅ Foreign key funcionando! Checkins com paciente:', checkinWithFK?.length || 0);
        console.log('📊 Dados do relacionamento FK:', checkinWithFK);
      }
    } catch (error) {
      console.log('💡 Foreign key não configurada ainda (normal)');
    }

    // 5. Verificar se há telefones correspondentes
    console.log('\n📋 5. Verificando correspondência de telefones...');
    if (patients && checkins) {
      const telefonesPatients = new Set(patients.map(p => p.telefone).filter(Boolean));
      const telefonesCheckins = new Set(checkins.map(c => c.telefone).filter(Boolean));
      
      const telefonesComuns = [...telefonesPatients].filter(t => telefonesCheckins.has(t));
      
      console.log('📞 Telefones em patients:', telefonesPatients.size);
      console.log('📞 Telefones em checkins:', telefonesCheckins.size);
      console.log('🔗 Telefones em comum:', telefonesComuns.length);
      console.log('📋 Telefones comuns:', telefonesComuns);
    }

    console.log('\n✅ Teste de relacionamento concluído!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Função para testar inserção de checkin com telefone existente
export async function testInsertCheckinWithExistingPhone() {
  console.log('\n🔍 Testando inserção de checkin com telefone existente...');

  try {
    // Buscar um telefone de paciente existente
    const { data: patient } = await supabase
      .from('patients')
      .select('telefone, nome')
      .not('telefone', 'is', null)
      .limit(1)
      .single();

    if (!patient?.telefone) {
      console.log('❌ Nenhum paciente com telefone encontrado');
      return;
    }

    console.log('📞 Telefone do paciente:', patient.telefone);
    console.log('👤 Nome do paciente:', patient.nome);

    // Criar checkin de teste
    const checkinTeste = {
      telefone: patient.telefone,
      mes_ano: '2024-12',
      data_checkin: new Date().toISOString().split('T')[0],
      peso: 70.5,
      medida: 85.0,
      treino: '3x por semana',
      total_pontuacao: 85,
      percentual_aproveitamento: 85.0
    };

    console.log('📝 Criando checkin de teste:', checkinTeste);

    const { data: novoCheckin, error: insertError } = await supabase
      .from('checkin')
      .insert(checkinTeste)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir checkin:', insertError);
    } else {
      console.log('✅ Checkin criado com sucesso!');
      console.log('📊 ID do checkin:', novoCheckin.id);

      // Testar busca do checkin com relacionamento
      const { data: checkinComPaciente } = await supabase
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
        .eq('id', novoCheckin.id)
        .single();

      console.log('🔗 Checkin com dados do paciente:', checkinComPaciente);
    }

  } catch (error) {
    console.error('❌ Erro no teste de inserção:', error);
  }
}
