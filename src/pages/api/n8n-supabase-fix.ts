import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    
    console.log('=== DADOS RECEBIDOS DO N8N ===');
    console.log('Body:', JSON.stringify(data, null, 2));
    console.log('================================');

    // Função para mapear dados do n8n para campos exatos da tabela
    const mapN8NToSupabase = (n8nData: any) => {
      const mapped: any = {};
      
      // Mapeamento exato dos campos (apenas os que existem na tabela)
      if (n8nData.nome) mapped.nome = n8nData.nome;
      if (n8nData.apelido) mapped.apelido = n8nData.apelido;
      if (n8nData.cpf) mapped.cpf = n8nData.cpf;
      if (n8nData.email) mapped.email = n8nData.email;
      if (n8nData.telefone) mapped.telefone = n8nData.telefone;
      if (n8nData.genero) mapped.genero = n8nData.genero;
      if (n8nData.data_nascimento) mapped.data_nascimento = n8nData.data_nascimento;
      if (n8nData.inicio_acompanhamento) mapped.inicio_acompanhamento = n8nData.inicio_acompanhamento;
      if (n8nData.plano) mapped.plano = n8nData.plano;
      if (n8nData.tempo_acompanhamento) mapped.tempo_acompanhamento = n8nData.tempo_acompanhamento;
      if (n8nData.vencimento) mapped.vencimento = n8nData.vencimento;
      if (n8nData.dias_para_vencer) mapped.dias_para_vencer = n8nData.dias_para_vencer;
      if (n8nData.valor) mapped.valor = n8nData.valor;
      if (n8nData.ticket_medio) mapped.ticket_medio = n8nData.ticket_medio;
      if (n8nData.rescisao_30_percent) mapped.rescisao_30_percent = n8nData.rescisao_30_percent;
      if (n8nData.pagamento) mapped.pagamento = n8nData.pagamento;
      if (n8nData.observacao) mapped.observacao = n8nData.observacao;
      if (n8nData.indicacoes) mapped.indicacoes = n8nData.indicacoes;
      if (n8nData.lembrete) mapped.lembrete = n8nData.lembrete;
      if (n8nData.telefone_filtro) mapped.telefone_filtro = n8nData.telefone_filtro;
      if (n8nData.antes_depois) mapped.antes_depois = n8nData.antes_depois;
      if (n8nData.janeiro) mapped.janeiro = n8nData.janeiro;
      if (n8nData.fevereiro) mapped.fevereiro = n8nData.fevereiro;
      if (n8nData.marco) mapped.marco = n8nData.marco;
      if (n8nData.abril) mapped.abril = n8nData.abril;
      if (n8nData.maio) mapped.maio = n8nData.maio;
      if (n8nData.junho) mapped.junho = n8nData.junho;
      if (n8nData.julho) mapped.julho = n8nData.julho;
      if (n8nData.agosto) mapped.agosto = n8nData.agosto;
      if (n8nData.setembro) mapped.setembro = n8nData.setembro;
      if (n8nData.outubro) mapped.outubro = n8nData.outubro;
      if (n8nData.novembro) mapped.novembro = n8nData.novembro;
      if (n8nData.dezembro) mapped.dezembro = n8nData.dezembro;
      if (n8nData.peso) mapped.peso = n8nData.peso;
      if (n8nData.medida) mapped.medida = n8nData.medida;
      if (n8nData.treino) mapped.treino = n8nData.treino;
      if (n8nData.cardio) mapped.cardio = n8nData.cardio;
      if (n8nData.agua) mapped.agua = n8nData.agua;
      if (n8nData.sono) mapped.sono = n8nData.sono;
      if (n8nData.ref_livre) mapped.ref_livre = n8nData.ref_livre;
      if (n8nData.beliscos) mapped.beliscos = n8nData.beliscos;
      if (n8nData.oq_comeu_ref_livre) mapped.oq_comeu_ref_livre = n8nData.oq_comeu_ref_livre;
      if (n8nData.oq_beliscou) mapped.oq_beliscou = n8nData.oq_beliscou;
      if (n8nData.comeu_menos) mapped.comeu_menos = n8nData.comeu_menos;
      if (n8nData.fome_algum_horario) mapped.fome_algum_horario = n8nData.fome_algum_horario;
      if (n8nData.alimento_para_incluir) mapped.alimento_para_incluir = n8nData.alimento_para_incluir;
      if (n8nData.melhora_visual) mapped.melhora_visual = n8nData.melhora_visual;
      if (n8nData.quais_pontos) mapped.quais_pontos = n8nData.quais_pontos;
      if (n8nData.objetivo) mapped.objetivo = n8nData.objetivo;
      if (n8nData.dificuldades) mapped.dificuldades = n8nData.dificuldades;
      if (n8nData.stress) mapped.stress = n8nData.stress;
      if (n8nData.libido) mapped.libido = n8nData.libido;
      if (n8nData.tempo) mapped.tempo = n8nData.tempo;
      if (n8nData.descanso) mapped.descanso = n8nData.descanso;
      if (n8nData.tempo_cardio) mapped.tempo_cardio = n8nData.tempo_cardio;
      if (n8nData.foto_1) mapped.foto_1 = n8nData.foto_1;
      if (n8nData.foto_2) mapped.foto_2 = n8nData.foto_2;
      if (n8nData.foto_3) mapped.foto_3 = n8nData.foto_3;
      if (n8nData.foto_4) mapped.foto_4 = n8nData.foto_4;
      if (n8nData.telefone_checkin) mapped.telefone_checkin = n8nData.telefone_checkin;
      if (n8nData.pontos_treinos) mapped.pontos_treinos = n8nData.pontos_treinos;
      if (n8nData.pontos_cardios) mapped.pontos_cardios = n8nData.pontos_cardios;
      if (n8nData.pontos_descanso_entre_series) mapped.pontos_descanso_entre_series = n8nData.pontos_descanso_entre_series;
      if (n8nData.pontos_refeicao_livre) mapped.pontos_refeicao_livre = n8nData.pontos_refeicao_livre;
      if (n8nData.pontos_beliscos) mapped.pontos_beliscos = n8nData.pontos_beliscos;
      if (n8nData.pontos_agua) mapped.pontos_agua = n8nData.pontos_agua;
      if (n8nData.pontos_sono) mapped.pontos_sono = n8nData.pontos_sono;
      if (n8nData.pontos_qualidade_sono) mapped.pontos_qualidade_sono = n8nData.pontos_qualidade_sono;
      if (n8nData.pontos_stress) mapped.pontos_stress = n8nData.pontos_stress;
      if (n8nData.pontos_libido) mapped.pontos_libido = n8nData.pontos_libido;
      if (n8nData.total_pontuacao) mapped.total_pontuacao = n8nData.total_pontuacao;
      if (n8nData.percentual_aproveitamento) mapped.percentual_aproveitamento = n8nData.percentual_aproveitamento;
      
      return mapped;
    };

    // Se for um array, processar em lote
    if (Array.isArray(data)) {
      const mappedData = data.map(mapN8NToSupabase);
      
      console.log('Dados mapeados:', JSON.stringify(mappedData, null, 2));
      
      const { data: result, error } = await supabase
        .from('patients')
        .insert(mappedData)
        .select('id');
      
      if (error) {
        console.error('Erro ao inserir dados:', error);
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
      const mappedData = mapN8NToSupabase(data);
      
      console.log('Dados mapeados:', JSON.stringify(mappedData, null, 2));
      
      const { data: result, error } = await supabase
        .from('patients')
        .insert(mappedData)
        .select('id');
      
      if (error) {
        console.error('Erro ao inserir dados:', error);
        return res.status(400).json({
          success: false,
          error: error.message,
          details: error
        });
      }
      
      return res.status(200).json({
        success: true,
        imported: 1
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
