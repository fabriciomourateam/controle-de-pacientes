// Componente de comparação de canais com filtro de mês
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Calendar } from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

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
  const [hasInitialized, setHasInitialized] = useState(false);

  // Inicializar com o mês atual quando os dados chegarem (apenas uma vez)
  useEffect(() => {
    if (availableMonths && availableMonths.length > 0 && !hasInitialized) {
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
      
      const found = availableMonths.find(m => {
        if (!m) return false;
        const mLower = m.toLowerCase();
        return currentMonthVariations.some(variant => 
          mLower.includes(variant) || variant.includes(mLower)
        );
      });
      
      // Se não encontrou o mês atual, usar o mais recente (primeiro da lista)
      const defaultMonth = found || availableMonths[0];
      setSelectedMonth(defaultMonth);
      if (onMonthChange) {
        onMonthChange(defaultMonth);
      }
      setHasInitialized(true);
    }
  }, [availableMonths, hasInitialized, onMonthChange]);

  // Notificar o componente pai quando o mês mudar
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (onMonthChange) {
      onMonthChange(month);
    }
  };

  // Buscar dados do mês selecionado
  const selectedLeadsData = allMonthsData.leads.find(l => l.LEADS === selectedMonth);
  const selectedCallsData = allMonthsData.calls.find(c => c.AGENDADAS === selectedMonth);

  if (!selectedLeadsData || !selectedCallsData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" />
            Comparação Detalhada por Canal
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

  // Ordem fixa dos canais (não reordena ao trocar de mês)
  const channels = [
    {
      name: 'Google',
      icon: '🔍',
      leads: Math.round(processValue(selectedLeadsData.LEAD_GOOGLE)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_GOOGLE)),
      color: 'from-blue-500 to-blue-600',
    },
    {
      name: 'Google Forms',
      icon: '📝',
      leads: Math.round(processValue(selectedLeadsData.LEAD_GOOGLE_FORMS)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_GOOGLE_FORMS)),
      color: 'from-green-500 to-green-600',
    },
    {
      name: 'Instagram',
      icon: '📸',
      leads: Math.round(processValue(selectedLeadsData.LEAD_INSTAGRAM)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_INSTAGRAM)),
      color: 'from-pink-500 to-purple-600',
    },
    {
      name: 'Facebook',
      icon: '👥',
      leads: Math.round(processValue(selectedLeadsData.LEAD_FACEBOOK)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_FACEBOOK)),
      color: 'from-blue-600 to-indigo-600',
    },
    {
      name: 'Seller',
      icon: '💼',
      leads: Math.round(processValue(selectedLeadsData.LEAD_SELLER)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_SELLER)),
      color: 'from-orange-500 to-red-600',
    },
    {
      name: 'Indicação',
      icon: '👋',
      leads: Math.round(processValue(selectedLeadsData.LEAD_INDICACAO)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_INDICACAO)),
      color: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Outros',
      icon: '📊',
      leads: Math.round(processValue(selectedLeadsData.LEAD_OUTROS)),
      calls: Math.round(processValue(selectedCallsData.AGENDADOS_OUTROS)),
      color: 'from-gray-500 to-gray-600',
    },
  ].map(channel => ({
    ...channel,
    conversion: channel.leads > 0 ? (channel.calls / channel.leads) * 100 : 0,
  }));

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Comparação Detalhada por Canal
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              Análise completa: Leads → Calls → Taxa de Conversão
            </CardDescription>
          </div>
          
          {/* Filtro de Mês */}
          {availableMonths.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[160px] bg-slate-700/50 border-slate-600/50 text-slate-300">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {availableMonths.map((month) => (
                    <SelectItem 
                      key={month} 
                      value={month}
                      className="text-slate-300 focus:bg-slate-700 focus:text-white"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
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

