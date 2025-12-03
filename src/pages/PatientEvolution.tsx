import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { generateDossiePDF, generateDossieImage } from '@/lib/dossie-pdf-generator';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AIInsights } from '@/components/evolution/AIInsights';
import { BioimpedanciaInput } from '@/components/evolution/BioimpedanciaInput';
import { InitialDataInput } from '@/components/evolution/InitialDataInput';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { TrendsAnalysis } from '@/components/evolution/TrendsAnalysis';
import { ShareButton } from '@/components/evolution/ShareButton';
import { CertificateButton } from '@/components/evolution/CertificateButton';
import { PortalLinkButton } from '@/components/evolution/PortalLinkButton';
import { PortalPNGButton } from '@/components/evolution/PortalPNGButton';
import { PortalPDFButton } from '@/components/evolution/PortalPDFButton';
import { detectAchievements } from '@/lib/achievement-system';
import { analyzeTrends } from '@/lib/trends-analysis';
import { migrateCheckinPhotos, isTypebotUrl } from '@/lib/photo-migration-service';
import { convertGoogleDriveUrl } from '@/lib/google-drive-utils';
import type { ShareData } from '@/lib/share-generator';
import { 
  Download, 
  ArrowLeft, 
  TrendingUp, 
  User,
  FileText,
  Calendar,
  Utensils,
  Activity,
  AlertCircle,
  Camera,
  ZoomIn,
  Trash2,
  FileDown,
  Image,
  ChevronDown
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
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; label: string } | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  
  // Calcular dados para as novas features
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];
  const trends = checkins.length >= 3 ? analyzeTrends(checkins) : [];

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

  // Função para abrir zoom da foto
  const handleZoomPhoto = (url: string, label: string) => {
    setZoomedPhoto({ url, label });
    setIsZoomOpen(true);
  };

  // Função para excluir foto individual
  const handleDeletePhoto = async (photoField: string) => {
    if (!telefone || !patient) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ [photoField]: null })
        .eq('telefone', telefone);

      if (error) throw error;

      // Atualizar estado local
      setPatient({ ...patient, [photoField]: null });

      toast({
        title: 'Foto excluída',
        description: 'A foto foi removida com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a foto',
        variant: 'destructive'
      });
    }
  };

  const loadEvolution = async () => {
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
      setCheckins(checkinsData);

      // Verificar e migrar fotos do Typebot automaticamente
      if (checkinsData.length > 0) {
        checkAndMigratePhotos(checkinsData);
      }

      // Buscar dados do paciente
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();

      if (error) {
        console.error('Erro ao buscar paciente:', error);
      } else {
        console.log('📋 Dados do paciente carregados:', patientData);
        console.log('📸 Fotos iniciais:', {
          frente: patientData?.foto_inicial_frente,
          lado: patientData?.foto_inicial_lado,
          costas: patientData?.foto_inicial_costas,
          peso: patientData?.peso_inicial,
          altura: patientData?.altura_inicial
        });
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
  };

  useEffect(() => {
    loadEvolution();
  }, [telefone, navigate, toast]);

  const handleExport = async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!patient) return;

    // Verificar se há algum dado para exportar
    const hasData = checkins.length > 0 || 
                    bodyCompositions.length > 0 || 
                    patient.foto_inicial_frente || 
                    patient.foto_inicial_lado || 
                    patient.foto_inicial_lado_2 || 
                    patient.foto_inicial_costas ||
                    patient.peso_inicial ||
                    patient.altura_inicial;

    if (!hasData) {
      toast({
        title: 'Sem dados para exportar',
        description: 'Adicione check-ins, bioimpedância ou dados iniciais antes de exportar',
        variant: 'destructive'
      });
      return;
    }

    try {
      setGeneratingPDF(true);
      
      const formatLabel = format === 'pdf' ? 'PDF' : format === 'png' ? 'PNG' : 'JPEG';
      
      // Abrir portal em nova aba com parâmetro de auto-download
      const timestamp = Date.now();
      const portalUrl = `/portal/${patient.telefone}?autoDownload=${format}&t=${timestamp}`;
      window.open(portalUrl, '_blank');
      
      toast({
        title: `Abrindo Portal`,
        description: `O download ${formatLabel} iniciará automaticamente`
      });

      setGeneratingPDF(false);
    } catch (error) {
      console.error('Erro ao abrir portal:', error);
      toast({
        title: 'Erro ao abrir portal',
        description: 'Ocorreu um erro ao gerar o arquivo',
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

  const handleInitialDataSuccess = async () => {
    // Recarregar dados do paciente após adicionar dados iniciais
    if (!telefone) return;
    
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('telefone', telefone)
      .single();
    
    if (patientData) {
      setPatient(patientData);
    }
    
    toast({
      title: 'Dados atualizados',
      description: 'Os dados iniciais foram carregados'
    });
  };

  // Migrar fotos do Typebot para Supabase automaticamente
  const checkAndMigratePhotos = async (checkinsToCheck: Checkin[]) => {
    const checkinsWithTypebotPhotos = checkinsToCheck.filter(checkin => 
      isTypebotUrl(checkin.foto_1) ||
      isTypebotUrl(checkin.foto_2) ||
      isTypebotUrl(checkin.foto_3) ||
      isTypebotUrl(checkin.foto_4)
    );

    if (checkinsWithTypebotPhotos.length > 0) {
      console.log(`🔍 Detectadas ${checkinsWithTypebotPhotos.length} check-ins com fotos do Typebot`);
      
      setMigrating(true);
      
      let migratedCount = 0;
      for (const checkin of checkinsWithTypebotPhotos) {
        const migrated = await migrateCheckinPhotos(checkin);
        if (migrated) {
          migratedCount++;
        }
      }
      
      // Recarregar check-ins após migração
      if (telefone && migratedCount > 0) {
        const updatedCheckins = await checkinService.getByPhone(telefone);
        setCheckins(updatedCheckins);
        
        toast({
          title: 'Fotos migradas! 📸',
          description: `${migratedCount} check-in(s) com fotos agora salvas no Supabase`
        });
      }
      
      setMigrating(false);
    }
  };

  // Preparar dados para compartilhamento
  const getShareData = (): ShareData | null => {
    if (checkins.length < 2) return null;

    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
    );

    const initialWeight = parseFloat(sortedCheckins[0].peso || '0');
    const currentWeight = parseFloat(sortedCheckins[sortedCheckins.length - 1].peso || '0');
    const weightLost = initialWeight - currentWeight;

    const avgScore = sortedCheckins.reduce((acc, c) => 
      acc + parseFloat(c.total_pontuacao || '0'), 0
    ) / sortedCheckins.length;

    const daysSinceStart = Math.floor(
      (new Date(sortedCheckins[sortedCheckins.length - 1].data_checkin).getTime() - 
       new Date(sortedCheckins[0].data_checkin).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    let bodyFatData;
    if (bodyCompositions.length >= 2) {
      const sortedBio = [...bodyCompositions].sort((a, b) => 
        new Date(a.data_avaliacao).getTime() - new Date(b.data_avaliacao).getTime()
      );
      bodyFatData = {
        initialBodyFat: sortedBio[0].percentual_gordura,
        currentBodyFat: sortedBio[sortedBio.length - 1].percentual_gordura,
        bodyFatLost: sortedBio[0].percentual_gordura - sortedBio[sortedBio.length - 1].percentual_gordura
      };
    }

    return {
      patientName: patient?.nome || 'Paciente',
      initialWeight,
      currentWeight,
      weightLost,
      ...bodyFatData,
      totalCheckins: sortedCheckins.length,
      daysSinceStart,
      avgScore
    };
  };

  // Preparar dados para certificado
  const getCertificateData = () => {
    if (checkins.length < 1) return null;

    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
    );

    // Usar peso_inicial do paciente se existir, senão usar primeiro checkin
    const patientWithInitialData = patient as any;
    const initialWeight = patientWithInitialData?.peso_inicial 
      ? parseFloat(patientWithInitialData.peso_inicial.toString())
      : parseFloat(sortedCheckins[0].peso || '0');
    
    const currentWeight = parseFloat(sortedCheckins[sortedCheckins.length - 1].peso || '0');
    const weightLost = initialWeight - currentWeight;

    // Calcular semanas desde o peso inicial ou primeiro checkin
    // Se tem peso_inicial, usar data_fotos_iniciais ou created_at, senão usar primeiro checkin
    let startDate;
    if (patientWithInitialData?.peso_inicial) {
      startDate = patientWithInitialData?.data_fotos_iniciais || patient?.created_at || sortedCheckins[0].data_checkin;
    } else {
      startDate = sortedCheckins[0].data_checkin;
    }
    
    const endDate = sortedCheckins[sortedCheckins.length - 1].data_checkin;
    
    const totalWeeks = Math.floor(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 
      (1000 * 60 * 60 * 24 * 7)
    );

    let bodyFatLost;
    if (bodyCompositions.length >= 2) {
      const sortedBio = [...bodyCompositions].sort((a, b) => 
        new Date(a.data_avaliacao).getTime() - new Date(b.data_avaliacao).getTime()
      );
      bodyFatLost = sortedBio[0].percentual_gordura - sortedBio[sortedBio.length - 1].percentual_gordura;
    }

    return {
      patientName: patient?.nome || 'Paciente',
      weightLost,
      bodyFatLost,
      initialWeight,
      currentWeight,
      startDate: new Date(startDate).toLocaleDateString('pt-BR'),
      endDate: new Date(endDate).toLocaleDateString('pt-BR'),
      totalWeeks,
      coachName: 'Fabricio Moura Team',
      coachTitle: 'Personal Trainer'
    };
  };

  const shareData = getShareData();
  const certificateData = getCertificateData();

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
                  {migrating && (
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse text-sm ml-2">
                      📸 Migrando fotos...
                    </Badge>
                  )}
                </h1>
                <p className="text-slate-400 mt-1">
                  Análise completa do progresso do paciente
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient?.id && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/patients/${patient.id}?tab=diets`)}
                  className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200"
                >
                  <Utensils className="w-4 h-4 mr-2" />
                  Plano Alimentar
                </Button>
              )}
              
              <PortalLinkButton 
                telefone={telefone!} 
                patientName={patient?.nome || 'Paciente'} 
              />
              
              {shareData && <ShareButton data={shareData} />}
              
              {certificateData && (
                <CertificateButton
                  patientName={certificateData.patientName}
                  weightLost={certificateData.weightLost}
                  bodyFatLost={certificateData.bodyFatLost}
                  startDate={certificateData.startDate}
                  endDate={certificateData.endDate}
                  totalWeeks={certificateData.totalWeeks}
                  coachName={certificateData.coachName}
                  coachTitle={certificateData.coachTitle}
                  initialWeight={certificateData.initialWeight}
                  currentWeight={certificateData.currentWeight}
                />
              )}
              
              <BioimpedanciaInput
                telefone={telefone!}
                nome={patient?.nome || 'Paciente'}
                idade={patient?.idade || (patient?.data_nascimento ? calcularIdade(patient.data_nascimento) : null)}
                altura={(patient as any)?.altura_inicial || null}
                pesoInicial={(patient as any)?.peso_inicial || null}
                sexo={patient?.genero || null}
                onSuccess={handleBioSuccess}
              />
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
                    {checkins.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">
                          {new Date(checkins[checkins.length - 1]?.data_checkin).toLocaleDateString('pt-BR')} - {new Date(checkins[0]?.data_checkin).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
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

          {/* Cards de Resumo - Movidos do EvolutionCharts */}
          {checkins.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Check-ins Realizados */}
              <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/10">
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
                <Card className="bg-gradient-to-br from-cyan-500/5 to-cyan-600/5 border-cyan-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">Idade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {calcularIdade(patient.data_nascimento)}
                      <span className="text-lg ml-1">anos</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Idade atual</p>
                  </CardContent>
                </Card>
              )}

              {/* Altura */}
              {patient?.altura_inicial && (
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">Altura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {patient.altura_inicial}
                      <span className="text-lg ml-1">m</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Altura</p>
                  </CardContent>
                </Card>
              )}

              {/* Peso Inicial */}
              {(() => {
                // Preparar dados de peso
                const weightData = [];
                if (patient?.peso_inicial) {
                  const dataInicial = patient.data_fotos_iniciais || patient.created_at;
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

                return weightData.length > 0 ? (
                  <Card className="bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/10 relative group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-300 flex items-center justify-between">
                        Peso Inicial
                        <InitialDataInput
                          telefone={telefone!}
                          nome={patient?.nome || 'Paciente'}
                          onSuccess={handleInitialDataSuccess}
                          editMode={true}
                        />
                      </CardTitle>
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
                ) : null;
              })()}

              {/* Peso Atual */}
              {checkins[0]?.peso && (
                <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 border-indigo-500/10">
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
              {(() => {
                // Calcular variação
                const weightData = [];
                if (patient?.peso_inicial) {
                  weightData.push(parseFloat(patient.peso_inicial.toString()));
                }
                checkins.slice().reverse().forEach((c) => {
                  if (c.peso) {
                    weightData.push(parseFloat(c.peso.replace(',', '.')));
                  }
                });

                const weightChange = weightData.length >= 2 
                  ? (weightData[weightData.length - 1] - weightData[0]).toFixed(1)
                  : '0.0';
                const isNegative = parseFloat(weightChange) < 0;
                const isNeutral = Math.abs(parseFloat(weightChange)) < 0.1;

                return (
                  <Card className={`bg-gradient-to-br ${isNeutral ? 'from-slate-500/5 to-slate-600/5 border-slate-500/10' : isNegative ? 'from-emerald-500/5 to-emerald-600/5 border-emerald-500/10' : 'from-orange-500/5 to-orange-600/5 border-orange-500/10'}`}>
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
                );
              })()}
            </div>
          )}

          {/* Card especial quando não há check-ins */}
          {checkins.length === 0 && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-8 text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
                <h3 className="text-xl font-semibold mb-2 text-white">
                  Nenhum check-in registrado ainda
                </h3>
                <p className="text-slate-400 mb-6">
                  Este paciente ainda não possui check-ins, mas você já pode:
                </p>
                <div className="flex flex-col gap-3 max-w-md mx-auto mb-6">
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      📊
                    </div>
                    <span className="text-left">Cadastrar bioimpedâncias e acompanhar composição corporal</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      📸
                    </div>
                    <span className="text-left">Registrar o primeiro check-in com fotos de evolução</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      📈
                    </div>
                    <span className="text-left">Acompanhar métricas e progresso ao longo do tempo</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  <InitialDataInput
                    telefone={telefone!}
                    nome={patient?.nome || 'Paciente'}
                    onSuccess={handleInitialDataSuccess}
                  />
                  <BioimpedanciaInput
                    telefone={telefone!}
                    nome={patient?.nome || 'Paciente'}
                    idade={patient?.idade || (patient?.data_nascimento ? calcularIdade(patient.data_nascimento) : null)}
                    altura={(patient as any)?.altura_inicial || null}
                    pesoInicial={(patient as any)?.peso_inicial || null}
                    sexo={patient?.genero || null}
                    onSuccess={handleBioSuccess}
                  />
                  <Button
                    variant="outline"
                    onClick={() => navigate('/checkins')}
                    className="gap-2 border-slate-600/50 text-slate-300 hover:bg-slate-700/50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aviso se houver poucos check-ins */}
          {checkins.length > 0 && checkins.length < 3 && (
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

          {/* Dados Iniciais (quando não há check-ins mas há fotos/medidas cadastradas) */}
          {(() => {
            const hasInitialData = patient && (patient.foto_inicial_frente || patient.foto_inicial_lado || patient.foto_inicial_lado_2 || patient.foto_inicial_costas || patient.peso_inicial || patient.altura_inicial);
            console.log('🔍 Verificando dados iniciais:', {
              checkinsLength: checkins.length,
              hasPatient: !!patient,
              hasInitialData,
              patient: patient
            });
            return checkins.length === 0 && hasInitialData;
          })() && (
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-purple-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Camera className="w-5 h-5 text-purple-400" />
                  Dados Iniciais Cadastrados
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Baseline do paciente - {patient.data_fotos_iniciais ? new Date(patient.data_fotos_iniciais).toLocaleDateString('pt-BR') : 'Data não informada'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Medidas Iniciais */}
                {(patient.data_nascimento || patient.peso_inicial || patient.altura_inicial || patient.medida_cintura_inicial || patient.medida_quadril_inicial) && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {patient.data_nascimento && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-slate-400 mb-1">Idade</p>
                        <p className="text-2xl font-bold text-white">{calcularIdade(patient.data_nascimento)} anos</p>
                      </div>
                    )}
                    {patient.peso_inicial && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-slate-400 mb-1">Peso Inicial</p>
                        <p className="text-2xl font-bold text-white">{patient.peso_inicial} kg</p>
                      </div>
                    )}
                    {patient.altura_inicial && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-slate-400 mb-1">Altura</p>
                        <p className="text-2xl font-bold text-white">{patient.altura_inicial} m</p>
                      </div>
                    )}
                    {patient.medida_cintura_inicial && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-slate-400 mb-1">Cintura</p>
                        <p className="text-2xl font-bold text-white">{patient.medida_cintura_inicial} cm</p>
                      </div>
                    )}
                    {patient.medida_quadril_inicial && (
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-purple-500/30">
                        <p className="text-xs text-slate-400 mb-1">Quadril</p>
                        <p className="text-2xl font-bold text-white">{patient.medida_quadril_inicial} cm</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fotos Iniciais */}
                {(patient.foto_inicial_frente || patient.foto_inicial_lado || patient.foto_inicial_lado_2 || patient.foto_inicial_costas) && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-purple-400" />
                      Fotos Baseline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {patient.foto_inicial_frente && (
                        <div className="space-y-2">
                          <div className="relative group">
                            <img 
                              src={convertGoogleDriveUrl(patient.foto_inicial_frente) || patient.foto_inicial_frente} 
                              alt="Foto Frontal Inicial"
                              className="w-full h-64 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_frente) || patient.foto_inicial_frente!, 'Foto Frontal')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_frente!, 'Foto Frontal')}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleDeletePhoto('foto_inicial_frente')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-center text-sm text-purple-300 font-semibold">📷 Frontal</p>
                        </div>
                      )}
                      {patient.foto_inicial_lado && (
                        <div className="space-y-2">
                          <div className="relative group">
                            <img 
                              src={convertGoogleDriveUrl(patient.foto_inicial_lado) || patient.foto_inicial_lado} 
                              alt="Foto Lateral Esquerda"
                              className="w-full h-64 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_lado) || patient.foto_inicial_lado!, 'Foto Lateral Esquerda')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_lado!, 'Foto Lateral Esquerda')}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleDeletePhoto('foto_inicial_lado')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-center text-sm text-purple-300 font-semibold">📷 Lateral Esquerda</p>
                        </div>
                      )}
                      {patient.foto_inicial_lado_2 && (
                        <div className="space-y-2">
                          <div className="relative group">
                            <img 
                              src={convertGoogleDriveUrl(patient.foto_inicial_lado_2) || patient.foto_inicial_lado_2} 
                              alt="Foto Lateral Direita"
                              className="w-full h-64 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_lado_2) || patient.foto_inicial_lado_2!, 'Foto Lateral Direita')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_lado_2!, 'Foto Lateral Direita')}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleDeletePhoto('foto_inicial_lado_2')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-center text-sm text-purple-300 font-semibold">📷 Lateral Direita</p>
                        </div>
                      )}
                      {patient.foto_inicial_costas && (
                        <div className="space-y-2">
                          <div className="relative group">
                            <img 
                              src={convertGoogleDriveUrl(patient.foto_inicial_costas) || patient.foto_inicial_costas} 
                              alt="Foto Costas Inicial"
                              className="w-full h-64 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                              onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_costas) || patient.foto_inicial_costas!, 'Foto de Costas')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_costas!, 'Foto de Costas')}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={() => handleDeletePhoto('foto_inicial_costas')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-center text-sm text-purple-300 font-semibold">📷 Costas</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão para editar */}
                <div className="flex justify-center pt-4">
                  <InitialDataInput
                    telefone={telefone!}
                    nome={patient?.nome || 'Paciente'}
                    onSuccess={handleInitialDataSuccess}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas de Composição Corporal - Aparece independente de check-ins */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <BodyCompositionMetrics data={bodyCompositions} />
            </motion.div>
          )}

          {/* Gráfico de Evolução de % Gordura - Aparece independente de check-ins */}
          {bodyCompositions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <BodyFatChart data={bodyCompositions} />
            </motion.div>
          )}

          {/* Seções que só aparecem quando há check-ins */}
          {checkins.length > 0 && (
            <>

          {/* Badges de Conquistas */}
          {achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <AchievementBadges achievements={achievements} />
            </motion.div>
          )}

          {/* Análise de Tendências */}
          {trends.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TrendsAnalysis trends={trends} />
            </motion.div>
          )}

          {/* Análise Inteligente com IA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <AIInsights checkins={checkins} />
          </motion.div>

          {/* Gráficos de Evolução */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <EvolutionCharts checkins={checkins} patient={patient} />
          </motion.div>

          {/* Comparação de Fotos */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PhotoComparison checkins={checkins} patient={patient} />
          </motion.div>

          {/* Timeline Detalhada */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Timeline checkins={checkins} onCheckinUpdated={loadEvolution} />
          </motion.div>
            </>
          )}

          {/* Card de Ações Finais - Aparece sempre */}
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
                <PortalPNGButton
                  telefone={telefone!}
                  patientName={patient?.nome || 'Paciente'}
                />
                
                <PortalPDFButton
                  telefone={telefone!}
                  patientName={patient?.nome || 'Paciente'}
                />
                
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

        {/* Dialog de Zoom da Foto */}
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-4xl bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">{zoomedPhoto?.label}</DialogTitle>
            </DialogHeader>
            {zoomedPhoto && (
              <div className="flex items-center justify-center">
                <img 
                  src={zoomedPhoto.url} 
                  alt={zoomedPhoto.label}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DashboardLayout>
  );
}

