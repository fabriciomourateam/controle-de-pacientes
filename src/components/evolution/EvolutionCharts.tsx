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

  // Preparar dados para gráfico de peso - incluindo peso inicial se existir
  const weightData = [];
  
  // Adicionar peso inicial se existir (pacientes cadastrados manualmente)
  const patientWithInitialData = patient as any;
  if (patientWithInitialData?.peso_inicial) {
    const dataInicial = patientWithInitialData.data_fotos_iniciais || patient?.created_at;
    weightData.push({
      data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(patientWithInitialData.peso_inicial.toString()),
      tipo: 'Inicial',
      aproveitamento: null
    });
  }
  
  // Adicionar dados dos check-ins
  checkinsOrdenados.forEach((c, index) => {
    if (c.peso) {
      weightData.push({
        data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        peso: parseFloat(c.peso.replace(',', '.')),
        tipo: index === 0 ? '1º Check-in' : 'Check-in',
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

  // weightData já está ordenado cronologicamente (mais antigo primeiro)


  return (
    <div className="space-y-6">
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
            </CardDescription>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>
                <span>Peso Inicial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                <span>1º Check-in</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Check-ins</span>
              </div>
            </div>
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
                    props.payload?.tipo === '1º Check-in' ? '1º Check-in' : 
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
                    const { cx, cy, payload, index } = props;
                    if (payload?.tipo === 'Inicial') {
                      return <circle key={`dot-inicial-${index}`} cx={cx} cy={cy} r={6} fill="#8b5cf6" stroke="#fff" strokeWidth={2} />;
                    }
                    if (payload?.tipo === '1º Check-in') {
                      return <circle key={`dot-primeiro-${index}`} cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />;
                    }
                    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={5} fill="#3b82f6" />;
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

