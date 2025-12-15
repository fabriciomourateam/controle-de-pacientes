import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { AIInsights } from '@/components/evolution/AIInsights';
import { DailyWeightsList } from '@/components/evolution/DailyWeightsList';
import { detectAchievements } from '@/lib/achievement-system';
import { 
  Activity, 
  Calendar,
  TrendingUp,
  Weight,
  Flame,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

interface PatientEvolutionTabProps {
  patientId: string;
  checkins?: Checkin[];
  patient?: Patient | null;
  bodyCompositions?: any[];
  achievements?: any[];
  refreshTrigger?: number; // Trigger para forçar atualização dos gráficos
}

export function PatientEvolutionTab({ 
  patientId, 
  checkins: propsCheckins,
  patient: propsPatient,
  bodyCompositions: propsBodyCompositions,
  achievements: propsAchievements,
  refreshTrigger
}: PatientEvolutionTabProps) {
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>(propsCheckins || []);
  const [patient, setPatient] = useState<Patient | null>(propsPatient || null);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>(propsBodyCompositions || []);
  const [loading, setLoading] = useState(!propsCheckins);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  // Calcular dados
  const achievements = propsAchievements || (checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : []);

  // Calcular idade do paciente
  const calcularIdade = (dataNascimento: string | null) => {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  useEffect(() => {
    // Se os dados foram passados como props, usar eles
    if (propsCheckins) {
      setCheckins(propsCheckins);
      setLoading(false);
    }
    if (propsPatient) {
      setPatient(propsPatient);
    }
    if (propsBodyCompositions) {
      setBodyCompositions(propsBodyCompositions);
    }
    
    // Se não foram passados, buscar
    if (!propsCheckins && patientId) {
      loadPortalData();
    }
  }, [patientId, propsCheckins, propsPatient, propsBodyCompositions]);

  async function loadPortalData() {
    try {
      setLoading(true);

      // Buscar dados do paciente pelo ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (patientError || !patientData) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do paciente',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      setPatient(patientData);

      // Buscar check-ins e composição corporal em paralelo (se houver telefone)
      if (patientData.telefone) {
        const checkinsData = await checkinService.getByPhone(patientData.telefone);
        setCheckins(checkinsData);

        // Processar composição corporal em paralelo (não bloqueia)
        if (checkinsData.length > 0) {
          const bodyComps = checkinsData
            .filter(c => c.bioimpedancia && typeof c.bioimpedancia === 'object')
            .map(c => ({
              date: c.data_checkin,
              bodyFat: (c.bioimpedancia as any)?.percentual_gordura || null,
              muscleMass: (c.bioimpedancia as any)?.massa_muscular || null,
              visceralFat: (c.bioimpedancia as any)?.gordura_visceral || null,
            }))
            .filter(bc => bc.bodyFat !== null);

          setBodyCompositions(bodyComps);
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do portal',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="bg-white">
        <CardContent className="p-8 text-center">
          <p className="text-[#777777]">Não foi possível carregar os dados do paciente</p>
        </CardContent>
      </Card>
    );
  }

  const idade = calcularIdade(patient.data_nascimento);
  const primeiroCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const ultimoCheckin = checkins.length > 0 ? checkins[0] : null;

  // Calcular dados de peso
  const weightData = [];
  if (patient?.peso_inicial) {
    const dataInicial = (patient as any)?.data_fotos_iniciais || patient.created_at;
    weightData.push({
      data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(patient.peso_inicial.toString())
    });
  }
  checkins.slice().reverse().forEach((c) => {
    if (c.peso) {
      weightData.push({
        data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        peso: parseFloat(c.peso.replace(',', '.'))
      });
    }
  });

  const weightChange = weightData.length >= 2 
    ? (weightData[weightData.length - 1].peso - weightData[0].peso).toFixed(1)
    : '0.0';
  const isNegative = parseFloat(weightChange) < 0;
  const isNeutral = Math.abs(parseFloat(weightChange)) < 0.1;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Check-ins Realizados */}
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

            {/* Idade */}
            {patient?.data_nascimento && (
              <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">Idade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {idade}
                    <span className="text-lg ml-1">anos</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Idade atual</p>
                </CardContent>
              </Card>
            )}

            {/* Altura */}
            {(patient as any)?.altura_inicial && (
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">Altura</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {(patient as any).altura_inicial}
                    <span className="text-lg ml-1">m</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Altura</p>
                </CardContent>
              </Card>
            )}

            {/* Peso Inicial */}
            {weightData.length > 0 && (
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
                    {weightData[0]?.data}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Peso Atual */}
            {checkins[0]?.peso && (
              <Card className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 border-indigo-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">Peso Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {parseFloat(checkins[0].peso.replace(',', '.')).toFixed(1)}
                    <span className="text-lg ml-1">kg</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(checkins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Variação */}
            {weightData.length >= 2 && (
              <Card className={`bg-gradient-to-br ${isNeutral ? 'from-slate-500/20 to-slate-600/20 border-slate-500/30' : isNegative ? 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' : 'from-orange-500/20 to-orange-600/20 border-orange-500/30'}`}>
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
                    {isNeutral ? 'Sem variação' : isNegative ? 'Perda de peso' : 'Ganho de peso'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      )}

      {/* 1. Análise Inteligente com IA (minimizado) */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AIInsights checkins={checkins} />
        </motion.div>
      )}

      {/* 2. Métricas de Composição Corporal */}
      {bodyCompositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <BodyCompositionMetrics data={bodyCompositions} />
        </motion.div>
      )}

      {/* 3. Gráfico de % Gordura */}
      {bodyCompositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BodyFatChart data={bodyCompositions} />
        </motion.div>
      )}

      {/* 4. Gráficos de Evolução (Peso, Pontuações, Performance) */}
      {(checkins.length > 0 || patient) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <EvolutionCharts 
            checkins={checkins} 
            patient={patient}
            refreshTrigger={refreshTrigger || localRefreshTrigger}
          />
        </motion.div>
      )}

      {/* 5. Timeline */}
      {checkins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Timeline checkins={checkins} showEditButton={false} />
        </motion.div>
      )}

      {/* 6. Lista de Pesos Diários Registrados */}
      {patient?.telefone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <DailyWeightsList
            telefone={patient.telefone}
            onUpdate={() => {
              // Recarregar dados quando um peso for deletado
              loadPortalData();
              // Forçar atualização local dos gráficos
              setLocalRefreshTrigger(prev => prev + 1);
            }}
          />
        </motion.div>
      )}

      {/* 7. Aviso se houver poucos check-ins */}
      {checkins.length < 3 && checkins.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-900 font-semibold">Continue Firme!</p>
                <p className="text-amber-800 text-sm mt-1">
                  Você possui {checkins.length} check-in{checkins.length > 1 ? 's' : ''}. Continue registrando para ver análises mais detalhadas!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparação de Fotos */}
      {checkins.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <PhotoComparison checkins={checkins} />
        </motion.div>
      )}

      {/* Mensagem quando não há dados - só mostrar se não houver check-ins E não houver paciente */}
      {checkins.length === 0 && !patient && (
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-8 text-center">
            <Activity className="w-12 h-12 text-[#00C98A] mx-auto mb-4 opacity-50" />
            <p className="text-[#777777] text-lg font-medium mb-2">
              Ainda não há check-ins registrados
            </p>
            <p className="text-sm text-[#777777]">
              Os dados de evolução aparecerão aqui quando houver check-ins registrados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

