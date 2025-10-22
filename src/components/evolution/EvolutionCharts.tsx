import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Bar
} from "recharts";
import { TrendingUp, Activity, Target } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface EvolutionChartsProps {
  checkins: Checkin[];
  patient?: Patient | null;
}

export function EvolutionCharts({ checkins, patient }: EvolutionChartsProps) {
  // IMPORTANTE: checkins vem ordenado DESC (mais recente primeiro)
  // Precisamos reverter para ordem cronológica (mais antigo primeiro)
  const checkinsOrdenados = [...checkins].reverse();

  // Preparar dados para gráfico de peso - incluindo peso inicial
  const weightData = [];
  
  // Adicionar peso inicial se existir
  if (patient?.peso_inicial) {
    const dataInicial = patient.data_fotos_iniciais || patient.created_at;
    weightData.push({
      data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(patient.peso_inicial.toString()),
      tipo: 'Inicial',
      aproveitamento: null
    });
  } else if (checkinsOrdenados.length > 0) {
    // Se não há peso inicial cadastrado, usar o primeiro check-in como referência inicial
    const primeiroCheckin = checkinsOrdenados[0];
    weightData.push({
      data: new Date(primeiroCheckin.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(primeiroCheckin.peso || '0'),
      tipo: 'Inicial (1º Check-in)',
      aproveitamento: parseFloat(primeiroCheckin.percentual_aproveitamento || '0') || null
    });
  }
  
  // Adicionar dados dos check-ins (pular o primeiro se foi usado como peso inicial)
  const startIndex = patient?.peso_inicial ? 0 : 1;
  checkinsOrdenados.slice(startIndex).forEach(c => {
    if (c.peso) {
      weightData.push({
        data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        peso: parseFloat(c.peso),
        tipo: 'Check-in',
        aproveitamento: parseFloat(c.percentual_aproveitamento || '0') || null
      });
    }
  });

  // Preparar dados para gráfico de pontuações
  const scoresData = checkinsOrdenados.map(c => ({
    data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    treino: parseFloat(c.pontos_treinos || '0') || 0,
    cardio: parseFloat(c.pontos_cardios || '0') || 0,
    sono: parseFloat(c.pontos_sono || '0') || 0,
    agua: parseFloat(c.pontos_agua || '0') || 0,
    stress: parseFloat(c.pontos_stress || '0') || 0
  }));

  // Preparar dados para radar (último check-in = primeiro do array original)
  const latestCheckin = checkins[0]; // Mais recente
  const radarData = latestCheckin ? [
    { categoria: 'Treino', pontos: parseFloat(latestCheckin.pontos_treinos || '0') || 0, fullMark: 10 },
    { categoria: 'Cardio', pontos: parseFloat(latestCheckin.pontos_cardios || '0') || 0, fullMark: 10 },
    { categoria: 'Água', pontos: parseFloat(latestCheckin.pontos_agua || '0') || 0, fullMark: 10 },
    { categoria: 'Sono', pontos: parseFloat(latestCheckin.pontos_sono || '0') || 0, fullMark: 10 },
    { categoria: 'Stress', pontos: parseFloat(latestCheckin.pontos_stress || '0') || 0, fullMark: 10 },
    { categoria: 'Libido', pontos: parseFloat(latestCheckin.pontos_libido || '0') || 0, fullMark: 10 }
  ] : [];

  // Calcular variação de peso (último - primeiro)
  const weightChange = weightData.length >= 2 
    ? ((weightData[weightData.length - 1].peso || 0) - (weightData[0].peso || 0)).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Check-ins Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{checkins.length}</div>
            <p className="text-xs text-slate-400 mt-1">Total de avaliações</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Peso Inicial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {weightData[0]?.peso?.toFixed(1) || 'N/A'}
              {weightData[0]?.peso && <span className="text-lg ml-1">kg</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {weightData[0] && new Date(checkinsOrdenados[0].data_checkin).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Peso Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {weightData[weightData.length - 1]?.peso?.toFixed(1) || 'N/A'}
              {weightData[weightData.length - 1]?.peso && <span className="text-lg ml-1">kg</span>}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {weightData.length > 0 && new Date(checkinsOrdenados[checkinsOrdenados.length - 1].data_checkin).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${parseFloat(weightChange) < 0 ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' : 'from-orange-500/20 to-orange-600/20 border-orange-500/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Variação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
              <span className="text-lg ml-1">kg</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {parseFloat(weightChange) < 0 ? 'Perda de peso' : parseFloat(weightChange) > 0 ? 'Ganho de peso' : 'Sem variação'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Peso */}
      {weightData.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Evolução do Peso
            </CardTitle>
            <CardDescription className="text-slate-400">
              Acompanhamento do peso ao longo do tempo
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>
                  <span>Peso Inicial</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                  <span>1º Check-in (Referência)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Check-ins</span>
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="data" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
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
                  formatter={(value, name, props) => [
                    `${value} kg`,
                    props.payload?.tipo === 'Inicial' ? 'Peso Inicial' : 
                    props.payload?.tipo === 'Inicial (1º Check-in)' ? 'Peso Inicial (1º Check-in)' : 
                    'Peso Check-in'
                  ]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Peso (kg)"
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (payload?.tipo === 'Inicial') {
                      return <circle cx={cx} cy={cy} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />;
                    }
                    if (payload?.tipo === 'Inicial (1º Check-in)') {
                      return <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle cx={cx} cy={cy} r={5} fill="#3b82f6" />;
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Pontuações */}
      {scoresData.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-emerald-400" />
              Evolução das Pontuações
            </CardTitle>
            <CardDescription className="text-slate-400">
              Performance em diferentes categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <Legend />
                <Line type="monotone" dataKey="treino" stroke="#f59e0b" strokeWidth={2} name="Treino" />
                <Line type="monotone" dataKey="cardio" stroke="#ef4444" strokeWidth={2} name="Cardio" />
                <Line type="monotone" dataKey="sono" stroke="#8b5cf6" strokeWidth={2} name="Sono" />
                <Line type="monotone" dataKey="agua" stroke="#3b82f6" strokeWidth={2} name="Água" />
                <Line type="monotone" dataKey="stress" stroke="#10b981" strokeWidth={2} name="Stress" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico Radar de Performance Atual */}
      {radarData.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Performance Atual</CardTitle>
            <CardDescription className="text-slate-400">
              Análise multidimensional do último check-in
            </CardDescription>
          </CardHeader>
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
        </Card>
      )}
    </div>
  );
}

