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
import { InstallPWAButton } from '@/components/pwa';
import { PatientDietPortal } from '@/components/patient-portal/PatientDietPortal';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
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
  FileText
} from 'lucide-react';
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
        supabase
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

      // Criar HTML do plano alimentar
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              color: #222222;
              background: #fff;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #00C98A;
            }
            .header h1 {
              color: #00C98A;
              font-size: 32px;
              margin-bottom: 10px;
            }
            .meal-card {
              background: #F5F7FB;
              border: 1px solid #E5E7EB;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .meal-title {
              color: #222222;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .food-item {
              background: #FFFFFF;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 10px;
            }
            .macros {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #E5E7EB;
            }
            .macro-item {
              text-align: center;
            }
            .macro-value {
              font-size: 24px;
              font-weight: bold;
              color: #00C98A;
            }
            .macro-label {
              font-size: 12px;
              color: #777777;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🥗 Plano Alimentar</h1>
            <p>${patient.nome}</p>
            <p style="color: #777777; font-size: 14px; margin-top: 5px;">${planDetails.name || 'Plano Alimentar'}</p>
          </div>
          
          ${planDetails.diet_meals && planDetails.diet_meals.length > 0 ? planDetails.diet_meals
            .sort((a: any, b: any) => (a.meal_order || 0) - (b.meal_order || 0))
            .map((meal: any) => {
              const mealTotals = calcularTotaisPlano({ diet_meals: [meal] });
              return `
                <div class="meal-card">
                  <div class="meal-title">${meal.meal_name}${meal.suggested_time ? ` - ${meal.suggested_time}` : ''}</div>
                  ${meal.diet_foods && meal.diet_foods.length > 0 ? meal.diet_foods.map((food: any) => `
                    <div class="food-item">
                      <strong>${food.food_name}</strong> - ${food.quantity} ${food.unit}
                      ${food.calories ? `<span style="float: right; color: #777777;">${food.calories} kcal</span>` : ''}
                    </div>
                  `).join('') : '<p style="color: #777777;">Nenhum alimento adicionado</p>'}
                  ${meal.instructions ? `
                    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin-top: 15px; border-radius: 4px;">
                      <strong style="color: #92400E;">⚠️ Instruções:</strong>
                      <p style="color: #78350F; margin-top: 5px;">${meal.instructions}</p>
                    </div>
                  ` : ''}
                  <div style="text-align: right; margin-top: 10px; color: #777777; font-size: 12px;">
                    Total: ${mealTotals.calorias} kcal
                  </div>
                </div>
              `;
            }).join('') : '<p>Nenhuma refeição cadastrada</p>'}
          
          ${planDetails.diet_guidelines && planDetails.diet_guidelines.length > 0 ? `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
              <h2 style="color: #00C98A; font-size: 24px; margin-bottom: 15px;">📚 Orientações</h2>
              ${planDetails.diet_guidelines.map((guideline: any) => `
                <div style="background: #F5F7FB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                  <h3 style="color: #222222; font-size: 18px; margin-bottom: 8px;">${guideline.title}</h3>
                  <p style="color: #777777; line-height: 1.6;">${guideline.content}</p>
                  <span style="display: inline-block; background: #00C98A; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; margin-top: 8px;">${guideline.guideline_type}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </body>
        </html>
      `;

      // Criar elemento temporário
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = '800px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      // Importar jsPDF
      const { jsPDF } = await import('jspdf');

      // Capturar como imagem
      const canvas = await html2canvas(tempDiv, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
        windowHeight: tempDiv.scrollHeight,
      });

      // Remover elemento temporário
      document.body.removeChild(tempDiv);

      // Converter para PDF
      const imgData = canvas.toDataURL('image/png', 0.98);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210;
      const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      pdf.save(`plano-alimentar-${patient.nome.replace(/\s+/g, '-')}.pdf`);

      toast({
        title: 'PDF gerado! 🎉',
        description: 'Seu plano alimentar foi baixado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao gerar PDF do plano:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF do plano alimentar',
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
              📊 Meu Acompanhamento
            </h1>
            <p className="text-slate-400 mt-1">
              Acompanhe seu progresso e conquistas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <InstallPWAButton />
            <Button
              onClick={handleExportEvolutionPDF}
              disabled={exporting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? 'Gerando...' : 'Baixar Evolução PDF'}
            </Button>
            <Button
              onClick={handleExportDietPDF}
              disabled={exporting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-2" />
              {exporting ? 'Gerando...' : 'Baixar Dieta'}
            </Button>
            <Button
              onClick={loadPortalData}
              variant="outline"
              className="border-slate-600 hover:bg-slate-800 whitespace-nowrap"
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
            />
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-white py-6">
          {getDailyMotivationalPhrase()}
        </div>
        </div>
      </div>
    </div>
  );
}

