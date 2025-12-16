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
import { InstallPWAButton } from '@/components/InstallPWAButton';
import { PatientDietPortal } from '@/components/patient-portal/PatientDietPortal';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DietPDFGenerator } from '@/lib/diet-pdf-generator';
import { 
  Activity, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Lock,
  Download,
  TrendingUp,
  Weight,
  Flame,
  Smartphone,
  FileText,
  Scale,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WeightInput } from '@/components/evolution/WeightInput';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

const getDailyMotivationalPhrase = () => {
  const phrases = [
    'Cada refeição é um passo em direção aos seus objetivos! 💪',
    'Você está no caminho certo! Continue assim! 🌟',
    'Pequenas escolhas diárias geram grandes resultados! ✨',
    'Seu compromisso com a saúde é inspirador! 🎯',
    'Cada dia é uma nova oportunidade de cuidar de si! 🌈',
    'Você está construindo um futuro mais saudável! 🚀',
    'Consistência é a chave do sucesso! 🔑',
    'Seu esforço de hoje será sua vitória de amanhã! 🏆',
    'Acredite no processo e confie na jornada! 💚',
    'Você é mais forte do que imagina! 💪',
    'Cada refeição equilibrada é uma vitória! 🎉',
    'Seu bem-estar é sua prioridade! ❤️',
    'Transformação começa com uma refeição de cada vez! 🌱',
    'Você está fazendo a diferença na sua vida! ⭐',
    'Mantenha o foco e siga em frente! 🎯',
    'Sua dedicação é admirável! 👏',
    'Cada escolha saudável te aproxima dos seus sonhos! 🌟',
    'Você está no controle da sua jornada! 🧭',
    'Pequenos progressos diários levam a grandes mudanças! 📈',
    'Sua saúde é seu maior investimento! 💎',
    'Continue firme, você está indo muito bem! 🚀',
    'Cada refeição é uma oportunidade de nutrir seu corpo! 🥗',
    'Você está criando hábitos que transformam vidas! 🌿',
    'Seu comprometimento é inspirador! 💫',
    'A jornada de mil milhas começa com um passo! 🚶',
    'Você está escrevendo sua história de sucesso! 📖',
    'Cada dia é uma chance de ser melhor! 🌅',
    'Seu futuro agradece pelas escolhas de hoje! 🙏',
    'Você está no caminho da transformação! 🦋',
    'Mantenha a motivação e siga seus objetivos! 🎯',
  ];

  // Usar o dia do ano (1-365) para selecionar uma frase
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  return phrases[dayOfYear % phrases.length];
};

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
  const [patientId, setPatientId] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [weightInputOpen, setWeightInputOpen] = useState(false);
  const [chartsRefreshTrigger, setChartsRefreshTrigger] = useState(0);

  // Calcular dados
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];

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

  // Auto-download quando parâmetro autoDownload está presente
  useEffect(() => {
    if (!loading && patient && portalRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const autoDownloadFormat = urlParams.get('autoDownload'); // 'png', 'pdf', ou 'jpeg'
      
      if (autoDownloadFormat) {
        console.log(`🎯 Auto-download ${autoDownloadFormat.toUpperCase()} detectado! Iniciando captura...`);
        
        // Aguardar renderização completa
        setTimeout(async () => {
          console.log(`📸 Capturando portal como ${autoDownloadFormat.toUpperCase()}...`);
          
          if (autoDownloadFormat === 'png' || autoDownloadFormat === 'jpeg') {
            await handleExportEvolutionPDF();
          } else if (autoDownloadFormat === 'pdf') {
            toast({
              title: 'PDF em desenvolvimento',
              description: 'Use a exportação PNG por enquanto',
              variant: 'destructive'
            });
          }
          
          console.log('✅ Download iniciado! Fechando aba em 2 segundos...');
          
          // Fechar aba automaticamente após download
          setTimeout(() => {
            window.close();
          }, 2000);
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

      // Buscar todos os dados em paralelo para melhor performance
      const [checkinsData, patientResult, bioResult] = await Promise.all([
        checkinService.getByPhone(telefone),
        supabase
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .single(),
        (supabase as any)
          .from('body_composition')
          .select('*')
          .eq('telefone', telefone)
          .order('data_avaliacao', { ascending: false })
      ]);
      
      if (checkinsData.length === 0) {
        toast({
          title: 'Nenhum check-in encontrado',
          description: 'Este paciente ainda não possui check-ins registrados',
          variant: 'destructive'
        });
      }
      
      setCheckins(checkinsData);
      setPatient(patientResult.data);
      
      // Salvar patient_id para usar nos componentes de dieta
      if (patientResult.data?.id) {
        setPatientId(patientResult.data.id);
      }

      if (bioResult.data) {
        setBodyCompositions(bioResult.data);
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

  async function handleExportEvolutionPDF() {
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

  async function handleExportDietPDF() {
    if (!patient || !patientId) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu plano alimentar em PDF'
      });

      // Buscar dados do plano alimentar
      const plans = await dietService.getByPatientId(patientId);
      const activePlan = plans.find((p: any) => p.status === 'active' || p.active);
      
      if (!activePlan) {
        toast({
          title: 'Erro',
          description: 'Nenhum plano alimentar ativo encontrado',
          variant: 'destructive'
        });
        setExporting(false);
        return;
      }

      const planDetails = await dietService.getById(activePlan.id);

      // Usar o gerador melhorado de PDF
      await DietPDFGenerator.generatePDF(
        planDetails as any,
        patient,
        {
          theme: 'light', // Pode adicionar opção de escolha mais tarde
          showMacrosPerMeal: true
        }
      );

      setExporting(false);
      toast({
        title: 'PDF gerado! ✅',
        description: 'Seu plano alimentar foi baixado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o PDF',
        variant: 'destructive'
      });
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
    <div ref={portalRef} className="min-h-screen relative overflow-hidden">
      {/* Background Premium Moderno */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Gradiente radial para profundidade */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
        
        {/* Padrão de grade sutil */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Efeito de brilho animado */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Linhas de gradiente decorativas */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>
      
      {/* Conteúdo com z-index */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header do Portal */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        >
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
              📊 Meu Acompanhamento
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
            <InstallPWAButton />
            <Button
              onClick={() => setWeightInputOpen(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all whitespace-nowrap flex-1 sm:flex-none min-h-[44px] text-sm sm:text-base"
            >
              <Scale className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Registrar Peso</span>
              <span className="sm:hidden">Peso</span>
            </Button>
            
            {/* Menu de ações: Baixar e Atualizar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px] min-w-[44px] px-3"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-white w-56">
                <DropdownMenuItem
                  onClick={handleExportEvolutionPDF}
                  disabled={exporting}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Gerando...' : 'Baixar Evolução PDF'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportDietPDF}
                  disabled={exporting}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {exporting ? 'Gerando...' : 'Baixar Dieta'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={loadPortalData}
                  className="text-white hover:bg-slate-700 cursor-pointer py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Card de Informações do Paciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-slate-800/60 backdrop-blur-sm border-slate-700/50 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="w-14 h-14 sm:w-20 sm:h-20 border-4 border-blue-500/30 flex-shrink-0">
                  <AvatarFallback className="bg-blue-500/20 text-blue-300 text-lg sm:text-2xl font-bold">
                    {patient?.nome?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-white truncate">{patient?.nome || 'Seu Nome'}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-2 sm:mt-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{checkins.length} check-ins</span>
                    </div>
                    {checkins.length > 0 && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">
                          Desde {new Date(checkins[checkins.length - 1]?.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>


        {/* Plano Alimentar, Metas e Progresso */}
        {patientId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="hide-in-pdf"
          >
            <PatientDietPortal 
              patientId={patientId} 
              patientName={patient?.nome || 'Paciente'}
              checkins={checkins}
              patient={patient}
              bodyCompositions={bodyCompositions}
              achievements={achievements}
              refreshTrigger={chartsRefreshTrigger}
            />
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-white py-4 sm:py-6 px-4">
          {getDailyMotivationalPhrase()}
        </div>
        </div>
      </div>

      {/* Modal de Registro de Peso */}
      {patient?.telefone && (
        <WeightInput
          telefone={patient.telefone}
          open={weightInputOpen}
          onOpenChange={setWeightInputOpen}
          onSuccess={() => {
            loadPortalData(); // Recarregar dados para atualizar gráficos
            // Forçar atualização dos gráficos
            setChartsRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

