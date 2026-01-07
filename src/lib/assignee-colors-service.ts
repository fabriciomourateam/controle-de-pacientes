/**
 * Serviço para gerenciar cores personalizadas dos responsáveis por check-ins
 */

export interface AssigneeColor {
  bg: string;
  border: string;
  text: string;
  icon: string;
  hover: string;
}

export interface CardColor {
  border: string;
  hoverBorder: string;
}

// Cores disponíveis para escolha
export const availableColors: AssigneeColor[] = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', icon: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', icon: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/50', text: 'text-pink-400', icon: 'text-pink-400', hover: 'hover:bg-pink-500/30' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400', icon: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400', icon: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', icon: 'text-orange-400', hover: 'hover:bg-orange-500/30' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-400', icon: 'text-indigo-400', hover: 'hover:bg-indigo-500/30' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400', icon: 'text-rose-400', hover: 'hover:bg-rose-500/30' },
];

export const availableCardColors: CardColor[] = [
  { border: 'border-l-4 border-blue-500/60', hoverBorder: 'hover:border-blue-500/80' },
  { border: 'border-l-4 border-purple-500/60', hoverBorder: 'hover:border-purple-500/80' },
  { border: 'border-l-4 border-pink-500/60', hoverBorder: 'hover:border-pink-500/80' },
  { border: 'border-l-4 border-cyan-500/60', hoverBorder: 'hover:border-cyan-500/80' },
  { border: 'border-l-4 border-emerald-500/60', hoverBorder: 'hover:border-emerald-500/80' },
  { border: 'border-l-4 border-orange-500/60', hoverBorder: 'hover:border-orange-500/80' },
  { border: 'border-l-4 border-indigo-500/60', hoverBorder: 'hover:border-indigo-500/80' },
  { border: 'border-l-4 border-rose-500/60', hoverBorder: 'hover:border-rose-500/80' },
];

// Nomes das cores para exibição
export const colorNames = [
  'Azul',
  'Roxo',
  'Rosa',
  'Ciano',
  'Esmeralda',
  'Laranja',
  'Índigo',
  'Rosa Escuro',
];

class AssigneeColorsService {
  private readonly STORAGE_KEY = 'assignee_colors_mapping';

  /**
   * Obter mapeamento de cores salvo
   */
  getColorMapping(): Record<string, number> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao ler mapeamento de cores:', error);
    }
    return {};
  }

  /**
   * Salvar mapeamento de cores
   */
  saveColorMapping(mapping: Record<string, number>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mapping));
    } catch (error) {
      console.error('Erro ao salvar mapeamento de cores:', error);
    }
  }

  /**
   * Definir cor para um membro específico
   */
  setMemberColor(userId: string, colorIndex: number): void {
    const mapping = this.getColorMapping();
    mapping[userId] = colorIndex;
    this.saveColorMapping(mapping);
  }

  /**
   * Obter índice da cor de um membro
   */
  getMemberColorIndex(userId: string): number | null {
    const mapping = this.getColorMapping();
    return mapping[userId] !== undefined ? mapping[userId] : null;
  }

  /**
   * Remover cor personalizada de um membro (volta ao padrão)
   */
  removeMemberColor(userId: string): void {
    const mapping = this.getColorMapping();
    delete mapping[userId];
    this.saveColorMapping(mapping);
  }

  /**
   * Obter cor do responsável (com fallback para índice padrão)
   */
  getAssigneeColor(userId: string | null | undefined, teamMembers: Array<{ user_id: string }>, defaultIndex?: number): AssigneeColor | null {
    if (!userId || userId === 'unassigned') return null;
    
    // Tentar obter cor personalizada
    const customIndex = this.getMemberColorIndex(userId);
    if (customIndex !== null && customIndex >= 0 && customIndex < availableColors.length) {
      return availableColors[customIndex];
    }
    
    // Se não tiver cor personalizada, usar índice padrão baseado na posição
    if (defaultIndex !== undefined) {
      return availableColors[defaultIndex % availableColors.length];
    }
    
    const memberIndex = teamMembers.findIndex(m => m.user_id === userId);
    if (memberIndex === -1) return null;
    
    return availableColors[memberIndex % availableColors.length];
  }

  /**
   * Obter cor do card (com fallback para índice padrão)
   */
  getAssigneeCardColor(userId: string | null | undefined, teamMembers: Array<{ user_id: string }>, defaultIndex?: number): CardColor | null {
    if (!userId || userId === 'unassigned') return null;
    
    // Tentar obter cor personalizada
    const customIndex = this.getMemberColorIndex(userId);
    if (customIndex !== null && customIndex >= 0 && customIndex < availableCardColors.length) {
      return availableCardColors[customIndex];
    }
    
    // Se não tiver cor personalizada, usar índice padrão baseado na posição
    if (defaultIndex !== undefined) {
      return availableCardColors[defaultIndex % availableCardColors.length];
    }
    
    const memberIndex = teamMembers.findIndex(m => m.user_id === userId);
    if (memberIndex === -1) return null;
    
    return availableCardColors[memberIndex % availableCardColors.length];
  }
}

export const assigneeColorsService = new AssigneeColorsService();
