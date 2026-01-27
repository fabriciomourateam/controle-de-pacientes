import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { createClient } from '@supabase/supabase-js';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { TrendsAnalysis } from '@/components/evolution/TrendsAnalysis';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { detectAchievements } from '@/lib/achievement-system';
import { analyzeTrends } from '@/lib/trends-analysis';
import { EvolutionExportPage } from '@/components/evolution/EvolutionExportPage';
import { EditableRenewalSection } from '@/components/renewal/EditableRenewalSection';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';
import { 
  Heart,
  RefreshCw,
  MoreVertical,
  Eye,
  FileImage,
  FileText,
  BarChart3,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type Patient = Database['public']['Tables']['patients']['Row'];

// Cliente Supabase com service role para acesso público
const supabaseServiceRole = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

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
  ];

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  return phrases[dayOfYear % phrases.length];
};

export default function PublicPortal() {
  const { telefone } = useParams<{ telefone: string }>();
  const { toast } = useToast();
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
  const [bioLimit, setBioLimit] = useState<number | null>(50);
  const [showBioLimitControl, setShowBioLimitControl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [showEvolutionExport, setShowEvolutionExport] = useState(false);
  const [evolutionExportMode, setEvolutionExportMode] = useState<'png' | 'pdf' | null>(null);

  // Hook para comparação destacada (somente leitura)
  const { comparison, loading: comparisonLoading } = useFeaturedComparison(telefone);
  
  console.log('🎯 PublicPortal: Telefone:', telefone);
  console.log('🎯 PublicPortal: Comparação carregada:', comparison);
  console.log('🎯 PublicPortal: Comparação visível?', comparison?.is_visible);
  console.log('🎯 PublicPortal: Comparação loading?', comparisonLoading);
  console.log('🎯 PublicPortal: Vai renderizar FeaturedComparison?', !!(comparison && comparison.is_visible));

  // Calcular dados
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];

  // Gerar conteúdo padrão para "Sua Evolução"
  const generateDefaultEvolutionContent = () => {
    if (checkins.length === 0) {
      return `
        <h3>Bem-vindo ao seu acompanhamento!</h3>
        <p>Estamos começando sua jornada de transformação. Em breve você verá aqui um resumo completo da sua evolução.</p>
      `;
    }

    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
    );
    
    const firstCheckin = sortedCheckins[0];
    const lastCheckin = sortedCheckins[sortedCheckins.length - 1];
    
    const patientWithInitialData = patient as any;
    const pesoInicial = patientWithInitialData?.peso_inicial 
      ? parseFloat(patientWithInitialData.peso_inicial.toString()) 
      : parseFloat(firstCheckin.peso || '0');
    const pesoAtual = parseFloat(lastCheckin.peso || '0');
    const perdaPeso = pesoInicial - pesoAtual;
    
    let dataInicio: Date;
    if (patient?.inicio_acompanhamento) {
      dataInicio = new Date(patient.inicio_acompanhamento);
    } else if (firstCheckin?.data_checkin) {
      dataInicio = new Date(firstCheckin.data_checkin);
    } else if (patient?.created_at) {
      dataInicio = new Date(patient.created_at);
    } else {
      dataInicio = new Date();
    }
    
    const dataAtual = new Date();
    const diasAcompanhamento = Math.floor((dataAtual.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    const mesesAcompanhamento = Math.floor(diasAcompanhamento / 30);
    const semanasAcompanhamento = Math.floor(diasAcompanhamento / 7);
    
    let tempoTexto = '';
    if (mesesAcompanhamento > 0) {
      tempoTexto = `${mesesAcompanhamento} ${mesesAcompanhamento === 1 ? 'mês' : 'meses'}`;
    } else if (semanasAcompanhamento > 0) {
      tempoTexto = `${semanasAcompanhamento} ${semanasAcompanhamento === 1 ? 'semana' : 'semanas'}`;
    } else {
      tempoTexto = `${diasAcompanhamento} ${diasAcompanhamento === 1 ? 'dia' : 'dias'}`;
    }

    let medidasTexto = '';
    const cinturaInicial = parseFloat((firstCheckin as any).cintura || '0');
    const cinturaAtual = parseFloat((lastCheckin as any).cintura || '0');
    if (cinturaInicial > 0 && cinturaAtual > 0) {
      const reducaoCintura = cinturaInicial - cinturaAtual;
      if (reducaoCintura > 0) {
        medidasTexto = `<li>✨ <strong>${reducaoCintura.toFixed(1)} cm</strong> de redução na cintura</li>`;
      }
    }

    const genero = patient?.genero?.toLowerCase() || '';
    const isFeminino = genero === 'feminino' || genero === 'f';
    const pronome = isFeminino ? 'a' : 'o';
    
    let textoMotivacional = '';
    if (perdaPeso > 0) {
      textoMotivacional = `Sua dedicação está transformando seu corpo! A redução de ${Math.abs(perdaPeso).toFixed(1)}kg em ${tempoTexto} é apenas o começo - o mais importante é a recomposição corporal que está acontecendo. Você está perdendo gordura e ganhando definição muscular, o que significa um corpo mais forte, saudável e funcional. Continue focad${pronome} e consistente - cada treino e cada refeição equilibrada está moldando a melhor versão de você! 💪✨`;
    } else if (perdaPeso < 0) {
      textoMotivacional = `Excelente progresso na construção muscular! O ganho de ${Math.abs(perdaPeso).toFixed(1)}kg em ${tempoTexto} mostra que sua recomposição corporal está no caminho certo. Você está construindo massa magra de qualidade, o que acelera seu metabolismo e transforma sua silhueta. Seu comprometimento com treino e nutrição está criando um corpo mais forte e definido. Mantenha o foco - a transformação real vai muito além da balança! 🚀💪`;
    } else {
      textoMotivacional = `Você está mantendo seu peso de forma consistente em ${tempoTexto} de acompanhamento, o que demonstra controle e disciplina. Mas lembre-se: a verdadeira transformação está na recomposição corporal - trocar gordura por músculo, ganhar definição e força. Seu corpo está mudando por dentro, mesmo que a balança não mostre. Continue firme no processo - músculos pesam mais que gordura, e é isso que te deixa com aquele corpo definido e saudável que você busca! 🎯✨`;
    }

    return `
      <h3>🎯 Sua Jornada de Transformação</h3>
      <p><strong>Peso inicial:</strong> ${pesoInicial.toFixed(1)}kg | <strong>Peso atual:</strong> ${pesoAtual.toFixed(1)}kg</p>
      <p>Em <strong>${tempoTexto}</strong> de acompanhamento, você já conquistou:</p>
      <ul>
        <li>💪 <strong>${Math.abs(perdaPeso).toFixed(1)} kg</strong> ${perdaPeso > 0 ? 'perdidos' : perdaPeso < 0 ? 'ganhos' : 'mantidos'}</li>
        ${medidasTexto}
        <li>📊 <strong>${checkins.length}</strong> check-ins realizados com dedicação</li>
      </ul>
      <p>${textoMotivacional}</p>
    `;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showBioLimitControl && !target.closest('.bio-limit-control-menu')) {
        setShowBioLimitControl(false);
      }
    };
    
    if (showBioLimitControl) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showBioLimitControl]);

  useEffect(() => {
    loadPublicPortalData();
  }, [telefone, bioLimit]);

  async function loadPublicPortalData() {
    if (!telefone) {
      setError('Telefone não informado');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando dados públicos para:', telefone);

      const [checkinsData, patientResult, bioResult] = await Promise.all([
        checkinService.getByPhone(telefone),
        supabaseServiceRole
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .maybeSingle(),
        (async () => {
          let bioQuery = (supabaseServiceRole as any)
            .from('body_composition')
            .select('*')
            .eq('telefone', telefone)
            .order('data_avaliacao', { ascending: false });
          
          if (bioLimit !== null && bioLimit !== undefined) {
            bioQuery = bioQuery.limit(bioLimit);
          }
          
          return await bioQuery;
        })()
      ]);

      if (patientResult.error || !patientResult.data) {
        throw new Error('Paciente não encontrado');
      }

      setPatient(patientResult.data);
      setCheckins(checkinsData);
      
      if (patientResult.data.id) {
        setPatientId(patientResult.data.id);
      }
      
      if (bioResult.data) {
        setBodyCompositions(bioResult.data);
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados públicos:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function handleExportEvolution(format: 'png' | 'pdf') {
    setEvolutionExportMode(format);
    setShowEvolutionExport(true);
  }

  async function handleDirectEvolutionExport(exportRef: HTMLDivElement, format: 'png' | 'pdf') {
    try {
      setExporting(true);
      toast({
        title: format === 'png' ? '📸 Gerando PNG...' : '📄 Gerando PDF...',
        description: 'Aguarde enquanto criamos seu arquivo'
      });

      const canvas = await html2canvas(exportRef, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      if (format === 'png') {
        const dataURL = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `evolucao-${patient?.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataURL;
        link.click();
        toast({ title: 'PNG gerado! 🎉', description: 'Sua evolução foi exportada' });
      } else {
        const { jsPDF } = await import('jspdf');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = 210;
        const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, imgHeightMM] });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
        pdf.save(`evolucao-${patient?.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: 'PDF gerado! 📄', description: 'Seu relatório foi baixado' });
      }
      setShowEvolutionExport(false);
      setEvolutionExportMode(null);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o arquivo', variant: 'destructive' });
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

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-400 mb-4">
              <Heart className="w-16 h-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">
              Ops! Algo deu errado
            </h3>
            <p className="text-slate-400 mb-6">
              {error || 'Não foi possível carregar os dados'}
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.12),transparent_50%)]" />
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
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
      </div>
      
      {/* Conteúdo */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          >
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                📊 {patient?.nome || 'Meu Acompanhamento'}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1">
                Acompanhe seu progresso e conquistas
              </p>
            </div>
            {/* Botões ocultados na página pública */}
          </motion.div>

          {/* Card de Cabeçalho */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border-slate-700/50 shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col gap-4">
                  <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      Minha Evolução
                    </h1>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Seção "Sua Evolução" - Texto Editável (somente leitura) */}
          {patient?.telefone && checkins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <EditableRenewalSection
                patientTelefone={patient.telefone}
                sectionKey="summary_content"
                title="Sua Evolução"
                icon={<Sparkles className="w-6 h-6 text-yellow-400" />}
                defaultContent={generateDefaultEvolutionContent()}
                placeholder="Descreva a evolução do paciente de forma personalizada..."
                isPublicAccess={true} // ❌ Modo somente leitura
              />
            </motion.div>
          )}

          {/* Controle de Limite de Bioimpedância - OCULTO NA PÁGINA PÚBLICA */}

          {/* Comparação Destacada Antes/Depois - Somente se visível */}
          {comparison && comparison.is_visible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <FeaturedComparison
                comparison={comparison}
                isEditable={false} // Sem controles no público
                isCompact={true} // Modo compacto para página pública
              />
            </motion.div>
          )}

          {/* Conteúdo de Evolução - ÚNICA DIFERENÇA: isEditable={false} */}
          {patientId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-6"
            >
              <PatientEvolutionTab 
                patientId={patientId}
                checkins={checkins}
                patient={patient}
                bodyCompositions={bodyCompositions}
                achievements={achievements}
                refreshTrigger={0}
                isPublicAccess={true} // ❌ Modo público - sem edição, fotos filtradas
                hasFeaturedComparison={!!(comparison && comparison.is_visible)} // Oculta PhotoComparison se houver comparação destacada
              />
            </motion.div>
          )}

          {/* Footer */}
          <div className="text-center text-xs sm:text-sm text-white py-4 sm:py-6 px-4">
            {getDailyMotivationalPhrase()}
          </div>
        </div>
      </div>

      {/* Modal de Exportação da Evolução */}
      {showEvolutionExport && patient && (
        <EvolutionExportPage
          patient={patient}
          checkins={checkins}
          bodyCompositions={bodyCompositions}
          onClose={() => { setShowEvolutionExport(false); setEvolutionExportMode(null); }}
          directExportMode={evolutionExportMode || undefined}
          onDirectExport={handleDirectEvolutionExport}
        />
      )}
    </div>
  );
}
