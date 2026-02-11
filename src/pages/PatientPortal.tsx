import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import * as domtoimage from 'dom-to-image-more';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { EvolutionExportPage } from '@/components/evolution/EvolutionExportPage';
import { EditableRenewalSection } from '@/components/renewal/EditableRenewalSection';
import { PatientEvolutionTab } from '@/components/diets/PatientEvolutionTab';
import { dietService } from '@/lib/diet-service';
import { calcularTotaisPlano } from '@/utils/diet-calculations';
import { DietPDFGenerator } from '@/lib/diet-pdf-generator';
import { DietPremiumPDFGenerator } from '@/lib/diet-pdf-premium-generator';
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { usePortalCardVisibility, PORTAL_CARD_KEYS } from '@/hooks/use-portal-card-visibility';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';
import { CreateFeaturedComparisonModal } from '@/components/evolution/CreateFeaturedComparisonModal';
import { EditFeaturedComparisonModal } from '@/components/evolution/EditFeaturedComparisonModal';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
  MoreVertical,
  Eye,
  FileImage,
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

  // Estado para controlar o limite de bioimpedâncias carregadas
  const [bioLimit, setBioLimit] = useState<number | null>(50); // Padrão: 50 avaliações
  const [showBioLimitControl, setShowBioLimitControl] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [chartsRefreshTrigger, setChartsRefreshTrigger] = useState(0);
  const [portalKey, setPortalKey] = useState(0); // Incrementar para "resetar" e recalcular como primeira vez
  const [showEvolutionExport, setShowEvolutionExport] = useState(false);
  const [evolutionExportMode, setEvolutionExportMode] = useState<'png' | 'pdf' | null>(null);

  // Hook para comparação destacada
  const { comparison, toggleVisibility, deleteComparison, refetch, updateComparison } = useFeaturedComparison(patient?.telefone);
  // Visibilidade no portal público: Sua Evolução e Continue Jornada
  const summaryEvolutionVisibility = usePortalCardVisibility(patient?.telefone, PORTAL_CARD_KEYS.SUMMARY_EVOLUTION);
  const continueJourneyVisibility = usePortalCardVisibility(patient?.telefone, PORTAL_CARD_KEYS.CONTINUE_JOURNEY);
  const [showCreateComparisonModal, setShowCreateComparisonModal] = useState(false);
  const [showEditComparisonModal, setShowEditComparisonModal] = useState(false);

  // Calcular dados
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];

  // ITEM 2: Gerar conteúdo padrão para "Sua Evolução"
  const generateDefaultEvolutionContent = () => {
    if (checkins.length === 0) {
      return `
        <h3>Bem-vindo ao seu acompanhamento!</h3>
        <p>Estamos começando sua jornada de transformação. Em breve você verá aqui um resumo completo da sua evolução.</p>
      `;
    }

    // Ordenar checkins do mais antigo para o mais recente para garantir ordem correta
    const sortedCheckins = [...checkins].sort((a, b) =>
      new Date(a.data_checkin).getTime() - new Date(b.data_checkin).getTime()
    );

    const firstCheckin = sortedCheckins[0]; // Primeiro check-in cronologicamente
    const lastCheckin = sortedCheckins[sortedCheckins.length - 1]; // Último check-in cronologicamente

    // CORREÇÃO: Usar peso_inicial do paciente se disponível (campo existe mas TypeScript não reconhece)
    const patientWithInitialData = patient as any;
    const pesoInicial = patientWithInitialData?.peso_inicial
      ? parseFloat(patientWithInitialData.peso_inicial.toString())
      : parseFloat(firstCheckin.peso || '0');
    const pesoAtual = parseFloat(lastCheckin.peso || '0');
    const perdaPeso = pesoInicial - pesoAtual;

    // Calcular tempo de acompanhamento - DO INÍCIO DO ACOMPANHAMENTO (tabela patients) ATÉ AGORA
    // Prioridade: inicio_acompanhamento > primeiro check-in > created_at
    let dataInicio: Date;
    if (patient?.inicio_acompanhamento) {
      dataInicio = new Date(patient.inicio_acompanhamento);
    } else if (firstCheckin?.data_checkin) {
      dataInicio = new Date(firstCheckin.data_checkin);
    } else if (patient?.created_at) {
      dataInicio = new Date(patient.created_at);
    } else {
      dataInicio = new Date(); // Fallback
    }

    const dataAtual = new Date(); // Data atual, não último check-in
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

    // Calcular redução de medidas (se disponível)
    let medidasTexto = '';
    const cinturaInicial = parseFloat((firstCheckin as any).cintura || '0');
    const cinturaAtual = parseFloat((lastCheckin as any).cintura || '0');
    if (cinturaInicial > 0 && cinturaAtual > 0) {
      const reducaoCintura = cinturaInicial - cinturaAtual;
      if (reducaoCintura > 0) {
        medidasTexto = `<li>✨ <strong>${reducaoCintura.toFixed(1)} cm</strong> de redução na cintura</li>`;
      }
    }

    // Texto motivacional baseado nos dados e gênero do paciente
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

  // Fechar menu de limite ao clicar fora
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
    loadPortalData();
  }, [token, bioLimit]);

  // Salvar token no localStorage para PWA (permite abrir direto no portal)
  useEffect(() => {
    if (token) {
      localStorage.setItem('portal_access_token', token);
    }
  }, [token]);

  // Trocar manifest para o portal do paciente (PWA abre direto no portal)
  useEffect(() => {
    // Salvar referência do manifest original
    const originalManifest = document.querySelector('link[rel="manifest"]');
    const originalHref = originalManifest?.getAttribute('href');

    // Trocar para o manifest do portal
    if (originalManifest) {
      originalManifest.setAttribute('href', '/manifest-portal.json');
    }

    // Atualizar meta tags para o portal
    document.title = 'Meu Portal - My Shape';

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Acompanhe sua dieta, progresso e conquistas com seu nutricionista.');
    }

    // Restaurar ao sair da página
    return () => {
      if (originalManifest && originalHref) {
        originalManifest.setAttribute('href', originalHref);
      }
      document.title = 'My Shape - Controle da sua Empresa';
    };
  }, []);

  // Auto-download quando parâmetro autoDownload está presente
  useEffect(() => {
    if (!loading && patient && portalRef.current) {
      const urlParams = new URLSearchParams(window.location.search);
      const autoDownloadFormat = urlParams.get('autoDownload'); // 'png', 'pdf', ou 'jpeg'

      if (autoDownloadFormat) {
        console.log(`🎯 Auto-download ${autoDownloadFormat.toUpperCase()} detectado! Iniciando captura...`);

        // Aguardar renderização completa dos gráficos
        setTimeout(async () => {
          console.log(`📸 Capturando portal como ${autoDownloadFormat.toUpperCase()}...`);

          if (autoDownloadFormat === 'png' || autoDownloadFormat === 'jpeg') {
            await handleExportEvolutionImage();
          } else if (autoDownloadFormat === 'pdf') {
            await handleExportEvolutionPDF();
          }

          console.log('✅ Download iniciado! Fechando aba em 3 segundos...');

          // Fechar aba automaticamente após download
          setTimeout(() => {
            window.close();
          }, 3000);
        }, 3000); // Aumentar tempo para garantir que gráficos carregaram
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

      // MODO TESTE: Usar telefone fixo para demonstração
      let telefone;

      if (token === 'teste123') {
        telefone = '11999999999'; // Telefone de teste
      } else {
        // Validar token real
        telefone = await validateToken(token);

        if (!telefone) {
          // Token inválido ou expirado - limpar localStorage e redirecionar para login
          localStorage.removeItem('portal_access_token');
          setUnauthorized(true);
          setLoading(false);
          toast({
            title: 'Sessão expirada',
            description: 'Por favor, faça login novamente com seu telefone',
            variant: 'destructive'
          });
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            navigate('/portal', { replace: true });
          }, 2000);
          return;
        }
      }

      // ✅ OTIMIZAÇÃO BÁSICA: Adicionar limite em body_composition
      // Buscar todos os dados em paralelo para melhor performance
      const [checkinsData, patientResult, bioResult] = await Promise.all([
        checkinService.getByPhone(telefone),
        supabase
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .maybeSingle(),
        (async () => {
          let bioQuery = (supabase as any)
            .from('body_composition')
            .select('*')
            .eq('telefone', telefone)
            .order('data_avaliacao', { ascending: false });

          // Aplicar limite apenas se fornecido
          if (bioLimit !== null && bioLimit !== undefined) {
            bioQuery = bioQuery.limit(bioLimit);
          }

          return await bioQuery;
        })()
      ]);

      if (checkinsData.length === 0) {
        toast({
          title: 'Nenhum check-in encontrado',
          description: 'Este paciente ainda não possui check-ins registrados',
          variant: 'destructive'
        });
      }

      setCheckins(checkinsData);

      // Tratar erro 406 (RLS) graciosamente
      if (patientResult.error) {
        if ((patientResult.error as any).status === 406 || (patientResult.error as any).code === 'PGRST200') {
          console.warn('⚠️ Acesso negado ao paciente (RLS). Verifique as políticas RLS.');
        } else {
          console.error('Erro ao buscar paciente:', patientResult.error);
        }
      } else if (patientResult.data) {
        setPatient(patientResult.data);

        // Salvar patient_id para usar nos componentes de dieta
        if (patientResult.data.id) {
          setPatientId(patientResult.data.id);
        }
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

  /** Reseta o portal de verdade: remove Antes/Depois, reverte "Sua Evolução" para o texto automático e recarrega tudo */
  async function handleResetPortal() {
    if (!patient?.telefone) return;
    setLoading(true);
    try {
      // 1) Reverter "Sua Evolução" para o conteúdo automático (limpa o que foi editado)
      await (supabase as any)
        .from('renewal_custom_content')
        .update({ summary_content: null })
        .eq('patient_telefone', patient.telefone);

      // 2) Remover a comparação Antes/Depois (foto destacada)
      if (comparison) {
        await deleteComparison();
      }

      // 3) Recarregar dados e forçar remount para exibir o estado “primeira vez”
      await loadPortalData();
      await refetch();
      setPortalKey((k) => k + 1);
      setChartsRefreshTrigger((t) => t + 1);
      toast({
        title: 'Portal resetado',
        description: 'Antes/Depois removido, "Sua Evolução" voltou ao texto automático e os dados foram recarregados.',
      });
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Não foi possível resetar o portal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Função simples para aguardar carregamento
  const waitForChartsToLoad = async () => {
    console.log('🔍 Aguardando carregamento...');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('✅ Tempo de espera concluído');
        resolve();
      }, 1000);
    });
  };

  async function handleExportEvolutionImage() {
    console.log('🎯 Função handleExportEvolutionImage chamada');

    if (!patient) {
      console.error('❌ Paciente não encontrado');
      toast({
        title: 'Erro',
        description: 'Dados do paciente não carregados',
        variant: 'destructive'
      });
      return;
    }

    if (!portalRef.current) {
      console.error('❌ Referência do portal não encontrada');
      toast({
        title: 'Erro',
        description: 'Elemento do portal não encontrado',
        variant: 'destructive'
      });
      return;
    }

    try {
      setExporting(true);
      console.log('🚀 Iniciando captura de imagem...');
      console.log('👤 Paciente:', patient.nome);
      console.log('📱 Portal ref:', portalRef.current);

      toast({
        title: 'Gerando imagem...',
        description: 'Aguarde enquanto criamos seu relatório'
      });

      // Aguardar carregamento
      console.log('⏳ Aguardando 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('📸 Iniciando html2canvas...');
      console.log('📏 Dimensões do elemento:', {
        width: portalRef.current.offsetWidth,
        height: portalRef.current.offsetHeight,
        scrollWidth: portalRef.current.scrollWidth,
        scrollHeight: portalRef.current.scrollHeight
      });

      // Verificar todos os canvas antes de capturar
      const allCanvas = portalRef.current.querySelectorAll('canvas');
      console.log(`🔍 Encontrados ${allCanvas.length} canvas na página:`);
      allCanvas.forEach((canvas, index) => {
        const c = canvas as HTMLCanvasElement;
        console.log(`Canvas ${index}: ${c.width}x${c.height} (${c.className || 'sem classe'})`);
        if (c.width === 0 || c.height === 0) {
          console.log(`⚠️ Canvas ${index} tem dimensões inválidas e será ignorado`);
        }
      });

      let dataURL;

      try {
        // Tentar com dom-to-image com máxima qualidade
        console.log('🎯 Tentativa 1: dom-to-image alta qualidade...');
        dataURL = await domtoimage.toPng(portalRef.current, {
          quality: 1.0, // Máxima qualidade
          bgcolor: '#0f172a',
          width: portalRef.current.offsetWidth * 2, // Dobrar resolução
          height: portalRef.current.offsetHeight * 2,
          style: {
            transform: 'scale(2)', // Escalar para alta resolução
            transformOrigin: 'top left'
          },
          filter: (element) => {
            // Apenas ocultar botões interativos
            return !element.classList.contains('hide-in-pdf');
          }
        });
        console.log('✅ dom-to-image funcionou!');
      } catch (error1) {
        console.log('❌ dom-to-image falhou, tentando html2canvas...');
        console.log('🎯 Tentativa 2: html2canvas básico...');

        try {
          // Tentar html2canvas com alta qualidade
          const canvas = await html2canvas(portalRef.current, {
            scale: 2, // Alta resolução
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#0f172a',
            width: portalRef.current.offsetWidth,
            height: portalRef.current.offsetHeight,
            ignoreElements: (element) => {
              // Apenas ocultar botões interativos
              return element.classList.contains('hide-in-pdf');
            }
          });
          dataURL = canvas.toDataURL('image/png', 1.0); // Máxima qualidade
          console.log('✅ html2canvas funcionou como fallback!');
        } catch (error2) {
          console.log('❌ html2canvas também falhou, tentando captura simples...');
          console.log('🎯 Tentativa 3: captura sem elementos complexos...');

          // Última tentativa: usar API nativa de screenshot se disponível
          if ('getDisplayMedia' in navigator.mediaDevices) {
            console.log('🎯 Tentando API nativa de screenshot...');
            // Implementar captura nativa aqui se necessário
          }

          // Fallback: html2canvas com configuração básica mas boa qualidade
          const canvas = await html2canvas(portalRef.current, {
            scale: 1.5, // Boa qualidade
            logging: false,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#0f172a',
            ignoreElements: (element) => {
              // Ignorar apenas elementos realmente problemáticos
              return element.classList.contains('hide-in-pdf') ||
                (element.tagName === 'CANVAS' && (element as HTMLCanvasElement).width === 0);
            }
          });
          dataURL = canvas.toDataURL('image/png', 1.0); // Máxima qualidade
          console.log('✅ Captura básica funcionou!');
        }
      }

      if (!dataURL || dataURL === 'data:,' || dataURL.length < 100) {
        throw new Error('Falha ao gerar imagem válida');
      }

      console.log('✅ Imagem gerada com sucesso!');
      console.log('📏 Tamanho da imagem:', Math.round(dataURL.length / 1024), 'KB');

      console.log('💾 Iniciando download...');
      const link = document.createElement('a');
      link.download = `evolucao-${patient.nome?.replace(/\s+/g, '-') || 'paciente'}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('✅ Download iniciado com sucesso!');

      toast({
        title: 'Imagem gerada! 🎉',
        description: 'Seu relatório foi baixado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro detalhado:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');

      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('❌ Mensagem do erro:', error.message);
      }

      toast({
        title: 'Erro ao gerar imagem',
        description: `Detalhes: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      console.log('🏁 Finalizando função...');
      setExporting(false);
    }
  }

  async function handleExportEvolutionPDF() {
    if (!patient || !portalRef.current) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF...',
        description: 'Aguarde enquanto criamos seu relatório'
      });

      // Aguardar que todos os gráficos carreguem
      await waitForChartsToLoad();

      // Importar jsPDF dinamicamente
      const { jsPDF } = await import('jspdf');

      // Ocultar apenas botões interativos
      const elementsToHide = portalRef.current.querySelectorAll('.hide-in-pdf');
      const originalDisplay: string[] = [];

      elementsToHide.forEach((el, index) => {
        originalDisplay[index] = (el as HTMLElement).style.display;
        (el as HTMLElement).style.display = 'none';
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(portalRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: true,
        backgroundColor: '#0f172a',
        width: portalRef.current.scrollWidth,
        height: portalRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.classList.contains('hide-in-pdf');
        }
      });

      elementsToHide.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplay[index];
      });

      // Converter para PDF
      const imgData = canvas.toDataURL('image/png', 0.9);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdfWidth = 210; // A4 width in mm
      const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      pdf.save(`evolucao-${patient.nome?.replace(/\s+/g, '-') || 'paciente'}-${new Date().toISOString().split('T')[0]}.pdf`);

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

  async function handleExportDietPremiumPDF() {
    if (!patient || !patientId) return;

    try {
      setExporting(true);
      toast({
        title: 'Gerando PDF Premium...',
        description: 'Aguarde enquanto criamos seu plano alimentar premium'
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

      // Usar o NOVO gerador premium de PDF
      await DietPremiumPDFGenerator.generatePremiumPDF(
        planDetails as any,
        patient,
        {
          theme: 'dark',
          showMacrosPerMeal: true
        }
      );

      setExporting(false);
      toast({
        title: 'PDF Premium gerado! 🎉',
        description: 'Seu plano alimentar premium foi baixado com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF Premium:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível gerar o PDF Premium',
        variant: 'destructive'
      });
      setExporting(false);
    }
  }

  // Função para exportar evolução diretamente
  function handleExportEvolution(format: 'png' | 'pdf') {
    setEvolutionExportMode(format);
    setShowEvolutionExport(true);
  }

  // Callback quando a exportação direta é concluída
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
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (unauthorized) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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

        {/* Conteúdo com z-index - key força remount ao resetar portal */}
        <div className="relative z-10" key={portalKey}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Header do Portal - ITEM 9: Dropdown Limpo */}
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
              <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto hide-in-pdf">
                {/* Botão Compartilhar - Leva para o portal público */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (patient?.telefone) {
                      const publicUrl = `${window.location.origin}/public/portal/${patient.telefone}`;
                      window.open(publicUrl, '_blank');
                    }
                  }}
                  className="border-slate-600 hover:bg-slate-800 text-white min-h-[44px] px-4"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>

                {/* Menu de ações: Apenas Evolução e Atualizar - ITEM 9 */}
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
                    {/* Opções de Evolução */}
                    {patient && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setShowEvolutionExport(true)}
                          className="text-white hover:bg-blue-700/50 cursor-pointer py-3"
                        >
                          <Eye className="w-4 h-4 mr-2 text-blue-400" />
                          Visualizar Evolução
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportEvolution('png')}
                          className="text-white hover:bg-green-700/50 cursor-pointer py-3"
                        >
                          <FileImage className="w-4 h-4 mr-2 text-green-400" />
                          Baixar Evolução PNG
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExportEvolution('pdf')}
                          className="text-white hover:bg-purple-700/50 cursor-pointer py-3"
                        >
                          <FileText className="w-4 h-4 mr-2 text-purple-400" />
                          Baixar Evolução PDF
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuItem
                      onClick={loadPortalData}
                      className="text-white hover:bg-slate-700 cursor-pointer py-3"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar Dados
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleResetPortal}
                      className="text-white hover:bg-amber-700/50 cursor-pointer py-3"
                    >
                      <RefreshCw className="w-4 h-4 mr-2 text-amber-400" />
                      Resetar Portal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>

            {/* Card de Cabeçalho - Minha Evolução */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm border-slate-700/50 shadow-xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col gap-4">
                    {/* Título Principal */}
                    <div className="text-center">
                      <h1 className="text-3xl sm:text-4xl font-bold text-white">
                        Minha Evolução
                      </h1>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ITEM 2: Seção "Sua Evolução" - Texto Editável */}
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
                  isPublicAccess={false}
                  portalVisibility={{
                    visible: summaryEvolutionVisibility.visible,
                    onToggle: summaryEvolutionVisibility.toggleVisibility,
                    loading: summaryEvolutionVisibility.loading,
                  }}
                />
              </motion.div>
            )}


            {/* Controle de Limite de Bioimpedância - Se houver dados */}
            {bodyCompositions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="relative"
              >
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                  {/* Botão para controlar limite de bioimpedância - Apenas ícone */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBioLimitControl(!showBioLimitControl)}
                          className="gap-2 bg-slate-700/50 border-slate-600/50 hover:bg-slate-600/50 text-white h-9 w-9 p-0"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Limite: {bioLimit ? `${bioLimit} avaliações` : 'Sem limite'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Menu de controle de limite */}
                {showBioLimitControl && (
                  <Card className="bio-limit-control-menu absolute top-16 right-4 z-50 bg-slate-800 border-slate-600 shadow-lg min-w-[200px]">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-white mb-2">
                          Quantas avaliações carregar?
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant={bioLimit === 50 ? "default" : "outline"}
                            onClick={async () => {
                              setBioLimit(50);
                              setShowBioLimitControl(false);
                              await loadPortalData();
                            }}
                            className="w-full justify-start"
                          >
                            50 avaliações (padrão)
                          </Button>
                          <Button
                            size="sm"
                            variant={bioLimit === 100 ? "default" : "outline"}
                            onClick={async () => {
                              setBioLimit(100);
                              setShowBioLimitControl(false);
                              await loadPortalData();
                            }}
                            className="w-full justify-start"
                          >
                            100 avaliações
                          </Button>
                          <Button
                            size="sm"
                            variant={bioLimit === 200 ? "default" : "outline"}
                            onClick={async () => {
                              setBioLimit(200);
                              setShowBioLimitControl(false);
                              await loadPortalData();
                            }}
                            className="w-full justify-start"
                          >
                            200 avaliações
                          </Button>
                          <Button
                            size="sm"
                            variant={bioLimit === null ? "default" : "outline"}
                            onClick={async () => {
                              setBioLimit(null);
                              setShowBioLimitControl(false);
                              await loadPortalData();
                            }}
                            className="w-full justify-start text-orange-400 hover:text-orange-300"
                          >
                            Todas as avaliações (sem limite)
                          </Button>
                        </div>
                        <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                          <p>⚠️ Limites maiores aumentam o tempo de carregamento</p>
                          <p>💡 Use "Todas" apenas quando necessário</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* Comparação Destacada Antes/Depois */}
            {comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <FeaturedComparison
                  comparison={comparison}
                  isEditable={true}
                  onToggleVisibility={toggleVisibility}
                  onEdit={() => setShowEditComparisonModal(true)}
                  onDelete={async () => {
                    await deleteComparison();
                    refetch();
                  }}
                />
              </motion.div>
            )}

            {/* ITEM 3: Conteúdo de Evolução (sem abas) */}
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
                  refreshTrigger={chartsRefreshTrigger}
                  continueJourneyPortalVisibility={{
                    visible: continueJourneyVisibility.visible,
                    onToggle: continueJourneyVisibility.toggleVisibility,
                    loading: continueJourneyVisibility.loading,
                  }}
                />
              </motion.div>
            )}

            {/* Footer */}
            <div className="text-center text-xs sm:text-sm text-white py-4 sm:py-6 px-4">
              {getDailyMotivationalPhrase()}
            </div>
          </div>
        </div>

        {/* ITEM 7: Modal de Registro de Peso REMOVIDO */}

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

        {/* Modal de Criação/Edição de Comparação */}
        {showCreateComparisonModal && patient && (
          <CreateFeaturedComparisonModal
            open={showCreateComparisonModal}
            onOpenChange={setShowCreateComparisonModal}
            telefone={patient.telefone}
            checkins={checkins}
            patient={patient}
            onSuccess={refetch}
          />
        )}

        {/* Modal de Edição de Comparação Existente */}
        {showEditComparisonModal && comparison && patient && (
          <EditFeaturedComparisonModal
            open={showEditComparisonModal}
            onClose={() => setShowEditComparisonModal(false)}
            beforePhoto={{
              url: comparison.before_photo_url,
              date: new Date(comparison.before_photo_date).toLocaleDateString('pt-BR'),
              weight: comparison.before_weight?.toString() || ''
            }}
            afterPhoto={{
              url: comparison.after_photo_url,
              date: new Date(comparison.after_photo_date).toLocaleDateString('pt-BR'),
              weight: comparison.after_weight?.toString() || ''
            }}
            initialTitle={comparison.title}
            initialDescription={comparison.description || ''}
            initialBeforeZoom={comparison.before_zoom || 1}
            initialBeforeX={comparison.before_position_x || 0}
            initialBeforeY={comparison.before_position_y || 0}
            initialAfterZoom={comparison.after_zoom || 1}
            initialAfterX={comparison.after_position_x || 0}
            initialAfterY={comparison.after_position_y || 0}
            onSave={async (data) => {
              await updateComparison({
                title: data.title,
                description: data.description,
                before_zoom: data.beforeZoom,
                before_position_x: data.beforeX,
                before_position_y: data.beforeY,
                after_zoom: data.afterZoom,
                after_position_x: data.afterX,
                after_position_y: data.afterY,
              });
              await refetch();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

