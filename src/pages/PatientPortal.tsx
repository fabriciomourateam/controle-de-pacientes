import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { supabase } from '@/integrations/supabase/client';
import { validateToken } from '@/lib/patient-portal-service';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { TrendsAnalysis } from '@/components/evolution/TrendsAnalysis';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { detectAchievements } from '@/lib/achievement-system';
import { analyzeTrends } from '@/lib/trends-analysis';
import { 
  Activity, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Lock,
  Download,
  TrendingUp,
  Weight,
  Flame
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

export default function PatientPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const portalRef = useRef<HTMLDivElement>(null);

  // Calcular dados
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

  useEffect(() => {
    loadPortalData();
  }, [token]);

  // Auto-download do PNG ou PDF quando parâmetros autoDownload=true ou autoDownloadPDF=true
  useEffect(() => {
    if (!loading && patient && portalRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const shouldAutoDownload = urlParams.get('autoDownload') === 'true';
      const shouldAutoDownloadPDF = urlParams.get('autoDownloadPDF') === 'true';
      
      if (shouldAutoDownload) {
        console.log('🎯 Auto-download PNG detectado! Iniciando captura...');
        
        // Aguardar um pouco para garantir que tudo renderizou
        setTimeout(async () => {
          console.log('📸 Capturando portal como PNG...');
          await handleExportPNG();
          
          console.log('✅ Download iniciado! Fechando aba em 1 segundo...');
          
          // Fechar aba automaticamente após iniciar o download
          setTimeout(() => {
            window.close();
          }, 1000);
        }, 2000);
      } else if (shouldAutoDownloadPDF) {
        console.log('🎯 Auto-download PDF detectado! Iniciando captura...');
        
        // Aguardar um pouco para garantir que tudo renderizou
        setTimeout(async () => {
          console.log('📄 Capturando portal como PDF...');
          await handleExportPDF();
          
          console.log('✅ Download iniciado! Fechando aba em 1 segundo...');
          
          // Fechar aba automaticamente após iniciar o download
          setTimeout(() => {
            window.close();
          }, 1000);
        }, 2000);
      }
    }
  }, [loading, patient]);

  async function loadPortalData() {
    if (!token) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Validar token e obter telefone
      const telefone = await validateToken(token);
      
      if (!telefone) {
        setUnauthorized(true);
        setLoading(false);
        toast({
          title: 'Link inválido ou expirado',
          description: 'Este link de acesso não é mais válido',
          variant: 'destructive'
        });
        return;
      }

      // Buscar check-ins do paciente
      const checkinsData = await checkinService.getByPhone(telefone);
      
      if (checkinsData.length === 0) {
        toast({
          title: 'Nenhum check-in encontrado',
          description: 'Este paciente ainda não possui check-ins registrados',
          variant: 'destructive'
        });
      }
      
      setCheckins(checkinsData);

      // Buscar dados do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();

      setPatient(patientData);

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
      console.error('Erro ao carregar dados do portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPNG() {
    if (!portalRef.current || !patient) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando imagem...',
        description: 'Aguarde enquanto criamos seu relatório em PNG'
      });

      // Ocultar apenas elementos marcados para ocultar no PNG
      const elementsToHide = portalRef.current.querySelectorAll('.hide-in-pdf');
      const originalDisplay: string[] = [];
      elementsToHide.forEach((el, index) => {
        originalDisplay[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });

      // Aguardar um pouco para garantir que elementos foram ocultados
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturar o portal inteiro como imagem
      const canvas = await html2canvas(portalRef.current, {
        scale: 2.5, // Alta qualidade
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a', // Cor do fundo do portal
        windowWidth: portalRef.current.scrollWidth,
        windowHeight: portalRef.current.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (element) => {
          // Ignorar apenas elementos marcados para ocultar
          return element.classList.contains('hide-in-pdf');
        }
      });

      // Restaurar elementos ocultos
      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplay[index];
      });

      // Converter para blob e fazer download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `minha-evolucao-${patient.nome.replace(/\s+/g, '-')}.png`;
          link.click();
          URL.revokeObjectURL(url);

          toast({
            title: 'Imagem gerada! 🎉',
            description: 'Seu relatório foi baixado com sucesso'
          });
        }
      }, 'image/png', 0.98);

    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a imagem',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPDF() {
    if (!portalRef.current || !patient) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu relatório em PDF'
      });

      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');

      // Ocultar apenas elementos marcados para ocultar no PDF
      const elementsToHide = portalRef.current.querySelectorAll('.hide-in-pdf');
      const originalDisplay: string[] = [];
      elementsToHide.forEach((el, index) => {
        originalDisplay[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });

      // Aguardar um pouco para garantir que elementos foram ocultados
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capturar o portal inteiro como imagem
      const canvas = await html2canvas(portalRef.current, {
        scale: 2.5, // Alta qualidade
        useCORS: true,
        logging: false,
        backgroundColor: '#0f172a', // Cor do fundo do portal
        windowWidth: portalRef.current.scrollWidth,
        windowHeight: portalRef.current.scrollHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        ignoreElements: (element) => {
          // Ignorar apenas elementos marcados para ocultar
          return element.classList.contains('hide-in-pdf');
        }
      });

      // Restaurar elementos ocultos
      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplay[index];
      });

      // Converter canvas para imagem
      const imgData = canvas.toDataURL('image/png', 0.98);
      
      // Dimensões do canvas em pixels
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Largura fixa A4 em mm
      const pdfWidth = 210;
      
      // Calcular altura proporcional (página contínua)
      const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;
      
      // Criar PDF com altura customizada (página contínua)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM] // Largura A4, altura ajustada ao conteúdo
      });

      // Adicionar imagem ocupando toda a página (sem margens)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      
      // Fazer download
      pdf.save(`minha-evolucao-${patient.nome.replace(/\s+/g, '-')}.pdf`);

      toast({
        title: 'PDF gerado! 🎉',
        description: 'Seu relatório foi baixado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full glass-card border-slate-700">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Acesso Negado</h1>
            <p className="text-slate-400">
              Este link de acesso é inválido ou expirou. Entre em contato com seu treinador para obter um novo link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={portalRef} className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header do Portal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              📊 Meu Portal de Evolução
            </h1>
            <p className="text-slate-400 mt-1">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPNG}
              disabled={exporting}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Gerando...' : 'Baixar PNG'}
            </Button>
            <Button
              onClick={loadPortalData}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Card de Informações do Paciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20 border-4 border-blue-500/30">
                  <AvatarFallback className="bg-blue-500/20 text-blue-300 text-2xl font-bold">
                    {patient?.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{patient?.nome || 'Seu Nome'}</h2>
                    {patient?.plano && (
                      <Badge className="bg-purple-600/30 text-purple-200 border-purple-500/30">
                        {patient.plano}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">{checkins.length} check-ins realizados</span>
                    </div>
                    {checkins.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-sm">
                          Desde {new Date(checkins[checkins.length - 1]?.data_checkin).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cards de Resumo */}
        {checkins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                      {calcularIdade(patient.data_nascimento)}
                      <span className="text-lg ml-1">anos</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Idade atual</p>
                  </CardContent>
                </Card>
              )}

              {/* Altura */}
              {patient?.altura_inicial && (
                <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
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
                ) : null;
              })()}

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
              {(() => {
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
                );
              })()}
            </div>
          </motion.div>
        )}

        {/* Aviso se houver poucos check-ins */}
        {checkins.length < 3 && (
          <Card className="bg-amber-900/20 border-amber-700/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-200 font-semibold">Continue Firme!</p>
                  <p className="text-amber-300/80 text-sm mt-1">
                    Você possui {checkins.length} check-in{checkins.length > 1 ? 's' : ''}. Continue registrando para ver análises mais detalhadas!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Badges de Conquistas */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AchievementBadges achievements={achievements} />
          </motion.div>
        )}

        {/* Métricas de Composição Corporal */}
        {bodyCompositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <BodyCompositionMetrics data={bodyCompositions} />
          </motion.div>
        )}

        {/* Análise de Tendências */}
        {trends.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <TrendsAnalysis trends={trends} />
          </motion.div>
        )}

        {/* Gráfico de % Gordura */}
        {bodyCompositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <BodyFatChart data={bodyCompositions} />
          </motion.div>
        )}

        {/* Gráficos de Evolução */}
        {checkins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <EvolutionCharts checkins={checkins} />
          </motion.div>
        )}

        {/* Comparação de Fotos */}
        {checkins.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="hide-in-pdf"
          >
            <PhotoComparison checkins={checkins} />
          </motion.div>
        )}

        {/* Timeline */}
        {checkins.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Timeline checkins={checkins} showEditButton={false} />
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-400 py-6">
          💪 Continue assim! Cada passo conta na sua jornada de transformação. ✨
        </div>
      </div>
    </div>
  );
}

