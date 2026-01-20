// Componente de comparação de canais com filtro de mês
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Target, Calendar, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from '@/integrations/supabase/types';

type SortOption = 'conversion' | 'leads' | 'calls' | 'name';

type TotalDeLeads = Database['public']['Tables']['Total de Leads']['Row'];
type TotalDeCallsAgendadas = Database['public']['Tables']['Total de Calls Agendadas']['Row'];

export interface ChannelComparisonWithFilterProps {
  availableMonths: string[];
  allMonthsData: {
    leads: TotalDeLeads[];
    calls: TotalDeCallsAgendadas[];
  };
  initialMonth?: string;
  onMonthChange?: (month: string) => void;
}

// Função para obter o nome do mês atual
const getCurrentMonthName = () => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const currentMonth = new Date().getMonth();
  return months[currentMonth];
};

export function ChannelComparisonWithFilter(props: ChannelComparisonWithFilterProps) {
  const { availableMonths, allMonthsData, initialMonth, onMonthChange } = props;
  const [selectedMonth, setSelectedMonth] = useState('');
  const hasInitializedRef = useRef(false); // Usar ref em vez de state
  const { toast } = useToast();
  
  // Estabilizar availableMonths para evitar re-execução do useEffect
  // Usar JSON.stringify para garantir que a comparação seja por valor, não por referência
  const stableAvailableMonths = useMemo(() => {
    return availableMonths;
  }, [JSON.stringify(availableMonths)]);
  
  // Carregar preferência de visualização do localStorage (padrão: compacta)
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('channelComparisonViewExpanded');
    return saved === 'true' ? true : false; // Padrão: compacta (false)
  });

  // Estado de ordenação (padrão: por taxa de conversão, decrescente)
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem('channelComparisonSortBy');
    return (saved as SortOption) || 'conversion';
  });
  const [sortAscending, setSortAscending] = useState(() => {
    const saved = localStorage.getItem('channelComparisonSortAscending');
    return saved === 'true' ? true : false; // Padrão: decrescente
  });

  // Função para alternar visualização e salvar preferência
  const toggleView = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    localStorage.setItem('channelComparisonViewExpanded', String(newValue));
    toast({
      title: newValue ? "Visão expandida ativada" : "Visão compacta ativada",
      description: "Sua preferência foi salva automaticamente",
    });
  };

  // Função para alterar ordenação
  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // Se clicar na mesma coluna, inverte a ordem
      const newAscending = !sortAscending;
      setSortAscending(newAscending);
      localStorage.setItem('channelComparisonSortAscending', String(newAscending));
    } else {
      // Se mudar de coluna, começa decrescente (exceto nome que começa crescente)
      setSortBy(newSortBy);
      const defaultAscending = newSortBy === 'name';
      setSortAscending(defaultAscending);
      localStorage.setItem('channelComparisonSortBy', newSortBy);
      localStorage.setItem('channelComparisonSortAscending', String(defaultAscending));
    }
  };

  // Inicializar com o mês atual quando os dados chegarem (apenas uma vez)
  useEffect(() => {
    // IMPORTANTE: Só inicializar se ainda não foi inicializado E se não há mês selecionado
    if (stableAvailableMonths && stableAvailableMonths.length > 0 && !hasInitializedRef.current && !selectedMonth) {
      // Sempre tentar selecionar o mês atual primeiro (ignorar initialMonth se vier errado)
      const currentMonth = getCurrentMonthName();
      
      // Mapa de meses para lidar com abreviações
      const monthMap: { [key: string]: string[] } = {
        'Janeiro': ['jan', 'janeiro'],
        'Fevereiro': ['fev', 'fevereiro'],
        'Março': ['mar', 'março', 'marco'],
        'Abril': ['abr', 'abril'],
        'Maio': ['mai', 'maio'],
        'Junho': ['jun', 'junho'],
        'Julho': ['jul', 'julho'],
        'Agosto': ['ago', 'agosto'],
        'Setembro': ['set', 'setembro'],
        'Outubro': ['out', 'outubro'],
        'Novembro': ['nov', 'novembro'],
        'Dezembro': ['dez', 'dezembro']
      };
      
      const currentMonthVariations = monthMap[currentMonth] || [currentMonth.toLowerCase()];
      
      const found = stableAvailableMonths.find(m => {
        if (!m) return false;
        const mLower = m.toLowerCase();
        return currentMonthVariations.some(variant => 
          mLower.includes(variant) || variant.includes(mLower)
        );
      });
      
      // Se não encontrou o mês atual, usar o mais recente (primeiro da lista)
      const defaultMonth = found || stableAvailableMonths[0];
      setSelectedMonth(defaultMonth);
      if (onMonthChange) {
        onMonthChange(defaultMonth);
      }
      hasInitializedRef.current = true; // Marcar como inicializado usando ref
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableAvailableMonths]); // Usar stableAvailableMonths em vez de availableMonths

  // Notificar o componente pai quando o mês mudar (mas não reinicializar)
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (onMonthChange) {
      onMonthChange(month);
    }
  };

  // Identificar ano do mês (JUN-DEZ = 2025, outros = 2026)
  const getYearFromMonth = (month: string): number => {
    if (!month) return 2026;
    const monthUpper = month.toUpperCase();
    // Meses de 2025: APENAS JUNHO, JULHO, AGOSTO, SETEMBRO, OUTUBRO, NOVEMBRO, DEZEMBRO
    const months2025 = ['JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    // Verificar se o mês contém alguma das abreviações de 2025
    const is2025 = months2025.some(abbr => monthUpper.includes(abbr));
    return is2025 ? 2025 : 2026;
  };

  // Agrupar meses por ano e adicionar opções especiais
  const monthOptions = [
    { value: 'TODOS', label: 'Todos os Meses', isSpecial: true },
    { value: 'TOTAL_2025', label: '2025 (Total)', isSpecial: true },
    { value: 'TOTAL_2026', label: '2026 (Total)', isSpecial: true },
    ...availableMonths.map(month => {
      const year = getYearFromMonth(month);
      // Se já tem /26 ou /25 no nome, não adicionar novamente
      const hasYearSuffix = month.includes('/26') || month.includes('/25');
      const label = (year === 2026 && !hasYearSuffix) ? `${month}/26` : month;
      return {
        value: month,
        label,
        isSpecial: false,
        year
      };
    })
  ];

  // Função auxiliar para processar valores individuais (converte 0.x para x*100)
  const processIndividualValue = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'number' ? value : parseFloat(value.toString().replace(',', '.'));
    if (isNaN(num)) return 0;
    // Se está entre 0 e 1, multiplica por 100
    if (num > 0 && num < 1) return num * 100;
    return num;
  };

  // Calcular dados baseado na seleção
  const getDisplayData = () => {
    if (selectedMonth === 'TODOS') {
      // Somar todos os meses - processar cada valor antes de somar
      const totals = allMonthsData.leads.reduce((acc, leadData) => {
        const callData = allMonthsData.calls.find(c => c.AGENDADAS === leadData.LEADS);
        return {
          leads: {
            LEAD_GOOGLE: acc.leads.LEAD_GOOGLE + processIndividualValue(leadData.LEAD_GOOGLE),
            LEAD_GOOGLE_FORMS: acc.leads.LEAD_GOOGLE_FORMS + processIndividualValue(leadData.LEAD_GOOGLE_FORMS),
            LEAD_INSTAGRAM: acc.leads.LEAD_INSTAGRAM + processIndividualValue(leadData.LEAD_INSTAGRAM),
            LEAD_FACEBOOK: acc.leads.LEAD_FACEBOOK + processIndividualValue(leadData.LEAD_FACEBOOK),
            LEAD_SELLER: acc.leads.LEAD_SELLER + processIndividualValue(leadData.LEAD_SELLER),
            LEAD_INDICACAO: acc.leads.LEAD_INDICACAO + processIndividualValue(leadData.LEAD_INDICACAO),
            LEAD_OUTROS: acc.leads.LEAD_OUTROS + processIndividualValue(leadData.LEAD_OUTROS),
          },
          calls: {
            AGENDADOS_GOOGLE: acc.calls.AGENDADOS_GOOGLE + processIndividualValue(callData?.AGENDADOS_GOOGLE),
            AGENDADOS_GOOGLE_FORMS: acc.calls.AGENDADOS_GOOGLE_FORMS + processIndividualValue(callData?.AGENDADOS_GOOGLE_FORMS),
            AGENDADOS_INSTAGRAM: acc.calls.AGENDADOS_INSTAGRAM + processIndividualValue(callData?.AGENDADOS_INSTAGRAM),
            AGENDADOS_FACEBOOK: acc.calls.AGENDADOS_FACEBOOK + processIndividualValue(callData?.AGENDADOS_FACEBOOK),
            AGENDADOS_SELLER: acc.calls.AGENDADOS_SELLER + processIndividualValue(callData?.AGENDADOS_SELLER),
            AGENDADOS_INDICACAO: acc.calls.AGENDADOS_INDICACAO + processIndividualValue(callData?.AGENDADOS_INDICACAO),
            AGENDADOS_OUTROS: acc.calls.AGENDADOS_OUTROS + processIndividualValue(callData?.AGENDADOS_OUTROS),
          }
        };
      }, {
        leads: { LEAD_GOOGLE: 0, LEAD_GOOGLE_FORMS: 0, LEAD_INSTAGRAM: 0, LEAD_FACEBOOK: 0, LEAD_SELLER: 0, LEAD_INDICACAO: 0, LEAD_OUTROS: 0 },
        calls: { AGENDADOS_GOOGLE: 0, AGENDADOS_GOOGLE_FORMS: 0, AGENDADOS_INSTAGRAM: 0, AGENDADOS_FACEBOOK: 0, AGENDADOS_SELLER: 0, AGENDADOS_INDICACAO: 0, AGENDADOS_OUTROS: 0 }
      });
      return totals;
    } else if (selectedMonth === 'TOTAL_2025' || selectedMonth === 'TOTAL_2026') {
      // Somar apenas meses do ano selecionado - processar cada valor antes de somar
      const targetYear = selectedMonth === 'TOTAL_2025' ? 2025 : 2026;
      const totals = allMonthsData.leads.reduce((acc, leadData) => {
        const year = getYearFromMonth(leadData.LEADS || '');
        if (year !== targetYear) return acc;
        
        const callData = allMonthsData.calls.find(c => c.AGENDADAS === leadData.LEADS);
        return {
          leads: {
            LEAD_GOOGLE: acc.leads.LEAD_GOOGLE + processIndividualValue(leadData.LEAD_GOOGLE),
            LEAD_GOOGLE_FORMS: acc.leads.LEAD_GOOGLE_FORMS + processIndividualValue(leadData.LEAD_GOOGLE_FORMS),
            LEAD_INSTAGRAM: acc.leads.LEAD_INSTAGRAM + processIndividualValue(leadData.LEAD_INSTAGRAM),
            LEAD_FACEBOOK: acc.leads.LEAD_FACEBOOK + processIndividualValue(leadData.LEAD_FACEBOOK),
            LEAD_SELLER: acc.leads.LEAD_SELLER + processIndividualValue(leadData.LEAD_SELLER),
            LEAD_INDICACAO: acc.leads.LEAD_INDICACAO + processIndividualValue(leadData.LEAD_INDICACAO),
            LEAD_OUTROS: acc.leads.LEAD_OUTROS + processIndividualValue(leadData.LEAD_OUTROS),
          },
          calls: {
            AGENDADOS_GOOGLE: acc.calls.AGENDADOS_GOOGLE + processIndividualValue(callData?.AGENDADOS_GOOGLE),
            AGENDADOS_GOOGLE_FORMS: acc.calls.AGENDADOS_GOOGLE_FORMS + processIndividualValue(callData?.AGENDADOS_GOOGLE_FORMS),
            AGENDADOS_INSTAGRAM: acc.calls.AGENDADOS_INSTAGRAM + processIndividualValue(callData?.AGENDADOS_INSTAGRAM),
            AGENDADOS_FACEBOOK: acc.calls.AGENDADOS_FACEBOOK + processIndividualValue(callData?.AGENDADOS_FACEBOOK),
            AGENDADOS_SELLER: acc.calls.AGENDADOS_SELLER + processIndividualValue(callData?.AGENDADOS_SELLER),
            AGENDADOS_INDICACAO: acc.calls.AGENDADOS_INDICACAO + processIndividualValue(callData?.AGENDADOS_INDICACAO),
            AGENDADOS_OUTROS: acc.calls.AGENDADOS_OUTROS + processIndividualValue(callData?.AGENDADOS_OUTROS),
          }
        };
      }, {
        leads: { LEAD_GOOGLE: 0, LEAD_GOOGLE_FORMS: 0, LEAD_INSTAGRAM: 0, LEAD_FACEBOOK: 0, LEAD_SELLER: 0, LEAD_INDICACAO: 0, LEAD_OUTROS: 0 },
        calls: { AGENDADOS_GOOGLE: 0, AGENDADOS_GOOGLE_FORMS: 0, AGENDADOS_INSTAGRAM: 0, AGENDADOS_FACEBOOK: 0, AGENDADOS_SELLER: 0, AGENDADOS_INDICACAO: 0, AGENDADOS_OUTROS: 0 }
      });
      return totals;
    } else {
      // Mês individual
      const selectedLeadsData = allMonthsData.leads.find(l => l.LEADS === selectedMonth);
      const selectedCallsData = allMonthsData.calls.find(c => c.AGENDADAS === selectedMonth);
      return {
        leads: selectedLeadsData || {},
        calls: selectedCallsData || {}
      };
    }
  };

  const displayData = getDisplayData();
  const selectedLeadsData = displayData.leads;
  const selectedCallsData = displayData.calls;

  if (!selectedLeadsData || !selectedCallsData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" />
            Leads que vão para Call
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  // Processar dados dos canais
  const processValue = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') {
      // Se está entre 0 e 1, multiplica por 100
      if (value > 0 && value < 1) return value * 100;
      return value;
    }
    const num = parseFloat(value.toString().replace(',', '.'));
    if (num > 0 && num < 1) return num * 100;
    return num || 0;
  };

  // Para somatórias, os valores já foram processados no getDisplayData
  // Não processar novamente
  const isSummary = ['TODOS', 'TOTAL_2025', 'TOTAL_2026'].includes(selectedMonth);

  // Ordem fixa dos canais (não reordena ao trocar de mês)
  const channelsBase = [
    {
      name: 'Google',
      icon: '🔍',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_GOOGLE || 0) : Math.round(processValue(selectedLeadsData.LEAD_GOOGLE)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_GOOGLE || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_GOOGLE)),
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Google Forms',
      icon: '📝',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_GOOGLE_FORMS || 0) : Math.round(processValue(selectedLeadsData.LEAD_GOOGLE_FORMS)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_GOOGLE_FORMS || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_GOOGLE_FORMS)),
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Instagram',
      icon: '📸',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_INSTAGRAM || 0) : Math.round(processValue(selectedLeadsData.LEAD_INSTAGRAM)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_INSTAGRAM || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_INSTAGRAM)),
      color: 'from-pink-500 to-purple-600',
    },
    {
      name: 'Facebook',
      icon: '👥',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_FACEBOOK || 0) : Math.round(processValue(selectedLeadsData.LEAD_FACEBOOK)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_FACEBOOK || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_FACEBOOK)),
      color: 'from-blue-600 to-indigo-600',
    },
    {
      name: 'Seller',
      icon: '💼',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_SELLER || 0) : Math.round(processValue(selectedLeadsData.LEAD_SELLER)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_SELLER || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_SELLER)),
      color: 'from-orange-500 to-red-600',
    },
    {
      name: 'Indicação',
      icon: '👋',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_INDICACAO || 0) : Math.round(processValue(selectedLeadsData.LEAD_INDICACAO)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_INDICACAO || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_INDICACAO)),
      color: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Outros',
      icon: '📊',
      leads: isSummary ? Math.round(selectedLeadsData.LEAD_OUTROS || 0) : Math.round(processValue(selectedLeadsData.LEAD_OUTROS)),
      calls: isSummary ? Math.round(selectedCallsData.AGENDADOS_OUTROS || 0) : Math.round(processValue(selectedCallsData.AGENDADOS_OUTROS)),
      color: 'from-gray-500 to-gray-600',
    },
  ].map(channel => ({
    ...channel,
    conversion: channel.leads > 0 ? (channel.calls / channel.leads) * 100 : 0,
  }));

  // Aplicar ordenação
  const channels = [...channelsBase].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'conversion':
        comparison = a.conversion - b.conversion;
        break;
      case 'leads':
        comparison = a.leads - b.leads;
        break;
      case 'calls':
        comparison = a.calls - b.calls;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    
    return sortAscending ? comparison : -comparison;
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Leads que vão para Call
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {selectedMonth === 'TODOS' && 'Todos os meses • Somatória total'}
              {selectedMonth === 'TOTAL_2025' && 'Ano 2025 • Somatória do ano'}
              {selectedMonth === 'TOTAL_2026' && 'Ano 2026 • Somatória do ano'}
              {!['TODOS', 'TOTAL_2025', 'TOTAL_2026'].includes(selectedMonth) && 
                `${selectedMonth} • Percentual de leads que vão para Call de Vendas`
              }
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Filtro de Mês */}
            {availableMonths.length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Select
                  value={selectedMonth}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[180px] bg-slate-700/50 border-slate-600/50 text-slate-300">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {monthOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className={`text-slate-300 focus:bg-slate-700 focus:text-white ${
                          option.isSpecial ? 'font-semibold border-b border-slate-600/50' : ''
                        }`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Botão de alternar visualização */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleView}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Visão Compacta
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Visão Expandida
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          // Visão Expandida (Cards em grid)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel, index) => (
              <div
                key={index}
                className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{channel.icon}</span>
                  <h3 className="text-lg font-bold text-white">{channel.name}</h3>
                </div>

                {/* Métricas em grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-blue-500/10 rounded p-2 text-center">
                    <p className="text-xs text-blue-400 font-semibold">Leads</p>
                    <p className="text-lg font-bold text-white">{channel.leads.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-green-500/10 rounded p-2 text-center">
                    <p className="text-xs text-green-400 font-semibold">Calls</p>
                    <p className="text-lg font-bold text-white">{channel.calls.toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {/* Taxa de conversão destacada */}
                <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/30">
                  <p className="text-xs text-purple-400 font-semibold mb-1">Taxa de Conversão</p>
                  <p className={`text-3xl font-bold ${
                    channel.conversion >= 21 ? 'text-green-400' : 
                    channel.conversion >= 15 ? 'text-yellow-400' : 
                    channel.conversion >= 10 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {channel.conversion.toFixed(1)}%
                  </p>
                </div>

                {/* Barra de progresso */}
                <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden mt-3">
                  <div 
                    className={`absolute h-full transition-all duration-500 bg-gradient-to-r ${
                      channel.conversion >= 21 ? 'from-green-500 to-green-600' : 
                      channel.conversion >= 15 ? 'from-yellow-500 to-yellow-600' : 
                      channel.conversion >= 10 ? 'from-orange-500 to-orange-600' :
                      'from-red-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min(channel.conversion, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Visão Compacta (Tabela)
          <div className="space-y-2">
            {/* Header da tabela - Clicável para ordenar */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-700/30 rounded-lg text-xs font-semibold text-slate-400">
              <button
                onClick={() => handleSortChange('name')}
                className="col-span-4 flex items-center gap-1 hover:text-slate-200 transition-colors text-left"
              >
                Canal
                {sortBy === 'name' && (
                  <ArrowUpDown className={`w-3 h-3 ${sortAscending ? 'rotate-180' : ''}`} />
                )}
              </button>
              <button
                onClick={() => handleSortChange('leads')}
                className="col-span-2 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors"
              >
                Leads
                {sortBy === 'leads' && (
                  <ArrowUpDown className={`w-3 h-3 ${sortAscending ? 'rotate-180' : ''}`} />
                )}
              </button>
              <button
                onClick={() => handleSortChange('calls')}
                className="col-span-2 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors"
              >
                Calls
                {sortBy === 'calls' && (
                  <ArrowUpDown className={`w-3 h-3 ${sortAscending ? 'rotate-180' : ''}`} />
                )}
              </button>
              <button
                onClick={() => handleSortChange('conversion')}
                className="col-span-2 flex items-center justify-center gap-1 hover:text-slate-200 transition-colors"
              >
                Taxa
                {sortBy === 'conversion' && (
                  <ArrowUpDown className={`w-3 h-3 ${sortAscending ? 'rotate-180' : ''}`} />
                )}
              </button>
              <div className="col-span-2"></div>
            </div>
            
            {/* Linhas da tabela */}
            {channels.map((channel, index) => (
              <div 
                key={index}
                className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-700/20 hover:bg-slate-700/40 rounded-lg border border-slate-600/20 hover:border-blue-500/30 transition-all"
              >
                {/* Nome do canal com emoji */}
                <div className="col-span-4 flex items-center gap-2">
                  <span className="text-xl">{channel.icon}</span>
                  <span className="text-slate-200 font-medium text-sm truncate" title={channel.name}>
                    {channel.name}
                  </span>
                </div>
                
                {/* Leads */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-blue-400 font-semibold">
                    {channel.leads.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {/* Calls */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className="text-green-400 font-semibold">
                    {channel.calls.toLocaleString('pt-BR')}
                  </span>
                </div>
                
                {/* Taxa de conversão */}
                <div className="col-span-2 flex items-center justify-center">
                  <span className={`text-lg font-bold ${
                    channel.conversion >= 21 ? 'text-green-400' : 
                    channel.conversion >= 15 ? 'text-yellow-400' : 
                    channel.conversion >= 10 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {channel.conversion.toFixed(1)}%
                  </span>
                </div>
                
                {/* Barra de progresso */}
                <div className="col-span-2 flex items-center">
                  <div className="relative w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full transition-all duration-500 bg-gradient-to-r ${
                        channel.conversion >= 21 ? 'from-green-500 to-green-600' : 
                        channel.conversion >= 15 ? 'from-yellow-500 to-yellow-600' : 
                        channel.conversion >= 10 ? 'from-orange-500 to-orange-600' :
                        'from-red-500 to-red-600'
                      }`}
                      style={{ width: `${Math.min(channel.conversion, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legenda */}
        <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300">≥ 21% <span className="text-green-400 font-semibold">Excelente</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-300">15-20% <span className="text-yellow-400 font-semibold">Bom</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-slate-300">10-14% <span className="text-orange-400 font-semibold">Regular</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-300">&lt; 10% <span className="text-red-400 font-semibold">Baixo</span></span>
            </div>
          </div>
        </div>

        {channels.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            Nenhum dado disponível para o mês selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
}

