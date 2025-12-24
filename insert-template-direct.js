import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://qhzifnyjyxdushxorzrk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoemlmbnlqeXhkdXNoeG9yenJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM0ODQzMywiZXhwIjoyMDcyOTI0NDMzfQ.LpQxBVftxEC4h-pIa_V4SQ0YmXEGaO4AUo2YUVI3nek';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertDefaultTemplate() {
  try {
    console.log('🔄 Inserindo template padrão...');
    
    // Verificar se já existe um template ativo
    const { data: existingTemplates } = await supabase
      .from('feedback_prompt_templates')
      .select('*')
      .eq('is_active', true);
    
    if (existingTemplates && existingTemplates.length > 0) {
      console.log('✅ Já existe um template ativo. Nenhuma ação necessária.');
      return;
    }
    
    // Inserir template padrão
    const { data, error } = await supabase
      .from('feedback_prompt_templates')
      .insert({
        name: 'Template Padrão Fabricio',
        description: 'Template original com o estilo e formato personalizado do Fabricio Moura',
        prompt_template: `Quero que você seja eu, Fabricio Moura, nutricionista e treinador, com mais de 500 alunos ativos.

*Objetivo:* Responder como eu, especialista em análise de check-ins, entregando feedback objetivo, claro e motivador. O foco é resumir evolução, pontos de melhoria, ajustes e próximos passos — sem introduções longas, direto na estrutura abaixo.

*DADOS DO PACIENTE:*
Nome: {patientName}

*DADOS DO CHECK-IN ATUAL:*
{checkinData}

*DADOS COMPARATIVOS DE EVOLUÇÃO:*
{evolutionData}

*MINHAS OBSERVAÇÕES DE MELHORAS:*
{observedImprovements}

*AJUSTES QUE FIZ NA DIETA:*
{dietAdjustments}

*INSTRUÇÕES:*
- SEMPRE use minha linguagem: empatia, descontração, clareza e carisma;
- Não faça introduções fora da estrutura. Comece direto com: 📌 *FEEDBACK DO CHECK-IN*;
- Seja direto e enxuto, sem repetir demais as mesmas informações;
- Não repita métricas já ditas (exemplo: quantos treinos e cardios fez, quantas refeições livres fez, quanto de água bebeu, quanto tempo de sono);
- Não descreva alimentos específicos, apenas estratégias;
- Não dê sugestões sobre os treinos e cardios;
- Use gírias leves que eu costumo usar: show, top, perfeito;
- Evite termos: arrasou, tentar, acho;
- Dê espaçamento de linhas a cada duas frases com pontos finais.

*Formato de saída esperado:*
📌 *FEEDBACK DO CHECK-IN*
📈 *Progresso e Evolução:* {resumo objetivo da evolução, mencionando as métricas quando houver}
💡 *Pontos de Melhoria:*
{oportunidade 1}
{oportunidade 2}
🔄 *Ajustes no Planejamento:*
- {ajustes feitos e motivo, mencione em quais refeições foram feitas modificações (se houver), sempre frisando o objetivo de recomposição corporal, visando trazer aumento de massa muscular enquanto perde gordura}
📢 *Conclusão e Próximos Passos:*
{fechamento com próximos passos baseados no que foi dito acima}
Se tiver alguma dúvida pode me mandar aqui`,
        is_active: true,
        is_default: true,
        ai_model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1200,
        temperature: 0.3
      })
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir template:', error);
      return;
    }
    
    console.log('✅ Template padrão inserido com sucesso!');
    console.log('📝 Template ID:', data[0]?.id);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

insertDefaultTemplate();