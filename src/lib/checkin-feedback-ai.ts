import Anthropic from '@anthropic-ai/sdk';

interface CheckinFeedbackData {
  patientName: string;
  checkinData: any;
  evolutionData: any;
  observedImprovements: string;
  dietAdjustments: string;
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  ai_model: string;
  max_tokens: number;
  temperature: number;
}

// Cache para economizar tokens
interface CacheEntry {
  hash: string;
  feedback: string;
  timestamp: number;
}

class FeedbackCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

  generateHash(data: any): string {
    return btoa(JSON.stringify(data)).slice(0, 32);
  }

  get(hash: string): string | null {
    const entry = this.cache.get(hash);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(hash);
      return null;
    }
    
    return entry.feedback;
  }

  set(hash: string, feedback: string): void {
    this.cache.set(hash, {
      hash,
      feedback,
      timestamp: Date.now()
    });
  }
}

class CheckinFeedbackAI {
  private anthropic: Anthropic;
  private cache = new FeedbackCache();
  
  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_ANTHROPIC_API_KEY não está configurada. Configure a variável de ambiente.');
      throw new Error('Chave da API do Anthropic não configurada. Configure VITE_ANTHROPIC_API_KEY no arquivo .env.local ou nas variáveis de ambiente da Vercel.');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Permitir uso no browser
    });
  }

  // Normalizar nome do modelo para garantir compatibilidade
  private normalizeModel(model: string): string {
    // Mapear modelos Sonnet para o formato mais recente (Claude Sonnet 4.5)
    const modelMap: Record<string, string> = {
      // Modelo mais recente - Claude Sonnet 4.5
      'claude-sonnet-4-5-20250929': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4.5': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
      
      // Modelos anteriores (migrar para Sonnet 4.5)
      'claude-3-7-sonnet-20250219': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20241022': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet-20240620': 'claude-sonnet-4-5-20250929',
      'claude-3-5-sonnet': 'claude-sonnet-4-5-20250929',
      'claude-sonnet-4-20250514': 'claude-sonnet-4-5-20250929',
    };
    
    // Se for um modelo Sonnet, usar o formato mais recente
    if (model.includes('sonnet')) {
      return modelMap[model] || 'claude-sonnet-4-5-20250929';
    }
    
    // Manter outros modelos como estão
    return model;
  }

  async generateFeedback(
    data: CheckinFeedbackData, 
    template: PromptTemplate
  ): Promise<string> {
    // Verificar cache primeiro
    const cacheKey = this.cache.generateHash({ data, template: template.id });
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Usando feedback do cache');
      return cachedResult;
    }

    const prompt = this.buildPromptFromTemplate(data, template);
    
    // Normalizar modelo para garantir que seja válido
    let normalizedModel = this.normalizeModel(template.ai_model);
    const originalModel = template.ai_model;
    const isSonnet = originalModel.includes('sonnet');
    
    try {
      const response = await this.anthropic.messages.create({
        model: normalizedModel,
        max_tokens: template.max_tokens,
        temperature: template.temperature,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      // Verificar se o primeiro bloco de conteúdo é do tipo texto
      const firstContent = response.content[0];
      if (firstContent.type !== 'text') {
        throw new Error('Resposta da IA não contém texto');
      }
      
      const feedback = firstContent.text;
      
      // Salvar no cache
      this.cache.set(cacheKey, feedback);
      
      return feedback;
    } catch (error: any) {
      console.error('Erro ao gerar feedback:', error);
      throw new Error('Falha ao gerar feedback. Verifique sua chave da API do Anthropic e tente novamente.');
    }
  }

  private buildPromptFromTemplate(data: CheckinFeedbackData, template: PromptTemplate): string {
    let prompt = template.prompt_template;
    
    // Substituir variáveis no template
    prompt = prompt.replace(/{patientName}/g, data.patientName || 'Paciente');
    prompt = prompt.replace(/{checkinData}/g, this.formatCheckinData(data.checkinData));
    prompt = prompt.replace(/{evolutionData}/g, this.formatEvolutionData(data.evolutionData));
    prompt = prompt.replace(/{observedImprovements}/g, data.observedImprovements || 'Nenhuma observação específica registrada.');
    prompt = prompt.replace(/{dietAdjustments}/g, data.dietAdjustments || 'Nenhum ajuste específico realizado.');
    
    return prompt;
  }

  private formatCheckinData(data: any): string {
    if (!data) return 'Dados do check-in não disponíveis.';
    
    try {
      const formatted = [];
      
      if (data.peso) {
        const peso = typeof data.peso === 'string' ? data.peso.replace(',', '.') : data.peso;
        formatted.push(`Peso: ${peso}kg`);
      }
      if (data.medida) {
        const medida = typeof data.medida === 'string' ? data.medida.replace(',', '.') : data.medida;
        formatted.push(`Medida: ${medida}cm`);
      }
      if (data.treino) formatted.push(`Treinos realizados: ${data.treino}`);
      if (data.cardio) formatted.push(`Cardio: ${data.cardio}`);
      if (data.agua) formatted.push(`Água: ${data.agua}`);
      if (data.sono) formatted.push(`Sono: ${data.sono}`);
      if (data.ref_livre) formatted.push(`Refeições livres: ${data.ref_livre}`);
      if (data.beliscos) formatted.push(`Beliscos: ${data.beliscos}`);
      if (data.melhora_visual) formatted.push(`Melhora visual: ${data.melhora_visual}`);
      if (data.dificuldades) formatted.push(`Dificuldades: ${data.dificuldades}`);
      if (data.objetivo) formatted.push(`Objetivo: ${data.objetivo}`);
      if (data.stress) formatted.push(`Nível de stress: ${data.stress}`);
      if (data.total_pontuacao) formatted.push(`Pontuação total: ${data.total_pontuacao} pontos`);
      if (data.percentual_aproveitamento) formatted.push(`Aproveitamento: ${data.percentual_aproveitamento}%`);
      
      // Novos campos alimentares
      if (data.oq_comeu_ref_livre) formatted.push(`O que comeu na refeição livre: ${data.oq_comeu_ref_livre}`);
      if (data.oq_beliscou) formatted.push(`O que beliscou: ${data.oq_beliscou}`);
      if (data.comeu_menos_planejado) formatted.push(`Comeu menos que o planejado: ${data.comeu_menos_planejado}`);
      if (data.fome_horario) formatted.push(`Fome em algum horário: ${data.fome_horario}`);
      if (data.alimento_incluir) formatted.push(`Alimento para incluir: ${data.alimento_incluir}`);
      if (data.quais_pontos) formatted.push(`Quais pontos melhoraram: ${data.quais_pontos}`);
      
      return formatted.length > 0 ? formatted.join('\n') : JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify(data, null, 2);
    }
  }

  private formatEvolutionData(data: any): string {
    if (!data) return 'Dados comparativos não disponíveis.';
    
    try {
      const formatted = [];
      
      if (data.peso_diferenca !== undefined) {
        const sinal = data.peso_diferenca > 0 ? '+' : '';
        formatted.push(`Variação de peso: ${sinal}${data.peso_diferenca}kg`);
      }
      
      if (data.cintura_diferenca !== undefined) {
        const sinal = data.cintura_diferenca > 0 ? '+' : '';
        formatted.push(`Variação medida: ${sinal}${data.cintura_diferenca}cm`);
      }
      
      if (data.aderencia !== undefined) {
        formatted.push(`Aproveitamento geral: ${data.aderencia}%`);
      }
      
      return formatted.length > 0 ? formatted.join('\n') : JSON.stringify(data, null, 2);
    } catch (error) {
      return JSON.stringify(data, null, 2);
    }
  }

  // Método para testar prompt com dados de exemplo
  async testPromptWithSampleData(template: PromptTemplate): Promise<string> {
    const sampleData: CheckinFeedbackData = {
      patientName: 'Maria Silva',
      checkinData: {
        peso: 65.0,
        medida: 68,
        treino: '4/4',
        cardio: '3/3',
        agua: '2.5L',
        sono: '7h',
        ref_livre: '1',
        melhora_visual: 'Sim, principalmente nos braços',
        dificuldades: 'Pouca sede durante o dia',
        total_pontuacao: 85,
        percentual_aproveitamento: 95
      },
      evolutionData: {
        peso_diferenca: -0.4,
        cintura_diferenca: -2,
        aderencia: 95
      },
      observedImprovements: 'Visualmente mais volume e definição no corpo todo, principalmente nos braços e pernas. Postura melhorou significativamente.',
      dietAdjustments: 'Aumentei proteína no café da manhã para melhor saciedade. Ajustei carboidrato do jantar para otimizar recuperação.'
    };

    return this.generateFeedback(sampleData, template);
  }
}

export const checkinFeedbackAI = new CheckinFeedbackAI();
export type { CheckinFeedbackData, PromptTemplate };