/**
 * Fluxo padrão do check-in mensal.
 * Cada step define: tipo, campo do checkin, pergunta, opções e mensagens condicionais.
 * 
 * Tipos de step:
 * - "message": apenas exibe mensagem (sem input)
 * - "text": campo de texto livre
 * - "number": campo numérico
 * - "choice": seleção única entre opções
 * - "file": upload de fotos
 * 
 * Campos condicionais:
 * - "conditionalMessages": array de { condition, messages }
 *   condition: { field, operator, value } - ex: { field: "treino", operator: "<=", value: "2" }
 *   messages: array de strings exibidas antes do próximo step
 * - "showIf": condição para mostrar o step (ex: só mostra "o que comeu" se ref_livre > 0)
 */

export interface FlowStep {
  id: string;
  type: 'message' | 'text' | 'number' | 'choice' | 'file';
  field?: string; // campo na tabela checkin
  question?: string; // pergunta exibida como mensagem do bot
  messages?: string[]; // mensagens adicionais do bot (antes do input)
  placeholder?: string;
  options?: string[]; // para type "choice"
  required?: boolean;
  showIf?: { field: string; operator: string; value: string };
  conditionalMessages?: {
    condition: { field: string; operator: string; value: string };
    messages: string[];
  }[];
  /** URL de imagem de apoio (ex.: onde medir cintura/quadril) */
  imageUrl?: string;
  /** Posição da imagem em relação ao texto do step: acima ou abaixo */
  imagePosition?: 'above' | 'below';
}

export const DEFAULT_CHECKIN_FLOW: FlowStep[] = [
  // === INTRODUÇÃO ===
  {
    id: 'intro',
    type: 'message',
    messages: [
      'Chegamos no dia de mais um Check-In aqui no Time! 💪',
      'Lembre-se: é importante preencher com sinceridade. Não estou aqui para julgar, mas pra auxiliar na sua evolução!',
      'Vamos lá? 🚀'
    ],
  },

  // === PESO ===
  {
    id: 'peso',
    type: 'text',
    field: 'peso',
    question: 'Você pode me passar qual o seu peso atual, preferencialmente em jejum?',
    messages: ['Lembrando que o peso é só um número na balança! Não precisa se preocupar, pois ele flutua bastante.'],
    placeholder: 'Ex: 72.5',
    required: true,
  },

  // === MEDIDAS ===
  {
    id: 'medida',
    type: 'text',
    field: 'medida',
    question: 'Agora me passe suas medidas:',
    messages: [
      '1. Cintura: meça na menor circunferência da cintura\n2. Quadril: meça na maior circunferência do glúteo',
      'Caso tenha tirado mais medidas, pode enviar também!'
    ],
    placeholder: 'Ex: Cintura: 80cm / Quadril: 95cm',
  },

  // === TREINOS ===
  {
    id: 'treino',
    type: 'choice',
    field: 'treino',
    question: 'Vamos para as perguntas principais! Você está fazendo em média quantos TREINOS POR SEMANA?',
    messages: ['(Coloque a média por semana!)'],
    options: ['Nenhum', '1', '2', '3', '4', '5', '6', '7'],
    required: true,
    conditionalMessages: [
      {
        condition: { field: 'treino', operator: '<=', value: '2' },
        messages: ['A frequência de treinos não está boa não, vamos tentar melhorar para o próximo Check-In? 💪']
      },
      {
        condition: { field: 'treino', operator: 'between', value: '3,4' },
        messages: ['Sua frequência de treinos está razoável, se conseguir bora tentar melhorar um pouco mais! 👊']
      },
      {
        condition: { field: 'treino', operator: '>=', value: '5' },
        messages: ['Sua frequência de treinos está ótima, bora manter essa boa frequência!! 🔥']
      }
    ]
  },

  // === DURAÇÃO DO TREINO ===
  {
    id: 'tempo',
    type: 'text',
    field: 'tempo',
    question: 'Quanto tempo estão durando seus treinos em média? (em minutos)',
    placeholder: 'Ex: 60 minutos',
  },

  // === DESCANSO ENTRE SÉRIES ===
  {
    id: 'descanso',
    type: 'choice',
    field: 'descanso',
    question: 'Está DESCANSANDO QUANTO TEMPO entre as séries?',
    options: ['Mais de 1 minuto', '1 minuto', '45 segundos', '30 segundos'],
    conditionalMessages: [
      {
        condition: { field: 'descanso', operator: '==', value: '30 segundos' },
        messages: ['O descanso está curto! Importante respeitar pelo menos 45s-1min para melhor desempenho e hipertrofia.']
      },
      {
        condition: { field: 'descanso', operator: '==', value: 'Mais de 1 minuto' },
        messages: ['Descanso acima de 1 minuto está OK para exercícios compostos! Para isoladores, tente manter em torno de 1 minuto.']
      }
    ]
  },

  // === CARDIOS ===
  {
    id: 'cardio',
    type: 'choice',
    field: 'cardio',
    question: 'Você está fazendo em média quantos CARDIOS POR SEMANA?',
    messages: ['(Coloque a média por semana!)'],
    options: ['Nenhum', '1', '2', '3', '4', '5', '6', '7'],
    conditionalMessages: [
      {
        condition: { field: 'cardio', operator: '<=', value: '2' },
        messages: ['A frequência de cardio está baixa, vamos tentar melhorar para o próximo Check-In?']
      },
      {
        condition: { field: 'cardio', operator: 'between', value: '3,4' },
        messages: ['Frequência de cardio está razoável, se conseguir bora tentar melhorar um pouco mais!']
      },
      {
        condition: { field: 'cardio', operator: '>=', value: '5' },
        messages: ['Frequência de cardio está ótima, bora manter essa boa pegada!! 🏃']
      }
    ]
  },

  // === DURAÇÃO DO CARDIO ===
  {
    id: 'tempo_cardio',
    type: 'text',
    field: 'tempo_cardio',
    question: 'Quantos minutos em média cada cardio?',
    placeholder: 'Ex: 30 minutos',
    showIf: { field: 'cardio', operator: '!=', value: 'Nenhum' },
  },

  // === REFEIÇÃO LIVRE ===
  {
    id: 'ref_livre',
    type: 'choice',
    field: 'ref_livre',
    question: 'Quantas REFEIÇÕES LIVRES você fez POR SEMANA?',
    messages: ['(Coloque a média por semana!)'],
    options: ['0', '1', '2', '3', '4 ou mais'],
    conditionalMessages: [
      {
        condition: { field: 'ref_livre', operator: '==', value: '0' },
        messages: ['Sem refeição livre! Continue assim que é resultado certo! 🔥']
      },
      {
        condition: { field: 'ref_livre', operator: '<=', value: '2' },
        messages: ['Ótimo, desde que feitas sem exageros, 1-2 é bem de boa! O segredo é moderação.']
      },
      {
        condition: { field: 'ref_livre', operator: '>=', value: '3' },
        messages: ['Eita, muitas refeições livres! Vamos buscar manter no máximo 1-2 por semana? Se exagerar demais pode estragar o resultado de todo esforço. 😅']
      }
    ]
  },

  // === O QUE COMEU REF LIVRE ===
  {
    id: 'oq_comeu_ref_livre',
    type: 'text',
    field: 'oq_comeu_ref_livre',
    question: 'O que você comeu nas refeições livres? Relate também a quantidade!',
    placeholder: 'Ex: Pizza (2 fatias), sorvete...',
    showIf: { field: 'ref_livre', operator: '!=', value: '0' },
  },

  // === BELISCOS ===
  {
    id: 'beliscos',
    type: 'choice',
    field: 'beliscos',
    question: 'BELISCOU quantas vezes em média POR SEMANA?',
    messages: ['(chocolatinhos, biscoitos com café, ou qualquer alimento fora do horário da refeição que não está na dieta)'],
    options: ['0', '1', '2', '3', '4 ou mais'],
    conditionalMessages: [
      {
        condition: { field: 'beliscos', operator: '==', value: '0' },
        messages: ['Show demais, continue assim! Faz uma diferença absurda seguir sem beliscar! 🙌']
      },
      {
        condition: { field: 'beliscos', operator: '>=', value: '3' },
        messages: ['Bora tentar evitar esses beliscos! Mesmo que pareçam pequenos, feitos com frequência podem atrapalhar os resultados.']
      }
    ]
  },

  // === O QUE BELISCOU ===
  {
    id: 'oq_beliscou',
    type: 'text',
    field: 'oq_beliscou',
    question: 'O que você beliscou? Descreva o que e a quantidade.',
    placeholder: 'Ex: Chocolate (1 barra pequena), biscoitos...',
    showIf: { field: 'beliscos', operator: '!=', value: '0' },
  },

  // === COMEU MENOS ===
  {
    id: 'comeu_menos',
    type: 'text',
    field: 'comeu_menos',
    question: 'Você comeu algum alimento A MENOS que o previsto na dieta? Se sim, quantas vezes e quais refeições deixou de comer.',
    placeholder: 'Ex: Sim, deixei de jantar 2 vezes',
  },

  // === FOME ===
  {
    id: 'fome_algum_horario',
    type: 'text',
    field: 'fome_algum_horario',
    question: 'Como estão seus níveis de fome? Está SENTINDO FOME em algum horário do dia? Se sim, que horas?',
    placeholder: 'Ex: Sim, por volta das 14h',
  },

  // === ALIMENTO PARA INCLUIR ===
  {
    id: 'alimento_para_incluir',
    type: 'text',
    field: 'alimento_para_incluir',
    question: 'Há algum alimento que está com vontade ou que queira me sugerir para incluir na sua dieta? Se sim, o que e qual horário?',
    placeholder: 'Ex: Incluir banana às 18h',
  },

  // === ÁGUA ===
  {
    id: 'agua',
    type: 'choice',
    field: 'agua',
    question: 'Vamos avaliar sua HIDRATAÇÃO. Está bebendo em média quantos litros de água por dia?',
    options: ['1 litro', '2 litros', '2,5 litros', '3 litros', '3,5 litros', '4 litros ou mais'],
    conditionalMessages: [
      {
        condition: { field: 'agua', operator: '==', value: '1 litro' },
        messages: ['Hidratação tá baixa! A água tem extrema importância tanto na perda de gordura quanto no ganho de massa. Bora tentar bater pelo menos 2 litros no dia? 💧']
      },
      {
        condition: { field: 'agua', operator: '==', value: '2 litros' },
        messages: ['Hidratação tá legal, mas vamos procurar melhorar um pouco mais? Bora tentar bater 2,5 a 3 litros! 💧']
      },
      {
        condition: { field: 'agua', operator: '>=', value: '3 litros' },
        messages: ['Hidratação tá ótima, parabéns! Mantém que tá show! 💧🔥']
      }
    ]
  },

  // === SONO (HORAS) ===
  {
    id: 'sono',
    type: 'choice',
    field: 'sono',
    question: 'Bora avaliar seu SONO. Quantas horas em média está dormindo por noite?',
    options: ['4 ou menos', '5', '6', '7', '8 ou mais'],
    conditionalMessages: [
      {
        condition: { field: 'sono', operator: '<=', value: '5' },
        messages: ['Caraca, tá dormindo pouco! O ideal é buscar acima de 7h por noite. Sei que a rotina corrida nem sempre permite, mas bora tentar melhorar! 😴']
      },
      {
        condition: { field: 'sono', operator: '==', value: '6' },
        messages: ['Sono tá bacana! 6 horas já é uma quantidade legal. Bora tentar bater 7h? 😴']
      },
      {
        condition: { field: 'sono', operator: '>=', value: '7' },
        messages: ['Sono tá bacana! Bora continuar com foco em manter 7h ou mais que tá perfeito! 😴✅']
      }
    ]
  },

  // === ESTRESSE ===
  {
    id: 'stress',
    type: 'choice',
    field: 'stress',
    question: 'Como está seu nível de ESTRESSE?',
    options: [
      '(10) Vida tranquila!',
      '(7.5) Estresse raro',
      '(5) Estresse sob controle',
      '(2.5) Tá um pouco estressante!',
      '(0) Vida muito estressante!'
    ],
  },

  // === LIBIDO ===
  {
    id: 'libido',
    type: 'choice',
    field: 'libido',
    question: 'Sua saúde sexual também é importante. Como está sua LIBIDO?',
    options: [
      '(10) Está perfeita!',
      '(7.5) Tá boa!',
      '(5) Mediana',
      '(2.5) Está um pouco ruim',
      '(0) Totalmente sem libido!'
    ],
  },

  // === MELHORA VISUAL ===
  {
    id: 'melhora_visual',
    type: 'choice',
    field: 'melhora_visual',
    question: 'Você sentiu que teve melhora visual ou nas medidas?',
    options: ['Sim', 'Não'],
  },

  // === QUAIS PONTOS ===
  {
    id: 'quais_pontos',
    type: 'text',
    field: 'quais_pontos',
    question: 'Notou isso principalmente em quais partes do físico?',
    placeholder: 'Ex: Barriga, braços, pernas...',
    showIf: { field: 'melhora_visual', operator: '==', value: 'Sim' },
  },

  // === OBJETIVO ===
  {
    id: 'objetivo',
    type: 'choice',
    field: 'objetivo',
    question: 'Perfeito, agora vamos alinhar nossas metas! Qual seu objetivo principal para os próximos dias?',
    options: [
      'Diminuir o percentual de gordura',
      'Aumentar a massa muscular',
      'Melhora de saúde',
      'Manter/Seguir o planejamento',
      'Outro'
    ],
  },

  // === DIFICULDADES ===
  {
    id: 'dificuldades',
    type: 'text',
    field: 'dificuldades',
    question: 'Tem algo mais a acrescentar ou está com alguma dificuldade no planejamento?',
    messages: ['Pode relatar com o máximo de detalhes possíveis, para que eu possa te ajudar da melhor maneira e te dar um Feedback! 💬'],
    placeholder: 'Relate aqui suas dificuldades...',
  },

  // === FOTOS ===
  {
    id: 'fotos',
    type: 'file',
    field: 'fotos',
    question: 'Agora só preciso das suas fotos! 📸',
    messages: [
      'As fotos devem ser tiradas em local bem iluminado, preferencialmente em jejum, enquadrando o corpo inteiro.',
      'Fotos de frente, de perfil e de costas. Se não tiver alguém para tirar, filme e tire prints!',
      'Se não conseguir enviar agora, pode enviar pelo WhatsApp depois.'
    ],
  },

  // === FINALIZAÇÃO ===
  {
    id: 'fim',
    type: 'message',
    messages: [
      'Check-in Enviado! ✅',
      'Muito obrigado por preencher tudo!',
      'Em até 48 horas úteis te darei o feedback sobre o seu Check-in! 💪🎯'
    ],
  },
];
