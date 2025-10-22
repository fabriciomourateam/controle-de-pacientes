import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { generateDossiePDF } from '@/lib/dossie-pdf-generator';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AIInsights } from '@/components/evolution/AIInsights';
import { BioimpedanciaInput } from '@/components/evolution/BioimpedanciaInput';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { 
  Download, 
  ArrowLeft, 
  TrendingUp, 
  User,
  FileText,
  Calendar,
  Activity,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function PatientEvolution() {
  const { telefone } = useParams<{ telefone: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);

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
    async function loadEvolution() {
      if (!telefone) {
        toast({
          title: 'Erro',
          description: 'Telefone do paciente não informado',
          variant: 'destructive'
        });
        navigate('/checkins');
        return;
      }

      try {
        setLoading(true);
        
        // Buscar check-ins do paciente
        const checkinsData = await checkinService.getByPhone(telefone);
        
        if (checkinsData.length === 0) {
          toast({
            title: 'Nenhum check-in encontrado',
            description: 'Este paciente ainda não possui check-ins registrados',
            variant: 'destructive'
          });
          navigate('/checkins');
          return;
        }

        setCheckins(checkinsData);

        // Buscar dados do paciente
        const { data: patientData, error } = await supabase
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .single();

        if (error) {
          console.error('Erro ao buscar paciente:', error);
        } else {
          setPatient(patientData);
        }

        // Buscar bioimpedâncias
        const { data: bioData } = await supabase
          .from('body_composition')
          .select('*')
          .eq('telefone', telefone)
          .order('data_avaliacao', { ascending: false });
        
        if (bioData) {
          setBodyCompositions(bioData);
        }
      } catch (error) {
        console.error('Erro ao carregar evolução:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Ocorreu um erro ao carregar a evolução do paciente',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }

    loadEvolution();
  }, [telefone, navigate, toast]);

  const handleExportPDF = async () => {
    if (!patient || checkins.length === 0) return;

    try {
      setGeneratingPDF(true);
      toast({
        title: 'Gerando PDF',
        description: 'Por favor, aguarde...'
      });

      await generateDossiePDF(
        {
          nome: patient.nome,
          telefone: patient.telefone,
          email: patient.email || undefined,
          plano: patient.plano || undefined
        },
        checkins,
        bodyCompositions
      );

      toast({
        title: 'PDF gerado com sucesso!',
        description: 'O download deve iniciar automaticamente'
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Ocorreu um erro ao gerar o documento',
        variant: 'destructive'
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleBioSuccess = async () => {
    // Recarregar bioimpedâncias após adicionar nova
    if (!telefone) return;
    
    const { data } = await supabase
      .from('body_composition')
      .select('*')
      .eq('telefone', telefone)
      .order('data_avaliacao', { ascending: false });
    
    if (data) {
      setBodyCompositions(data);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 p-6"
        >
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/checkins')}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                  📊 Dossiê de Evolução
                </h1>
                <p className="text-slate-400 mt-1">
                  Análise completa do progresso do paciente
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <BioimpedanciaInput
                telefone={telefone!}
                nome={patient?.nome || 'Paciente'}
                idade={patient?.data_nascimento ? calcularIdade(patient.data_nascimento) : null}
                altura={null}
                sexo={patient?.genero || null}
                onSuccess={handleBioSuccess}
              />
              <Button
                onClick={handleExportPDF}
                disabled={generatingPDF}
                className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
              >
                <Download className="w-4 h-4" />
                {generatingPDF ? 'Gerando...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>

          {/* Card de Informações do Paciente */}
          <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20 border-4 border-blue-500/30">
                  <AvatarFallback className="bg-blue-500/20 text-blue-300 text-2xl font-bold">
                    {patient?.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{patient?.nome || 'Paciente'}</h2>
                    {patient?.plano && (
                      <Badge className="bg-purple-600/30 text-purple-200 border-purple-500/30">
                        {patient.plano}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">{patient?.apelido || 'Apelido não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">{checkins.length} check-ins realizados</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">
                        {new Date(checkins[checkins.length - 1]?.data_checkin).toLocaleDateString('pt-BR')} - {new Date(checkins[0]?.data_checkin).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  {patient?.objetivo && (
                    <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Objetivo Principal:
                      </p>
                      <p className="text-sm text-slate-200">{patient.objetivo}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso se houver poucos check-ins */}
          {checkins.length < 3 && (
            <Card className="bg-amber-900/20 border-amber-700/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-200 font-semibold">Dados Limitados</p>
                    <p className="text-amber-300/80 text-sm mt-1">
                      Este paciente possui apenas {checkins.length} check-in{checkins.length > 1 ? 's' : ''} registrado{checkins.length > 1 ? 's' : ''}. 
                      Alguns gráficos e análises de evolução podem ter informações limitadas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas de Composição Corporal */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <BodyCompositionMetrics data={bodyCompositions} />
            </motion.div>
          )}

          {/* Análise Inteligente com IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <AIInsights checkins={checkins} />
          </motion.div>

          {/* Gráfico de Evolução de % Gordura */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <BodyFatChart data={bodyCompositions} />
            </motion.div>
          )}

          {/* Gráficos de Evolução */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <EvolutionCharts checkins={checkins} />
          </motion.div>

          {/* Comparação de Fotos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PhotoComparison checkins={checkins} />
          </motion.div>

          {/* Timeline Detalhada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Timeline checkins={checkins} />
          </motion.div>

          {/* Card de Ações Finais */}
          <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-blue-400" />
                Ações Disponíveis
              </CardTitle>
              <CardDescription className="text-slate-400">
                Exporte ou compartilhe este dossiê
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleExportPDF}
                  disabled={generatingPDF}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {generatingPDF ? 'Gerando PDF...' : 'Baixar Dossiê em PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/checkins')}
                  className="gap-2 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para Check-ins
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DashboardLayout>
  );
}

