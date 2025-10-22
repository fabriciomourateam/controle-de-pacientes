const { createClient } = require('@supabase/supabase-js');

// Usar variáveis de ambiente diretamente
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArianeData() {
  console.log('🔍 Verificando dados da Ariane (5511962941286)...\n');
  
  try {
    // Buscar dados do paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('telefone', '5511962941286')
      .single();
      
    if (patientError) {
      console.error('❌ Erro ao buscar paciente:', patientError);
      return;
    }
    
    console.log('👤 DADOS DO PACIENTE:');
    console.log('Nome:', patient.nome);
    console.log('Peso Inicial (patients.peso_inicial):', patient.peso_inicial);
    console.log('Peso (patients.peso):', patient.peso);
    console.log('');
    
    // Buscar check-ins
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', '5511962941286')
      .order('data_checkin', { ascending: true });
      
    if (checkinsError) {
      console.error('❌ Erro ao buscar check-ins:', checkinsError);
      return;
    }
    
    console.log('📊 CHECK-INS:');
    checkins.forEach((checkin, index) => {
      console.log(`Check-in ${index + 1}:`);
      console.log('  Data:', checkin.data_checkin);
      console.log('  Peso:', checkin.peso);
      console.log('  Mes/Ano:', checkin.mes_ano);
      console.log('');
    });
    
    // Buscar bioimpedância
    const { data: bioimpedancia, error: bioError } = await supabase
      .from('bioimpedancia')
      .select('*')
      .eq('telefone', '5511962941286')
      .order('data_bioimpedancia', { ascending: true });
      
    if (bioError) {
      console.error('❌ Erro ao buscar bioimpedância:', bioError);
    } else {
      console.log('⚖️ BIOIMPEDÂNCIA:');
      bioimpedancia.forEach((bio, index) => {
        console.log(`Bioimpedância ${index + 1}:`);
        console.log('  Data:', bio.data_bioimpedancia);
        console.log('  Peso:', bio.peso);
        console.log('  IMC:', bio.imc);
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkArianeData();
