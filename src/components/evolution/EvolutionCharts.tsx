import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Scatter
} from "recharts";
import { TrendingUp, Activity, Target, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Ruler, Eye, EyeOff, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";
import { weightTrackingService } from "@/lib/weight-tracking-service";
import { extractMeasurements } from "@/lib/measurement-utils";

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface EvolutionChartsProps {
  checkins: Checkin[];
  patient?: Patient | null;
  refreshTrigger?: number; // Trigger para forçar atualização
  onAddData?: () => void; // Callback para abrir modal de adicionar dados
}

export function EvolutionCharts({ checkins, patient, refreshTrigger, onAddData }: EvolutionChartsProps) {
  const [selectedCheckinIndex, setSelectedCheckinIndex] = useState(0);
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());
  const [dailyWeights, setDailyWeights] = useState<any[]>([]);
  const [isPerformanceMinimized, setIsPerformanceMinimized] = useState(true); // Iniciar minimizado
  const [disabledMeasurements, setDisabledMeasurements] = useState<Set<string>>(new Set()); // IDs das medições desativadas
  const [disabledWeights, setDisabledWeights] = useState<Set<string>>(new Set()); // IDs dos pesos desativados
  const [hiddenMeasurements, setHiddenMeasurements] = useState<Set<string>>(new Set()); // IDs das medições ocultas
  const [hiddenWeights, setHiddenWeights] = useState<Set<string>>(new Set()); // IDs dos pesos ocultos
  const [showWeightTable, setShowWeightTable] = useState(false); // Controla visibilidade da tabela de peso
  const [showMeasurementsTable, setShowMeasurementsTable] = useState(false); // Controla visibilidade da tabela de medidas
  
  // IMPORTANTE: checkins vem ordenado DESC (mais recente primeiro)
  // Precisamos reverter para ordem cronológica (mais antigo primeiro)
  const checkinsOrdenados = [...checkins].reverse();

  // Buscar pesos diários - atualiza quando telefone muda ou quando refreshTrigger muda
  useEffect(() => {
    const loadDailyWeights = async () => {
      if (patient?.telefone) {
        try {
          const weights = await weightTrackingService.getByTelefone(patient.telefone);
          setDailyWeights(weights || []);
        } catch (error) {
          console.error('Erro ao carregar pesos diários:', error);
        }
      }
    };
    loadDailyWeights();
  }, [patient?.telefone, refreshTrigger]); // Adicionar refreshTrigger como dependência
  
  // Para o radar, queremos mostrar do mais recente (índice 0 do array original)
  const checkinsForRadar = checkins; // Array original já está do mais recente ao mais antigo

  // Função para alternar visibilidade de uma série
  const toggleSeries = (seriesName: string) => {
    setHiddenSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seriesName)) {
        newSet.delete(seriesName);
      } else {
        newSet.add(seriesName);
      }
      return newSet;
    });
  };

  // Função para alternar ativação de uma medição na tabela
  const toggleMeasurement = (measurementId: string) => {
    setDisabledMeasurements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(measurementId)) {
        newSet.delete(measurementId);
      } else {
        newSet.add(measurementId);
      }
      return newSet;
    });
  };

  // Função para alternar visibilidade de uma medição na tabela
  const toggleMeasurementVisibility = (measurementId: string) => {
    setHiddenMeasurements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(measurementId)) {
        newSet.delete(measurementId);
      } else {
        newSet.add(measurementId);
      }
      return newSet;
    });
  };

  // Função para alternar ativação de um peso na tabela
  const toggleWeight = (weightId: string) => {
    setDisabledWeights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weightId)) {
        newSet.delete(weightId);
      } else {
        newSet.add(weightId);
      }
      return newSet;
    });
  };

  // Função para alternar visibilidade de um peso na tabela
  const toggleWeightVisibility = (weightId: string) => {
    setHiddenWeights(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weightId)) {
        newSet.delete(weightId);
      } else {
        newSet.add(weightId);
      }
      return newSet;
    });
  };

  // Componente de legenda customizado
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
        {payload?.map((entry: any, index: number) => {
          const isHidden = hiddenSeries.has(entry.dataKey);
          return (
            <div
              key={`legend-${entry.dataKey}-${index}`}
              onClick={() => toggleSeries(entry.dataKey)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ opacity: isHidden ? 0.5 : 1 }}
            >
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-300">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Preparar dados para gráfico de peso - incluindo peso inicial, diários e check-ins
  const weightData = [];
  
  // Adicionar peso inicial se existir (pacientes cadastrados manualmente)
  const patientWithInitialData = patient as any;
  if (patientWithInitialData?.peso_inicial) {
    const dataInicial = patientWithInitialData.data_fotos_iniciais || patient?.created_at;
    const dataInicialPoint = {
      id: 'inicial',
      data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      dataCompleta: new Date(dataInicial).toISOString(),
      peso: parseFloat(patientWithInitialData.peso_inicial.toString()),
      tipo: 'Inicial',
      tipoVisual: 'inicial', // Para estilização no gráfico
      aproveitamento: null
    };
    weightData.push(dataInicialPoint);
  }

  // Adicionar peso atual se existir (quando não há check-ins mas há dados atuais)
  if (patientWithInitialData?.peso_atual && checkins.length === 0) {
    const dataAtual = patientWithInitialData.data_fotos_atuais || new Date().toISOString();
    const dataAtualPoint = {
      id: 'atual',
      data: new Date(dataAtual).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      dataCompleta: new Date(dataAtual).toISOString(),
      peso: parseFloat(patientWithInitialData.peso_atual.toString()),
      tipo: 'Atual',
      tipoVisual: 'atual', // Para estilização no gráfico
      aproveitamento: null
    };
    weightData.push(dataAtualPoint);
  }
  
  // Adicionar pesos diários (weight_tracking)
  dailyWeights.forEach((weight) => {
    const pesoValue = weight.peso_jejum || weight.peso_dia;
    if (pesoValue) {
      const dataPoint = {
        id: `daily-${weight.id}`,
        data: new Date(weight.data_pesagem).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        dataCompleta: weight.data_pesagem,
        peso: parseFloat(pesoValue.toString()),
        tipo: `Peso ${weight.tipo === 'jejum' ? 'Jejum' : 'Dia'}`,
        tipoVisual: 'diario', // Para estilização no gráfico (pontos pequenos, cinza)
        aproveitamento: null
      };
      weightData.push(dataPoint);
    }
  });
  
  // Adicionar dados dos check-ins mensais
  checkinsOrdenados.forEach((c, index) => {
    // Priorizar peso_jejum se existir, senão usar peso
    const pesoCheckin = (c as any).peso_jejum || c.peso;
    if (pesoCheckin) {
      const pesoValue = typeof pesoCheckin === 'string' 
        ? parseFloat(pesoCheckin.replace(',', '.'))
        : parseFloat(pesoCheckin.toString());
      const dataPoint = {
        id: c.id,
        data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        dataCompleta: c.data_checkin,
        peso: pesoValue,
        tipo: index === 0 ? '1º Check-in' : 'Check-in',
        tipoVisual: 'checkin', // Para estilização no gráfico (pontos grandes, azul)
        aproveitamento: parseFloat(c.percentual_aproveitamento || '0') || null
      };
      weightData.push(dataPoint);
    }
  });

  // Ordenar todos os dados por data
  weightData.sort((a, b) => new Date(a.dataCompleta).getTime() - new Date(b.dataCompleta).getTime());

  // Preparar dados para gráfico de pontuações
  const scoresData = checkinsOrdenados.map(c => ({
    data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    treino: parseFloat(c.pontos_treinos || '0') || 0,
    cardio: parseFloat(c.pontos_cardios || '0') || 0,
    sono: parseFloat(c.pontos_sono || '0') || 0,
    agua: parseFloat(c.pontos_agua || '0') || 0,
    stress: parseFloat(c.pontos_stress || '0') || 0,
    refeicoesLivres: parseFloat(c.pontos_refeicao_livre || '0') || 0,
    beliscadas: parseFloat(c.pontos_beliscos || '0') || 0
  }));

  // Preparar dados para gráfico de quantidades
  const quantitiesData = checkinsOrdenados.map(c => {
    // Função para verificar se o texto indica ausência/negativo
    const isNegative = (text: string): boolean => {
      const textLower = text.toLowerCase().trim();
      const negativeWords = ['nenhum', 'nenhuma', 'não', 'nao', 'zero', '0', 'sem', 'nada'];
      return negativeWords.some(word => textLower.includes(word));
    };

    // Função para extrair número de um texto, tratando "ou mais" e decimais
    const extractQuantity = (text: string | null): number => {
      if (!text || text.trim() === '') return 0;
      
      const textLower = text.toLowerCase().trim();
      
      // Verifica se indica ausência/negativo
      if (isNegative(textLower)) {
        return 0;
      }
      
      // Verifica se tem "ou mais" e extrai o número antes (incluindo decimais)
      const ouMaisMatch = textLower.match(/(\d+[.,]?\d*)\s*ou\s*mais/);
      if (ouMaisMatch) {
        return parseFloat(ouMaisMatch[1].replace(',', '.'));
      }
      
      // Tenta extrair número decimal (aceita vírgula ou ponto como separador)
      const decimalMatch = text.match(/(\d+[.,]\d+)/);
      if (decimalMatch) {
        return parseFloat(decimalMatch[1].replace(',', '.'));
      }
      
      // Tenta extrair qualquer número inteiro do texto
      const numMatch = text.match(/(\d+)/);
      if (numMatch) {
        return parseFloat(numMatch[1]);
      }
      
      // Se não tem número mas tem conteúdo e não é negativo, retorna 1
      return 1;
    };

    // Função para extrair número de texto (para sono, treino, cardio, etc)
    const extractNumberFromText = (text: string | null): number => {
      if (!text || text.trim() === '') return 0;
      
      const textLower = text.toLowerCase().trim();
      
      // Verifica se indica ausência/negativo
      if (isNegative(textLower)) {
        return 0;
      }
      
      // Verifica se tem "ou mais" e extrai o número antes (incluindo decimais)
      const ouMaisMatch = textLower.match(/(\d+[.,]?\d*)\s*ou\s*mais/);
      if (ouMaisMatch) {
        return parseFloat(ouMaisMatch[1].replace(',', '.'));
      }
      
      // Tenta extrair número decimal (aceita vírgula ou ponto como separador)
      const decimalMatch = text.match(/(\d+[.,]\d+)/);
      if (decimalMatch) {
        return parseFloat(decimalMatch[1].replace(',', '.'));
      }
      
      // Tenta extrair qualquer número inteiro do texto
      const numMatch = text.match(/(\d+)/);
      if (numMatch) {
        return parseFloat(numMatch[1]);
      }
      
      // Se não tem número mas tem conteúdo e não é negativo, retorna 1
      return 1;
    };

    return {
      data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      treino: extractNumberFromText(c.treino),
      cardio: extractNumberFromText(c.cardio),
      sono: extractNumberFromText(c.sono),
      agua: extractQuantity(c.agua),
      stress: extractNumberFromText(c.stress),
      refeicoesLivres: extractQuantity(c.ref_livre),
      beliscadas: extractQuantity(c.beliscos)
    };
  });

  // Preparar dados para radar - permite navegar entre check-ins
  const selectedCheckin = checkinsForRadar[selectedCheckinIndex];
  const radarData = selectedCheckin ? [
    { categoria: 'Treino', pontos: parseFloat(selectedCheckin.pontos_treinos || '0') || 0, fullMark: 10 },
    { categoria: 'Cardio', pontos: parseFloat(selectedCheckin.pontos_cardios || '0') || 0, fullMark: 10 },
    { categoria: 'Água', pontos: parseFloat(selectedCheckin.pontos_agua || '0') || 0, fullMark: 10 },
    { categoria: 'Sono', pontos: parseFloat(selectedCheckin.pontos_sono || '0') || 0, fullMark: 10 },
    { categoria: 'Stress', pontos: parseFloat(selectedCheckin.pontos_stress || '0') || 0, fullMark: 10 },
    { categoria: 'Libido', pontos: parseFloat(selectedCheckin.pontos_libido || '0') || 0, fullMark: 10 }
  ] : [];

  const handlePreviousCheckin = () => {
    if (selectedCheckinIndex < checkinsForRadar.length - 1) {
      setSelectedCheckinIndex(selectedCheckinIndex + 1);
    }
  };

  const handleNextCheckin = () => {
    if (selectedCheckinIndex > 0) {
      setSelectedCheckinIndex(selectedCheckinIndex - 1);
    }
  };

  // weightData já está ordenado cronologicamente (mais antigo primeiro)


  // Combinar todos os dados de peso em ordem cronológica
  const allWeightData = [...weightData].sort((a, b) => 
    new Date(a.dataCompleta).getTime() - new Date(b.dataCompleta).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Gráfico de Peso - Mostrar se houver qualquer dado de peso */}
      {allWeightData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Evolução do Peso
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Acompanhamento do peso ao longo do tempo
                </CardDescription>
              </div>
              {onAddData && (
                <button
                  onClick={onAddData}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105"
                  title="Adicionar dados"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                <span>Peso Inicial</span>
              </div>
              {allWeightData.some(d => d.tipoVisual === 'atual') && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <span>Peso Atual</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                <span>Pesos Diários</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                <span>Check-ins Mensais</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={allWeightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="dataCompleta"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                  }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      let tipoLabel = 'Peso';
                      if (data.tipoVisual === 'inicial') tipoLabel = 'Peso Inicial';
                      else if (data.tipoVisual === 'atual') tipoLabel = 'Peso Atual';
                      else if (data.tipoVisual === 'checkin') tipoLabel = 'Peso Check-in';
                      else if (data.tipoVisual === 'diario') tipoLabel = `Peso Diário (${data.tipo.includes('Jejum') ? 'Jejum' : 'Dia'})`;
                      else tipoLabel = data.tipo || 'Peso';

                      return (
                        <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                          <p className="text-slate-300 text-sm mb-1">Data: {data.data}</p>
                          <p className="text-white font-semibold">{tipoLabel}: {data.peso} kg</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  name="Peso (kg)"
                  dot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (!cx || !cy) return null;
                    
                    const tipoVisual = payload?.tipoVisual || 'checkin';
                    const key = `dot-${payload?.id || index || cx}-${cy}-${tipoVisual}`;
                    
                    // Peso Inicial: ponto grande verde
                    if (tipoVisual === 'inicial') {
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#22c55e"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    
                    // Peso Atual: ponto grande verde esmeralda
                    if (tipoVisual === 'atual') {
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#10b981"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    
                    // Check-in Mensal: ponto grande azul
                    if (tipoVisual === 'checkin') {
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill="#3b82f6"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }
                    
                    // Peso Diário: ponto pequeno cinza
                    if (tipoVisual === 'diario') {
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={3}
                          fill="#64748b"
                        />
                      );
                    }
                    
                    // Fallback
                    return (
                      <circle
                        key={key}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#94a3b8"
                      />
                    );
                  }}
                  activeDot={(props) => {
                    const { cx, cy, payload, index } = props;
                    if (!cx || !cy) return null;
                    
                    const tipoVisual = payload?.tipoVisual || 'checkin';
                    const radius = tipoVisual === 'inicial' || tipoVisual === 'atual' ? 8 : tipoVisual === 'checkin' ? 7 : 5;
                    const key = `active-${payload?.id || index || cx}-${cy}-${tipoVisual}`;
                    
                    return (
                      <circle
                        key={key}
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={tipoVisual === 'inicial' ? '#22c55e' : tipoVisual === 'atual' ? '#10b981' : tipoVisual === 'checkin' ? '#3b82f6' : '#64748b'}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Botão para mostrar/ocultar tabela */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowWeightTable(!showWeightTable)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-transparent text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transition-all duration-300 border-0 outline-none focus:outline-none active:scale-95"
              >
                {showWeightTable ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Ocultar Tabela
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Mostrar Tabela Detalhada
                  </>
                )}
              </button>
            </div>

            {/* Tabela de Pesos */}
            {showWeightTable && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-center py-2 px-2 text-slate-300 font-medium w-12">Ativo</th>
                      <th className="text-center py-2 px-2 text-slate-300 font-medium w-12">Visível</th>
                      <th className="text-left py-2 px-3 text-slate-300 font-medium">Data</th>
                      <th className="text-left py-2 px-3 text-slate-300 font-medium">Tipo</th>
                      <th className="text-center py-2 px-3 text-blue-300 font-medium">Peso (kg)</th>
                      <th className="text-center py-2 px-3 text-slate-400 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allWeightData
                      .filter(item => !hiddenWeights.has(item.id)) // Filtrar linhas ocultas
                      .map((item, index, visibleItems) => {
                      const isDisabled = disabledWeights.has(item.id);
                      
                      // Encontrar o último peso ATIVO anterior (considerando apenas itens visíveis)
                      let prevItem = null;
                      for (let i = index - 1; i >= 0; i--) {
                        const prevId = visibleItems[i].id;
                        if (!disabledWeights.has(prevId) && !hiddenWeights.has(prevId)) {
                          prevItem = visibleItems[i];
                          break;
                        }
                      }
                      
                      const pesoDiff = prevItem && item.peso !== null && prevItem.peso !== null 
                        ? item.peso - prevItem.peso 
                        : null;

                      return (
                        <tr 
                          key={item.id} 
                          className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                            isDisabled ? 'opacity-40' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={() => toggleWeight(item.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                              title={isDisabled ? "Ativar peso" : "Desativar peso"}
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => toggleWeightVisibility(item.id)}
                              className="text-slate-400 hover:text-blue-400 transition-colors"
                              title="Ocultar linha"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="py-2 px-3 text-slate-300">{item.data}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.tipoVisual === 'inicial' ? 'bg-green-500/20 text-green-300' :
                              item.tipoVisual === 'atual' ? 'bg-emerald-500/20 text-emerald-300' :
                              item.tipoVisual === 'checkin' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-slate-500/20 text-slate-300'
                            }`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-blue-300 font-medium">
                            {item.peso !== null ? item.peso.toFixed(1) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!isDisabled && pesoDiff !== null ? (
                              <span className={`text-xs font-medium ${
                                pesoDiff < 0 ? 'text-green-400' : pesoDiff > 0 ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {pesoDiff > 0 ? '+' : ''}{pesoDiff.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Legenda */}
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                  <span>💡 Dica: Desative pesos intermediários para ver a comparação direta entre períodos específicos</span>
                  <span>👁️ Use o ícone do olho para ocultar linhas da tabela</span>
                  {hiddenWeights.size > 0 && (
                    <button
                      onClick={() => setHiddenWeights(new Set())}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Mostrar {hiddenWeights.size} linha(s) oculta(s)
                    </button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Cintura e Quadril */}
      {(() => {
        const measurementsData = [];
        
        // Adicionar medidas iniciais se existirem
        if (patientWithInitialData?.medida_cintura_inicial || patientWithInitialData?.medida_quadril_inicial) {
          const dataInicial = patientWithInitialData.data_fotos_iniciais || patient?.created_at;
          measurementsData.push({
            id: 'inicial',
            data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            dataCompleta: new Date(dataInicial).toISOString(),
            cintura: patientWithInitialData.medida_cintura_inicial ? parseFloat(patientWithInitialData.medida_cintura_inicial.toString()) : null,
            quadril: patientWithInitialData.medida_quadril_inicial ? parseFloat(patientWithInitialData.medida_quadril_inicial.toString()) : null,
            tipo: 'Inicial'
          });
        }
        
        // Adicionar medidas atuais se existirem
        if (patientWithInitialData?.medida_cintura_atual || patientWithInitialData?.medida_quadril_atual) {
          const dataAtual = patientWithInitialData.data_fotos_atuais || new Date().toISOString();
          measurementsData.push({
            id: 'atual',
            data: new Date(dataAtual).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            dataCompleta: new Date(dataAtual).toISOString(),
            cintura: patientWithInitialData.medida_cintura_atual ? parseFloat(patientWithInitialData.medida_cintura_atual.toString()) : null,
            quadril: patientWithInitialData.medida_quadril_atual ? parseFloat(patientWithInitialData.medida_quadril_atual.toString()) : null,
            tipo: 'Atual'
          });
        }
        
        // Adicionar dados dos check-ins usando extractMeasurements
        checkinsOrdenados.forEach((c) => {
          const checkinData = c as any;
          // Usar o campo 'medida' que contém o texto com as medidas
          if (checkinData.medida) {
            const measurements = extractMeasurements(checkinData.medida);
            // Só adicionar se encontrou pelo menos uma medida
            if (measurements.cintura !== null || measurements.quadril !== null) {
              measurementsData.push({
                id: c.id,
                data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                dataCompleta: c.data_checkin,
                cintura: measurements.cintura,
                quadril: measurements.quadril,
                tipo: 'Check-in'
              });
            }
          }
        });
        
        // Ordenar por data
        measurementsData.sort((a, b) => new Date(a.dataCompleta).getTime() - new Date(b.dataCompleta).getTime());
        
        return measurementsData.length > 0 ? (
          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Ruler className="w-5 h-5 text-purple-400" />
                    Evolução de Medidas
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Acompanhamento de cintura e quadril ao longo do tempo
                  </CardDescription>
                </div>
                {onAddData && (
                  <button
                    onClick={onAddData}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 hover:scale-105"
                    title="Adicionar dados"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-purple-500"></div>
                  <span>Cintura (cm)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-pink-500"></div>
                  <span>Quadril (cm)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={measurementsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="dataCompleta"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                    }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                    domain={['dataMin - 5', 'dataMax + 5']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-800 p-3 rounded-lg border border-slate-600">
                            <p className="text-slate-300 text-sm mb-1">Data: {data.data}</p>
                            <p className="text-slate-400 text-xs mb-2">{data.tipo}</p>
                            {data.cintura && (
                              <p className="text-purple-300 font-semibold">Cintura: {data.cintura} cm</p>
                            )}
                            {data.quadril && (
                              <p className="text-pink-300 font-semibold">Quadril: {data.quadril} cm</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend content={CustomLegend} />
                  {measurementsData.some(d => d.cintura !== null) && (
                    <Line 
                      type="monotone" 
                      dataKey="cintura" 
                      stroke="#a855f7" 
                      strokeWidth={2}
                      name="Cintura (cm)"
                      dot={{ fill: '#a855f7', r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      hide={hiddenSeries.has('cintura')}
                    />
                  )}
                  {measurementsData.some(d => d.quadril !== null) && (
                    <Line 
                      type="monotone" 
                      dataKey="quadril" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      name="Quadril (cm)"
                      dot={{ fill: '#ec4899', r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                      hide={hiddenSeries.has('quadril')}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>

              {/* Botão para mostrar/ocultar tabela */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowMeasurementsTable(!showMeasurementsTable)}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-transparent text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:shadow-lg transition-all duration-300 border-0 outline-none focus:outline-none active:scale-95"
                >
                  {showMeasurementsTable ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Ocultar Tabela
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Mostrar Tabela Detalhada
                    </>
                  )}
                </button>
              </div>

              {/* Tabela de Medidas */}
              {showMeasurementsTable && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-center py-2 px-2 text-slate-300 font-medium w-12">Ativo</th>
                      <th className="text-center py-2 px-2 text-slate-300 font-medium w-12">Visível</th>
                      <th className="text-left py-2 px-3 text-slate-300 font-medium">Data</th>
                      <th className="text-left py-2 px-3 text-slate-300 font-medium">Tipo</th>
                      <th className="text-center py-2 px-3 text-purple-300 font-medium">Cintura (cm)</th>
                      <th className="text-center py-2 px-3 text-slate-400 font-medium">Δ</th>
                      <th className="text-center py-2 px-3 text-pink-300 font-medium">Quadril (cm)</th>
                      <th className="text-center py-2 px-3 text-slate-400 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {measurementsData
                      .filter(item => !hiddenMeasurements.has(item.id)) // Filtrar linhas ocultas
                      .map((item, index, visibleItems) => {
                      const isDisabled = disabledMeasurements.has(item.id);
                      
                      // Encontrar a última medição ATIVA anterior (considerando apenas itens visíveis)
                      let prevItem = null;
                      for (let i = index - 1; i >= 0; i--) {
                        const prevId = visibleItems[i].id;
                        if (!disabledMeasurements.has(prevId) && !hiddenMeasurements.has(prevId)) {
                          prevItem = visibleItems[i];
                          break;
                        }
                      }
                      
                      const cinturaDiff = prevItem && item.cintura !== null && prevItem.cintura !== null 
                        ? item.cintura - prevItem.cintura 
                        : null;
                      const quadrilDiff = prevItem && item.quadril !== null && prevItem.quadril !== null 
                        ? item.quadril - prevItem.quadril 
                        : null;

                      return (
                        <tr 
                          key={item.id} 
                          className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${
                            isDisabled ? 'opacity-40' : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-center">
                            <input
                              type="checkbox"
                              checked={!isDisabled}
                              onChange={() => toggleMeasurement(item.id)}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                              title={isDisabled ? "Ativar medição" : "Desativar medição"}
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => toggleMeasurementVisibility(item.id)}
                              className="text-slate-400 hover:text-purple-400 transition-colors"
                              title="Ocultar linha"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="py-2 px-3 text-slate-300">{item.data}</td>
                          <td className="py-2 px-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.tipo === 'Inicial' ? 'bg-green-500/20 text-green-300' :
                              item.tipo === 'Atual' ? 'bg-emerald-500/20 text-emerald-300' :
                              'bg-blue-500/20 text-blue-300'
                            }`}>
                              {item.tipo}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-purple-300 font-medium">
                            {item.cintura !== null ? item.cintura.toFixed(1) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!isDisabled && cinturaDiff !== null ? (
                              <span className={`text-xs font-medium ${
                                cinturaDiff < 0 ? 'text-green-400' : cinturaDiff > 0 ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {cinturaDiff > 0 ? '+' : ''}{cinturaDiff.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-pink-300 font-medium">
                            {item.quadril !== null ? item.quadril.toFixed(1) : '-'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!isDisabled && quadrilDiff !== null ? (
                              <span className={`text-xs font-medium ${
                                quadrilDiff < 0 ? 'text-green-400' : quadrilDiff > 0 ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {quadrilDiff > 0 ? '+' : ''}{quadrilDiff.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {/* Legenda */}
                <div className="mt-3 text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                  <span>💡 Dica: Desative medições intermediárias para ver a comparação direta entre períodos específicos</span>
                  <span>👁️ Use o ícone do olho para ocultar linhas da tabela</span>
                  {hiddenMeasurements.size > 0 && (
                    <button
                      onClick={() => setHiddenMeasurements(new Set())}
                      className="text-purple-400 hover:text-purple-300 underline"
                    >
                      Mostrar {hiddenMeasurements.size} linha(s) oculta(s)
                    </button>
                  )}
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        ) : null;
      })()}

      {/* Gráfico de Pontuações e Quantidades */}
      {scoresData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-blue-400" />
              Evolução das Pontuações
            </CardTitle>
            <CardDescription className="text-slate-400">
              Performance em diferentes categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pontuacoes" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-700/50">
                <TabsTrigger value="pontuacoes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Pontuações
                </TabsTrigger>
                <TabsTrigger value="quantidades" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Quantidades
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pontuacoes" className="mt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoresData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="data" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend content={<CustomLegend />} />
                    <Line 
                      type="monotone" 
                      dataKey="treino" 
                      stroke="#f59e0b" 
                      strokeWidth={1} 
                      name="Treino" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('treino')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cardio" 
                      stroke="#ef4444" 
                      strokeWidth={1} 
                      name="Cardio" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('cardio')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sono" 
                      stroke="#8b5cf6" 
                      strokeWidth={1} 
                      name="Sono" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('sono')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agua" 
                      stroke="#3b82f6" 
                      strokeWidth={1} 
                      name="Água" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('agua')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="#10b981" 
                      strokeWidth={1} 
                      name="Stress" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('stress')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="refeicoesLivres" 
                      stroke="#ec4899" 
                      strokeWidth={1} 
                      name="Refeições Livres" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('refeicoesLivres')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="beliscadas" 
                      stroke="#f97316" 
                      strokeWidth={1} 
                      name="Beliscadas" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('beliscadas')}
                      legendType="line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="quantidades" className="mt-0">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={quantitiesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="data" 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      style={{ fontSize: '12px' }}
                      domain={[0, 'dataMax + 1']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend content={<CustomLegend />} />
                    <Line 
                      type="monotone" 
                      dataKey="treino" 
                      stroke="#f59e0b" 
                      strokeWidth={1} 
                      name="Treino" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('treino')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cardio" 
                      stroke="#ef4444" 
                      strokeWidth={1} 
                      name="Cardio" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('cardio')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sono" 
                      stroke="#8b5cf6" 
                      strokeWidth={1} 
                      name="Sono" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('sono')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="agua" 
                      stroke="#3b82f6" 
                      strokeWidth={1} 
                      name="Água" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('agua')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="#10b981" 
                      strokeWidth={1} 
                      name="Stress" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('stress')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="refeicoesLivres" 
                      stroke="#ec4899" 
                      strokeWidth={1} 
                      name="Refeições Livres" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('refeicoesLivres')}
                      legendType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="beliscadas" 
                      stroke="#f97316" 
                      strokeWidth={1} 
                      name="Beliscadas" 
                      dot={{ r: 3 }} 
                      activeDot={{ r: 4 }}
                      hide={hiddenSeries.has('beliscadas')}
                      legendType="line"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Gráfico Radar de Performance Atual */}
      {radarData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Performance Atual
                </CardTitle>
                {!isPerformanceMinimized && (
                  <CardDescription className="text-slate-400">
                    Análise multidimensional do check-in
                    {selectedCheckin && (
                      <span className="ml-2">
                        - {new Date(selectedCheckin.data_checkin).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    )}
                  </CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isPerformanceMinimized && checkinsForRadar.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousCheckin}
                      disabled={selectedCheckinIndex >= checkinsForRadar.length - 1}
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white"
                      title="Check-in anterior"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <span className="text-sm text-slate-400 px-2">
                      {selectedCheckinIndex + 1} / {checkinsForRadar.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextCheckin}
                      disabled={selectedCheckinIndex === 0}
                      className="bg-slate-700/50 border-slate-600 hover:bg-slate-600/50 text-slate-300 hover:text-white"
                      title="Próximo check-in"
                    >
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPerformanceMinimized(!isPerformanceMinimized)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  title={isPerformanceMinimized ? "Expandir" : "Minimizar"}
                >
                  {isPerformanceMinimized ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {!isPerformanceMinimized && (
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis 
                    dataKey="categoria" 
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 10]} 
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <Radar 
                  name="Pontuação" 
                  dataKey="pontos" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

