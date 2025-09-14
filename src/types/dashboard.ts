export interface DashboardDados {
  id: number;
  // Campos flexíveis (podem vir como TEXT do Notion)
  mes: string | null;
  ano: string | number | null;
  mes_numero: string | number | null;
  data_referencia: string | null;
  ativos_total_inicio_mes: string | number | null;
  saldo_entrada_saida: string | number | null;
  entraram: string | number | null;
  sairam: string | number | null;
  vencimentos: string | number | null;
  nao_renovou: string | number | null;
  desistencia: string | number | null;
  congelamento: string | number | null;
  percentual_renovacao: string | number | null;
  percentual_churn: string | number | null;
  churn_max: string | number | null;
  
  // Campos adicionais do Notion (como na tabela patients)
  nome?: string | null;
  apelido?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  genero?: string | null;
  data_nascimento?: string | null;
  inicio_acompanhamento?: string | null;
  plano?: string | null;
  tempo_acompanhamento?: string | null;
  vencimento?: string | null;
  dias_para_vencer?: string | null;
  valor?: string | null;
  ticket_medio?: string | null;
  rescisao_30_percent?: string | null;
  pagamento?: string | null;
  observacao?: string | null;
  indicacoes?: string | null;
  lembrete?: string | null;
  telefone_filtro?: string | null;
  antes_depois?: string | null;
  
  // Campos de meses
  janeiro?: string | null;
  fevereiro?: string | null;
  marco?: string | null;
  abril?: string | null;
  maio?: string | null;
  junho?: string | null;
  julho?: string | null;
  agosto?: string | null;
  setembro?: string | null;
  outubro?: string | null;
  novembro?: string | null;
  dezembro?: string | null;
  
  // Campos de controle
  created_at?: string | null;
  updated_at?: string | null;
}

export interface DashboardMetricas {
  id: number;
  // Campos básicos (convertidos automaticamente nas views)
  mes: string;
  ano: number;
  mes_numero: number;
  data_referencia: string;
  ativos_total_inicio_mes: number;
  saldo_entrada_saida: number;
  entraram: number;
  sairam: number;
  vencimentos: number;
  nao_renovou: number;
  desistencia: number;
  congelamento: number;
  percentual_renovacao: number;
  percentual_churn: number;
  churn_max: number;
  
  // Campos calculados automaticamente
  taxa_crescimento?: number;
  taxa_churn_calculada?: number;
  status_saude?: string;
  crescimento_mensal?: number;
  taxa_retencao_media?: number;
  eficiencia_conversao?: number;
  projecao_proximo_mes?: number;
  indicador_saude?: number;
}

export interface UltimosMeses {
  id: number;
  mes: string;
  ano: number;
  mes_numero: number;
  data_referencia: string;
  ativos_total_inicio_mes: number;
  saldo_entrada_saida: number;
  entraram: number;
  sairam: number;
  vencimentos: number;
  nao_renovou: number;
  desistencia: number;
  congelamento: number;
  percentual_renovacao: number;
  percentual_churn: number;
  churn_max: number;
  // Campos calculados automaticamente
  taxa_crescimento?: number;
  taxa_churn_calculada?: number;
  status_saude?: string;
}

export interface AlertaDashboard {
  id: number;
  tipo: 'churn_alto' | 'renovacao_baixa' | 'crescimento_negativo' | 'vencimentos_altos' | string;
  mensagem: string;
  valor: string | number;
  limite: string | number | null;
  data_referencia: string;
  prioridade: 'baixa' | 'media' | 'alta' | string;
  ativo?: boolean;
}

export interface KPIMetric {
  titulo: string;
  valor: number | string;
  variacao?: number;
  variacao_tipo?: 'positiva' | 'negativa' | 'neutra';
  icone: string;
  cor: string;
  descricao: string;
}

export interface ChartData {
  mes: string;
  ativos: number;
  entraram: number;
  sairam: number;
  renovacao: number;
  churn: number;
  crescimento?: number;
  saldo?: number;
  eficiencia?: number;
}

export interface GrowthMetrics {
  totalGrowth: number;
  monthlyGrowth: number;
  averageMonthlyGrowth: number;
  growthTrend: 'growing' | 'declining' | 'stable';
  projectedNextMonth: number;
  growthRate: number;
}

export interface RetentionMetrics {
  averageRetention: number;
  retentionTrend: 'improving' | 'declining' | 'stable';
  churnRate: number;
  churnTrend: 'improving' | 'worsening' | 'stable';
  retentionHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface HealthMetrics {
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' | 'unknown';
  recommendations: string[];
  riskFactors: string[];
}

export interface DashboardFilters {
  ano?: number;
  meses?: number;
  tipo_periodo?: 'ano' | 'meses';
}

export interface DashboardState {
  dados: DashboardMetricas[];
  ultimosMeses: UltimosMeses[];
  alertas: AlertaDashboard[];
  kpis: KPIMetric[];
  chartData: ChartData[];
  loading: boolean;
  error: string | null;
  filters: DashboardFilters;
}
