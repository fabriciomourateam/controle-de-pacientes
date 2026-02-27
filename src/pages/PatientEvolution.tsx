import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { checkinService } from '@/lib/checkin-service';
import { patientService } from '@/lib/supabase-services';
import { supabase } from '@/integrations/supabase/client';
import { generateDossiePDF, generateDossieImage } from '@/lib/dossie-pdf-generator';
import { EvolutionCharts } from '@/components/evolution/EvolutionCharts';
import { PhotoComparison } from '@/components/evolution/PhotoComparison';
import { Timeline } from '@/components/evolution/Timeline';
import { AIInsights } from '@/components/evolution/AIInsights';
import { BioimpedanciaInput } from '@/components/evolution/BioimpedanciaInput';
import { BioimpedanciaList } from '@/components/evolution/BioimpedanciaList';
import { InitialDataInput } from '@/components/evolution/InitialDataInput';
import { CurrentDataInput } from '@/components/evolution/CurrentDataInput';
import { AddEvolutionData } from '@/components/evolution/AddEvolutionData';
import { InitialCurrentPhotoComparison } from '@/components/evolution/InitialCurrentPhotoComparison';
import { BodyFatChart } from '@/components/evolution/BodyFatChart';
import { BodyCompositionMetrics } from '@/components/evolution/BodyCompositionMetrics';
import { AchievementBadges } from '@/components/evolution/AchievementBadges';
import { TrendsAnalysis } from '@/components/evolution/TrendsAnalysis';
import { ShareButton } from '@/components/evolution/ShareButton';
import { GoogleDriveImage } from '@/components/ui/google-drive-image';
import { isGoogleDriveUrl } from '@/lib/google-drive-utils';
import { CertificateButton } from '@/components/evolution/CertificateButton';
import { EvolutionExportPage } from '@/components/evolution/EvolutionExportPage';
import { ProtocolNotesHistory } from '@/components/checkins/ProtocolNotesHistory';
import { PatientForm } from '@/components/forms/PatientForm';
import html2canvas from 'html2canvas';
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
  Eye,
  EyeOff,
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
  ChevronDown,
  Scale,
  FlaskConical,
  BarChart3,
  Phone,
  Edit,
  Link2,
  Copy
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const [chartsRefreshTrigger, setChartsRefreshTrigger] = useState(0);
  const [deletePhotoConfirm, setDeletePhotoConfirm] = useState<{ field: string; label: string } | null>(null);
  const [showEvolutionExport, setShowEvolutionExport] = useState(false);
  const [evolutionExportMode, setEvolutionExportMode] = useState<'png' | 'pdf' | null>(null);
  const [showPhotoComparison, setShowPhotoComparison] = useState(false);
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [addEvolutionDataOpen, setAddEvolutionDataOpen] = useState(false);

  // Estados para controlar visibilidade dos cards opcionais
  const [showAchievements, setShowAchievements] = useState(false);

  // Estado para controlar o limite de bioimpedâncias carregadas
  const [bioLimit, setBioLimit] = useState<number | null>(50); // Padrão: 50 avaliações
  const [showBioLimitControl, setShowBioLimitControl] = useState(false);

  // Calcular dados para as novas features
  const achievements = checkins.length > 0 ? detectAchievements(checkins, bodyCompositions) : [];
  const trends = checkins.length >= 3 ? analyzeTrends(checkins) : [];

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

  // Função para mapear Patient (Supabase) para PatientFormData
  const mapPatientToFormData = (patient: Patient | null) => {
    if (!patient) return undefined;

    return {
      id: patient.id,
      nome: patient.nome || "",
      apelido: patient.apelido || "",
      cpf: patient.cpf || "",
      email: patient.email || "",
      telefone: patient.telefone || "",
      telefone_filtro: (patient as any).telefone_filtro || "",
      genero: patient.genero as "Masculino" | "Feminino" | "Outro" | undefined,
      data_nascimento: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
      plano: patient.plano || "",
      tempo_acompanhamento: patient.tempo_acompanhamento || 3,
      vencimento: (patient as any).vencimento ? new Date((patient as any).vencimento) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      valor: (patient as any).valor || undefined,
      observacao: (patient as any).observacao || "",
      objetivo: (patient as any).objetivo || "",
      peso: (patient as any).peso || undefined,
      medida: (patient as any).medida || undefined,
    };
  };

  // Função para editar paciente
  const handleEditPatient = () => {
    setIsPatientFormOpen(true);
  };

  // Função para abrir zoom da foto
  const handleZoomPhoto = (url: string, label: string) => {
    setZoomedPhoto({ url, label });
    setIsZoomOpen(true);
  };

  // Função para baixar foto do Google Drive
  const handleDownloadPhoto = async (url: string, label: string) => {
    try {
      // Extrair ID do Google Drive
      const getFileId = (driveUrl: string): string | null => {
        const patterns = [
          /open\?id=([^&]+)/,
          /\/file\/d\/([^/]+)/,
          /uc\?.*id=([^&]+)/,
          /\/d\/([^/]+)/
        ];
        for (const pattern of patterns) {
          const match = driveUrl.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const fileId = getFileId(url);

      if (fileId && url.includes('drive.google.com')) {
        // Para Google Drive, usar fetch para baixar como blob
        try {
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

          toast({
            title: 'Iniciando download...',
            description: `Baixando ${label}...`
          });

          // Tentar fetch direto primeiro
          const response = await fetch(downloadUrl, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpar blob URL
            window.URL.revokeObjectURL(blobUrl);

            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch falhou');
          }
        } catch (fetchError) {
          // Fallback: tentar converter URL para formato direto
          const directUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;

          try {
            const response = await fetch(directUrl);
            if (response.ok) {
              const blob = await response.blob();
              const blobUrl = window.URL.createObjectURL(blob);

              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              window.URL.revokeObjectURL(blobUrl);

              toast({
                title: 'Download concluído!',
                description: `${label} foi baixado com sucesso.`
              });
            } else {
              throw new Error('Thumbnail fetch falhou');
            }
          } catch (thumbnailError) {
            // Último recurso: abrir em nova aba
            const fallbackUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            window.open(fallbackUrl, '_blank');

            toast({
              title: 'Download iniciado',
              description: `${label} será aberto em nova aba para download manual.`
            });
          }
        }
      } else {
        // Para outras URLs, tentar download direto via fetch
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
          });

          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);

            toast({
              title: 'Download concluído!',
              description: `${label} foi baixado com sucesso.`
            });
          } else {
            throw new Error('Fetch direto falhou');
          }
        } catch (directError) {
          // Fallback para método tradicional
          const link = document.createElement('a');
          link.href = url;
          link.download = `${label.replace(/\s+/g, '-').toLowerCase()}.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast({
            title: 'Download iniciado',
            description: `Baixando ${label}...`
          });
        }
      }
    } catch (error) {
      console.error('Erro ao baixar foto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar a foto. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Função para abrir dialog de confirmação de exclusão
  const handleConfirmDeletePhoto = (photoField: string, label: string) => {
    setDeletePhotoConfirm({ field: photoField, label });
  };

  // Função para excluir foto individual (após confirmação)
  const handleDeletePhoto = async () => {
    if (!telefone || !patient || !deletePhotoConfirm) return;

    try {
      const { error } = await supabase
        .from('patients')
        .update({ [deletePhotoConfirm.field]: null })
        .eq('telefone', telefone);

      if (error) throw error;

      // Atualizar estado local
      setPatient({ ...patient, [deletePhotoConfirm.field]: null });
      setDeletePhotoConfirm(null);

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
    // Usar telefone do paciente (do banco) se disponível, senão usar da URL
    const telefoneToUse = patient?.telefone || telefone;

    if (!telefoneToUse) {
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

      // Limpar telefone antes de usar
      const cleanTelefone = telefoneToUse?.trim().replace(/\s+/g, '') || telefoneToUse;

      // Buscar check-ins do paciente
      const checkinsData = await checkinService.getByPhone(cleanTelefone);

      // Migrar dados atuais para check-in separado se necessário (antes de setCheckins)
      let needsRefetch = false;
      if (checkinsData.length > 0) {
        needsRefetch = await migrateCurrentDataToCheckin(cleanTelefone, checkinsData);
      }

      // ✅ Só buscar novamente se houve migração (otimização: evita query duplicada)
      let finalCheckinsData = checkinsData;
      if (needsRefetch) {
        finalCheckinsData = await checkinService.getByPhone(cleanTelefone);
        setCheckins(finalCheckinsData);
      } else {
        setCheckins(checkinsData);
      }

      // Verificar e migrar fotos do Typebot automaticamente
      if (finalCheckinsData.length > 0) {
        checkAndMigratePhotos(finalCheckinsData);
      }

      // Buscar dados do paciente
      // Usar o telefone limpo que já foi calculado acima
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', cleanTelefone)
        .maybeSingle();

      if (error) {
        // Erro 406 geralmente indica problema de RLS - não é crítico, apenas logar
        if ((error as any).status === 406 || (error as any).code === 'PGRST200') {
          console.warn('Acesso negado ao paciente (RLS). Execute o SQL fix-patients-rls-final.sql no Supabase.');
        } else {
          console.error('Erro ao buscar paciente:', error);
        }
        // Não definir patient como null para não quebrar a página
        // Os check-ins já foram carregados, então a página pode funcionar sem dados do paciente
      } else if (patientData) {
        setPatient(patientData);
      } else {
        // Tentar buscar com TRIM no banco (caso ainda tenha espaços)
        const { data: altPatientData } = await supabase
          .from('patients')
          .select('*')
          .ilike('telefone', `%${cleanTelefone}%`)
          .limit(1)
          .maybeSingle();
        if (altPatientData) {
          setPatient(altPatientData);
        }
      }

      // ✅ OTIMIZAÇÃO BÁSICA: Adicionar limite para reduzir egress
      // Buscar bioimpedâncias (mantém select('*') para compatibilidade total)
      try {
        let bioQuery = supabase
          .from('body_composition')
          .select('*')
          .eq('telefone', cleanTelefone)
          .order('data_avaliacao', { ascending: false });

        // Aplicar limite apenas se fornecido
        if (bioLimit !== null && bioLimit !== undefined) {
          bioQuery = bioQuery.limit(bioLimit);
        }

        const { data: bioData, error: bioError } = await bioQuery;

        if (bioError) {
          // Erro 406 geralmente indica problema de RLS - não é crítico
          if ((bioError as any).status === 406 || (bioError as any).code === 'PGRST200') {
            console.warn('⚠️ Acesso negado a body_composition (RLS). Verifique as políticas RLS.');
          } else {
            console.error('Erro ao buscar body_composition:', bioError);
          }
          // Continuar sem dados de bioimpedância
        } else if (bioData) {
          setBodyCompositions(bioData);
        }
      } catch (bioErr) {
        // Ignorar erros de body_composition - não é crítico para a página funcionar
        console.warn('Erro ao buscar body_composition:', bioErr);
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
    loadEvolution();
  }, [telefone]); // Apenas telefone como dependência

  // Função de exportação (declarada antes do useEffect que a usa)
  const handleExport = useCallback(async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!patient) return;

    // Usar o mesmo componente de exportação do portal
    setEvolutionExportMode(format === 'jpeg' ? 'png' : format);
    setShowEvolutionExport(true);
  }, [patient]);

  // Auto-export: Detectar parâmetros da URL e baixar automaticamente
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const autoExport = searchParams.get('autoExport');
    const autoClose = searchParams.get('autoClose');

    if (autoExport && !loading && patient) {
      // Aguardar um pouco para garantir que a página carregou completamente
      const timer = setTimeout(() => {
        console.log('🚀 Auto-export ativado:', autoExport);
        handleExport(autoExport as 'pdf' | 'png' | 'jpeg');

        // Se autoClose estiver ativo, fechar a aba após o download
        if (autoClose === 'true') {
          setTimeout(() => {
            console.log('🔒 Fechando aba automaticamente');
            window.close();
          }, 5000); // Fechar após 5 segundos para dar tempo do download completar
        }
      }, 2000); // Aguardar 2 segundos antes de iniciar o download para garantir que tudo carregou

      return () => clearTimeout(timer);
    }
  }, [loading, patient, handleExport]); // Executar quando loading terminar e patient estiver disponível

  // Ref para evitar múltiplas execuções do download
  const isExportingRef = useRef(false);

  // Callback quando a exportação direta é concluída
  const handleDirectEvolutionExport = async (exportRef: HTMLDivElement, format: 'png' | 'pdf') => {
    // Prevenir execução múltipla
    if (isExportingRef.current) {
      return;
    }

    try {
      isExportingRef.current = true;
      setGeneratingPDF(true);
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
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: 'PNG gerado! 🎉', description: 'Evolução exportada com sucesso' });
      } else {
        const { jsPDF } = await import('jspdf');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = 210;
        const imgHeightMM = (canvas.height * pdfWidth) / canvas.width;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, imgHeightMM] });
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM);
        pdf.save(`evolucao-${patient?.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
        toast({ title: 'PDF gerado! 📄', description: 'Relatório baixado com sucesso' });
      }
      setShowEvolutionExport(false);
      setEvolutionExportMode(null);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({ title: 'Erro', description: 'Não foi possível gerar o arquivo', variant: 'destructive' });
    } finally {
      setGeneratingPDF(false);
      // Resetar flag após um pequeno delay para permitir que o download seja processado
      setTimeout(() => {
        isExportingRef.current = false;
      }, 1000);
    }
  };

  const handleBioSuccess = async () => {
    // ✅ OTIMIZAÇÃO BÁSICA: Adicionar limite ao recarregar
    // Recarregar bioimpedâncias após adicionar nova
    if (!telefone) return;

    let bioQuery = supabase
      .from('body_composition')
      .select('*')
      .eq('telefone', telefone)
      .order('data_avaliacao', { ascending: false });

    // Aplicar limite apenas se fornecido
    if (bioLimit !== null && bioLimit !== undefined) {
      bioQuery = bioQuery.limit(bioLimit);
    }

    const { data } = await bioQuery;

    if (data) {
      setBodyCompositions(data);
    }
  };

  const handleInitialDataSuccess = async () => {
    // Recarregar dados do paciente após adicionar dados iniciais
    // Usar o telefone do paciente (do banco) em vez do telefone da URL
    const telefoneToUse = patient?.telefone || telefone;
    if (!telefoneToUse) return;

    // Limpar telefone antes de buscar
    const cleanTelefone = telefoneToUse?.trim().replace(/\s+/g, '') || telefoneToUse;

    try {
      // Aguardar um pouco para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 800));

      // Recarregar paciente diretamente primeiro
      const { data: updatedPatient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', cleanTelefone)
        .maybeSingle();

      if (patientError) {
        console.error('Erro ao buscar paciente atualizado:', patientError);
      } else if (updatedPatient) {
        setPatient(updatedPatient);
      }

      // Depois recarregar tudo com loadEvolution()
      await loadEvolution();

      toast({
        title: 'Dados atualizados',
        description: 'Os dados iniciais foram salvos e carregados com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao recarregar evolução:', error);
      toast({
        title: 'Aviso',
        description: 'Dados salvos, mas houve problema ao recarregar. Recarregue a página manualmente.',
        variant: 'default'
      });
    }
  };

  const handleCurrentDataSuccess = async () => {
    // Recarregar dados do paciente após adicionar dados atuais
    // Usar o telefone do paciente (do banco) em vez do telefone da URL
    const telefoneToUse = patient?.telefone || telefone;
    if (!telefoneToUse) return;

    // Limpar telefone antes de buscar
    const cleanTelefone = telefoneToUse?.trim().replace(/\s+/g, '') || telefoneToUse;

    const { data: patientData, error } = await supabase
      .from('patients')
      .select('*')
      .eq('telefone', cleanTelefone)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar paciente atualizado:', error);
    } else if (patientData) {
      setPatient(patientData);
    }

    // Recarregar tudo
    await loadEvolution();

    toast({
      title: 'Dados atualizados',
      description: 'Os dados atuais foram salvos e carregados com sucesso'
    });
  };

  // Migrar dados atuais para um check-in separado
  // Retorna true se houve migração, false caso contrário
  const migrateCurrentDataToCheckin = async (telefone: string, checkins: Checkin[]): Promise<boolean> => {
    try {
      // Buscar dados do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();

      if (!patientData) return false;

      const patient = patientData as any;

      // Verificar se há dados atuais para migrar
      const hasCurrentData =
        patient.foto_atual_frente ||
        patient.foto_atual_lado ||
        patient.foto_atual_lado_2 ||
        patient.foto_atual_costas ||
        patient.peso_atual;

      if (!hasCurrentData) return false;

      // Verificar se já existe um check-in com a data dos dados atuais
      const dataFotosAtuais = patient.data_fotos_atuais;
      if (!dataFotosAtuais) return false;

      // Verificar se já existe um check-in nessa data exata
      const existingCheckinWithDate = checkins.find(
        c => c.data_checkin === dataFotosAtuais
      );

      let migrationHappened = false;

      // Se já existe um check-in nessa data E já tem fotos, apenas limpar dados atuais
      if (existingCheckinWithDate) {
        const hasPhotos = existingCheckinWithDate.foto_1 || existingCheckinWithDate.foto_2 ||
          existingCheckinWithDate.foto_3 || existingCheckinWithDate.foto_4;
        if (hasPhotos) {
          // Já foi migrado ou já tem fotos, limpar dados atuais
          await supabase
            .from('patients')
            .update({
              foto_atual_frente: null,
              foto_atual_lado: null,
              foto_atual_lado_2: null,
              foto_atual_costas: null,
              peso_atual: null,
              altura_atual: null,
              medida_cintura_atual: null,
              medida_quadril_atual: null,
              data_fotos_atuais: null
            } as any)
            .eq('telefone', telefone);
          return false; // Não houve migração, apenas limpeza
        }
        // Se existe check-in mas não tem fotos, adicionar as fotos
        await checkinService.update(existingCheckinWithDate.id, {
          foto_1: patient.foto_atual_frente || null,
          foto_2: patient.foto_atual_lado || null,
          foto_3: patient.foto_atual_lado_2 || null,
          foto_4: patient.foto_atual_costas || null,
          peso: patient.peso_atual || existingCheckinWithDate.peso || null
        });
        migrationHappened = true;
      } else {
        // Criar novo check-in com os dados atuais usando a data original
        const checkinData: any = {
          telefone,
          data_checkin: dataFotosAtuais,
          foto_1: patient.foto_atual_frente || null,
          foto_2: patient.foto_atual_lado || null,
          foto_3: patient.foto_atual_lado_2 || null,
          foto_4: patient.foto_atual_costas || null,
          peso: patient.peso_atual || null
        };
        await checkinService.create(checkinData);
        migrationHappened = true;
      }

      // Limpar dados atuais do paciente após migração
      await supabase
        .from('patients')
        .update({
          foto_atual_frente: null,
          foto_atual_lado: null,
          foto_atual_lado_2: null,
          foto_atual_costas: null,
          peso_atual: null,
          altura_atual: null,
          medida_cintura_atual: null,
          medida_quadril_atual: null,
          data_fotos_atuais: null
        } as any)
        .eq('telefone', telefone);

      // Migração silenciosa
      return migrationHappened;
    } catch (error) {
      console.error('Erro ao migrar dados atuais:', error);
      // Não mostrar erro ao usuário, é uma migração silenciosa
      return false;
    }
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
              size="icon"
              onClick={() => navigate('/checkins')}
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
            {/* Botão de Plano Alimentar destacado */}
            {patient?.id && (
              <Button
                onClick={() => navigate(`/patients/${patient.id}?tab=diets`)}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all font-medium border-none"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Plano Alimentar
              </Button>
            )}

            {/* Menu agrupado para ações rápidas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
                  <Activity className="w-4 h-4 mr-2" />
                  Ações Rápidas
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      // Importar dinamicamente o serviço
                      const { getOrCreatePatientToken, getPortalUrl } = await import('@/lib/patient-portal-service');

                      // Gerar ou recuperar token
                      const result = await getOrCreatePatientToken(patient?.telefone || telefone!);

                      if (result) {
                        const portalUrl = getPortalUrl(result.token);
                        window.open(portalUrl, '_blank');
                      } else {
                        toast({
                          title: "Erro",
                          description: "Não foi possível gerar o link do portal",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error('Erro ao abrir portal:', error);
                      toast({
                        title: "Erro",
                        description: "Não foi possível abrir o portal",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="text-white hover:bg-slate-700 cursor-pointer"
                >
                  <Link2 className="w-4 h-4 mr-2 text-blue-400" />
                  Portal de Renovação
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const evolutionUrl = `${window.location.origin}/evolucao-aluno/${encodeURIComponent(patient?.telefone || telefone!)}`;
                    window.open(evolutionUrl, '_blank');
                  }}
                  className="text-white hover:bg-slate-700 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 mr-2 text-teal-400" />
                  Evolução do Aluno
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/public/portal/${telefone}`;
                    window.open(shareUrl, '_blank');
                  }}
                  className="text-white hover:bg-slate-700 cursor-pointer"
                >
                  <Link2 className="w-4 h-4 mr-2 text-emerald-400" />
                  Compartilhar Evolução
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEvolutionExportMode('png');
                    setShowEvolutionExport(true);
                  }}
                  disabled={generatingPDF}
                  className="text-white hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Image className="w-4 h-4 mr-2 text-green-400" />
                  {generatingPDF ? 'Gerando...' : 'Baixar Evolução (PNG)'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEvolutionExportMode('pdf');
                    setShowEvolutionExport(true);
                  }}
                  disabled={generatingPDF}
                  className="text-white hover:bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileDown className="w-4 h-4 mr-2 text-purple-400" />
                  {generatingPDF ? 'Gerando...' : 'Baixar Evolução (PDF)'}
                </DropdownMenuItem>

                {/* Seções ocultas - mostrar apenas se houver alguma oculta */}
                {(achievements.length > 0 && !showAchievements) && (
                  <>
                    <DropdownMenuSeparator />
                    {achievements.length > 0 && !showAchievements && (
                      <DropdownMenuItem
                        onClick={() => setShowAchievements(true)}
                        className="text-white hover:bg-slate-700 cursor-pointer"
                      >
                        <Activity className="w-4 h-4 mr-2 text-amber-400" />
                        Mostrar Conquistas
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
              telefone={patient?.telefone || telefone!}
              nome={patient?.nome || 'Paciente'}
              idade={(patient as any)?.idade || (patient?.data_nascimento ? calcularIdade(patient.data_nascimento) : null)}
              altura={(patient as any)?.altura_inicial || null}
              pesoInicial={(patient as any)?.peso_inicial || null}
              sexo={patient?.genero || null}
              onSuccess={handleBioSuccess}
            />

            {patient?.telefone && patient?.nome && (
              <AddEvolutionData
                telefone={patient.telefone}
                nome={patient.nome}
                open={addEvolutionDataOpen}
                onOpenChange={setAddEvolutionDataOpen}
                showButton={true}
                onSuccess={() => {
                  setAddEvolutionDataOpen(false);
                  loadEvolution();
                }}
              />
            )}

            {/* Botão Editar Paciente isolado, movido para cá */}
            <Button
              onClick={handleEditPatient}
              variant="outline"
              size="icon"
              className="bg-blue-900/40 border-blue-700/50 text-blue-300 hover:text-white hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-500/40"
              title="Editar Paciente"
            >
              <Edit className="w-4 h-4" />
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
                {/* Linha com apelido e telefone logo abaixo do nome */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm">{patient?.apelido || 'Apelido não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span className="text-sm">{patient?.telefone || telefone || 'Telefone não informado'}</span>
                  </div>
                </div>
                {/* Linha com check-ins count */}
                <div className="flex items-center gap-2 text-slate-300">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm">{checkins.length} check-ins realizados</span>
                </div>
                {/* Linha com período de acompanhamento (inicio_acompanhamento - vencimento) */}
                {(patient?.inicio_acompanhamento || (patient as any)?.vencimento) && (
                  <div className="flex items-center gap-2 text-slate-300 mt-2">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">
                      {patient?.inicio_acompanhamento
                        ? new Date(patient.inicio_acompanhamento).toLocaleDateString('pt-BR')
                        : 'Início não informado'
                      } - {(patient as any)?.vencimento
                        ? new Date((patient as any).vencimento).toLocaleDateString('pt-BR')
                        : 'Vencimento não informado'
                      }
                    </span>
                  </div>
                )}
                {(patient as any)?.objetivo && (
                  <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Objetivo Principal:
                    </p>
                    <p className="text-sm text-slate-200">{(patient as any).objetivo}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo - Movidos do EvolutionCharts */}
        {checkins.length > 0 && (
          <div className="grid grid-cols-6 gap-4">
            {/* Check-ins Realizados */}
            <Card className="bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-cyan-500/10 border-blue-500/30 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-200 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  Check-ins Realizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">{checkins.length}</div>
                <p className="text-xs text-blue-300/70 mt-1">Total de avaliações</p>
              </CardContent>
            </Card>

            {/* Idade */}
            {patient?.data_nascimento && (
              <Card className="bg-gradient-to-br from-cyan-600/20 via-cyan-500/15 to-teal-500/10 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-cyan-200 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                      <User className="w-4 h-4 text-cyan-400" />
                    </div>
                    Idade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">
                    {calcularIdade(patient.data_nascimento)}
                    <span className="text-lg ml-1">anos</span>
                  </div>
                  <p className="text-xs text-cyan-300/70 mt-1">Idade atual</p>
                </CardContent>
              </Card>
            )}

            {/* Altura */}
            {(patient as any)?.altura_inicial && (
              <Card className="bg-gradient-to-br from-purple-600/20 via-purple-500/15 to-violet-500/10 border-purple-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-purple-200 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                    </div>
                    Altura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent">
                    {(patient as any).altura_inicial}
                    <span className="text-lg ml-1">m</span>
                  </div>
                  <p className="text-xs text-purple-300/70 mt-1">Altura</p>
                </CardContent>
              </Card>
            )}

            {/* Peso Inicial */}
            {(() => {
              // Preparar dados de peso
              const weightData = [];
              if ((patient as any)?.peso_inicial) {
                const dataInicial = (patient as any).data_fotos_iniciais || patient?.created_at;
                weightData.push({
                  data: new Date(dataInicial).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                  peso: parseFloat((patient as any).peso_inicial.toString())
                });
              }
              checkins.slice().reverse().forEach((c) => {
                if (c.peso) {
                  weightData.push({
                    data: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }),
                    peso: parseFloat(c.peso.replace(',', '.'))
                  });
                }
              });

              return weightData.length > 0 ? (
                <Card className="bg-gradient-to-br from-green-600/20 via-green-500/15 to-emerald-500/10 border-green-500/30 hover:border-green-400/50 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300 relative group">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                          <Scale className="w-4 h-4 text-green-400" />
                        </div>
                        Peso Inicial
                      </div>
                      <InitialDataInput
                        telefone={patient?.telefone || telefone!}
                        nome={patient?.nome || 'Paciente'}
                        onSuccess={handleInitialDataSuccess}
                        editMode={true}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                      {weightData[0]?.peso?.toFixed(1) || 'N/A'}
                      {weightData[0]?.peso && <span className="text-lg ml-1">kg</span>}
                    </div>
                    <p className="text-xs text-green-300/70 mt-1">
                      {weightData[0]?.data}
                    </p>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Peso Atual */}
            {checkins[0]?.peso && (
              <Card className="bg-gradient-to-br from-indigo-600/20 via-indigo-500/15 to-blue-500/10 border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-indigo-200 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 group-hover:bg-indigo-500/30 transition-colors">
                      <Scale className="w-4 h-4 text-indigo-400" />
                    </div>
                    Peso Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold bg-gradient-to-r from-indigo-300 to-blue-300 bg-clip-text text-transparent">
                    {parseFloat(checkins[0].peso.replace(',', '.')).toFixed(1)}
                    <span className="text-lg ml-1">kg</span>
                  </div>
                  <p className="text-xs text-indigo-300/70 mt-1">
                    {new Date(checkins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                <Card className={`bg-gradient-to-br transition-all duration-300 group hover:shadow-lg ${isNeutral
                  ? 'from-slate-600/20 via-slate-500/15 to-gray-500/10 border-slate-500/30 hover:border-slate-400/50 hover:shadow-slate-500/20'
                  : isNegative
                    ? 'from-emerald-600/20 via-emerald-500/15 to-green-500/10 border-emerald-500/30 hover:border-emerald-400/50 hover:shadow-emerald-500/20'
                    : 'from-orange-600/20 via-orange-500/15 to-amber-500/10 border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/20'
                  }`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm flex items-center gap-2 ${isNeutral ? 'text-slate-200' : isNegative ? 'text-emerald-200' : 'text-orange-200'
                      }`}>
                      <div className={`p-1.5 rounded-lg transition-colors ${isNeutral
                        ? 'bg-slate-500/20 group-hover:bg-slate-500/30'
                        : isNegative
                          ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30'
                          : 'bg-orange-500/20 group-hover:bg-orange-500/30'
                        }`}>
                        <TrendingUp className={`w-4 h-4 ${isNeutral ? 'text-slate-400' : isNegative ? 'text-emerald-400' : 'text-orange-400'
                          }`} />
                      </div>
                      Variação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${isNeutral
                      ? 'from-slate-300 to-gray-300'
                      : isNegative
                        ? 'from-emerald-300 to-green-300'
                        : 'from-orange-300 to-amber-300'
                      }`}>
                      {parseFloat(weightChange) > 0 ? '+' : ''}{weightChange}
                      <span className="text-lg ml-1">kg</span>
                    </div>
                    <p className={`text-xs mt-1 ${isNeutral ? 'text-slate-300/70' : isNegative ? 'text-emerald-300/70' : 'text-orange-300/70'
                      }`}>
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
                  telefone={patient?.telefone || telefone!}
                  nome={patient?.nome || 'Paciente'}
                  onSuccess={handleInitialDataSuccess}
                />
                <CurrentDataInput
                  telefone={patient?.telefone || telefone!}
                  nome={patient?.nome || 'Paciente'}
                  onSuccess={handleCurrentDataSuccess}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aviso se houver poucos check-ins - Movido para o final */}

        {/* Dados Iniciais (quando não há check-ins mas há fotos/medidas cadastradas) */}
        {(() => {
          const hasInitialData = patient && (
            patient.foto_inicial_frente ||
            patient.foto_inicial_lado ||
            patient.foto_inicial_lado_2 ||
            patient.foto_inicial_costas ||
            patient.peso_inicial ||
            patient.altura_inicial ||
            patient.medida_cintura_inicial ||
            patient.medida_quadril_inicial
          );
          const shouldShow = checkins.length === 0 && hasInitialData;
          return shouldShow;
        })() && (
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm border-purple-700/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2 text-white">
                  <span className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-400" />
                    Dados Iniciais Cadastrados
                  </span>
                  {(patient.data_nascimento || patient.peso_inicial || patient.altura_inicial || patient.medida_cintura_inicial || patient.medida_quadril_inicial) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                          onClick={() => {
                            const lines: string[] = [];
                            if (patient.data_nascimento) lines.push(`Idade: ${calcularIdade(patient.data_nascimento)} anos`);
                            if (patient.peso_inicial) lines.push(`Peso Inicial: ${patient.peso_inicial} kg`);
                            if (patient.altura_inicial) lines.push(`Altura: ${patient.altura_inicial} m`);
                            if (patient.medida_cintura_inicial) lines.push(`Cintura: ${patient.medida_cintura_inicial} cm`);
                            if (patient.medida_quadril_inicial) lines.push(`Quadril: ${patient.medida_quadril_inicial} cm`);
                            const text = lines.join('\n');
                            if (text) {
                              navigator.clipboard.writeText(text);
                              toast({ title: 'Copiado!', description: 'Dados iniciais copiados para a área de transferência.' });
                            }
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Copiar dados iniciais</TooltipContent>
                    </Tooltip>
                  )}
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
                          <div className="relative group" style={{ height: '384px' }}>
                            {isGoogleDriveUrl(patient.foto_inicial_frente) ? (
                              <GoogleDriveImage
                                src={patient.foto_inicial_frente}
                                alt="Foto Frontal Inicial"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_frente!, 'Foto Frontal')}
                              />
                            ) : (
                              <img
                                src={convertGoogleDriveUrl(patient.foto_inicial_frente) || patient.foto_inicial_frente}
                                alt="Foto Frontal Inicial"
                                loading="lazy"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_frente) || patient.foto_inicial_frente!, 'Foto Frontal')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleZoomPhoto(patient.foto_inicial_frente!, 'Foto Frontal'); }}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(patient.foto_inicial_frente!, 'Foto Frontal'); }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleConfirmDeletePhoto('foto_inicial_frente', 'Foto Frontal'); }}
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
                          <div className="relative group" style={{ height: '384px' }}>
                            {isGoogleDriveUrl(patient.foto_inicial_lado) ? (
                              <GoogleDriveImage
                                src={patient.foto_inicial_lado}
                                alt="Foto Lateral Esquerda"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_lado!, 'Foto Lateral Esquerda')}
                              />
                            ) : (
                              <img
                                src={convertGoogleDriveUrl(patient.foto_inicial_lado) || patient.foto_inicial_lado}
                                alt="Foto Lateral Esquerda"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_lado) || patient.foto_inicial_lado!, 'Foto Lateral Esquerda')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleZoomPhoto(patient.foto_inicial_lado!, 'Foto Lateral Esquerda'); }}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(patient.foto_inicial_lado!, 'Foto Lateral Esquerda'); }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleConfirmDeletePhoto('foto_inicial_lado', 'Foto Lateral Esquerda'); }}
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
                          <div className="relative group" style={{ height: '384px' }}>
                            {isGoogleDriveUrl(patient.foto_inicial_lado_2) ? (
                              <GoogleDriveImage
                                src={patient.foto_inicial_lado_2}
                                alt="Foto Lateral Direita"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_lado_2!, 'Foto Lateral Direita')}
                              />
                            ) : (
                              <img
                                src={convertGoogleDriveUrl(patient.foto_inicial_lado_2) || patient.foto_inicial_lado_2}
                                alt="Foto Lateral Direita"
                                loading="lazy"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_lado_2) || patient.foto_inicial_lado_2!, 'Foto Lateral Direita')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleZoomPhoto(patient.foto_inicial_lado_2!, 'Foto Lateral Direita'); }}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(patient.foto_inicial_lado_2!, 'Foto Lateral Direita'); }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleConfirmDeletePhoto('foto_inicial_lado_2', 'Foto Lateral Direita'); }}
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
                          <div className="relative group" style={{ height: '384px' }}>
                            {isGoogleDriveUrl(patient.foto_inicial_costas) ? (
                              <GoogleDriveImage
                                src={patient.foto_inicial_costas}
                                alt="Foto Costas Inicial"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(patient.foto_inicial_costas!, 'Foto de Costas')}
                              />
                            ) : (
                              <img
                                src={convertGoogleDriveUrl(patient.foto_inicial_costas) || patient.foto_inicial_costas}
                                alt="Foto Costas Inicial"
                                loading="lazy"
                                className="w-full h-96 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all cursor-pointer"
                                onClick={() => handleZoomPhoto(convertGoogleDriveUrl(patient.foto_inicial_costas) || patient.foto_inicial_costas!, 'Foto de Costas')}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23334155" width="400" height="400"/%3E%3Ctext fill="%2394a3b8" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EFoto não disponível%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleZoomPhoto(patient.foto_inicial_costas!, 'Foto de Costas'); }}
                              >
                                <ZoomIn className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleDownloadPhoto(patient.foto_inicial_costas!, 'Foto de Costas'); }}
                                title="Baixar foto"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); handleConfirmDeletePhoto('foto_inicial_costas', 'Foto de Costas'); }}
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
                    telefone={patient?.telefone || telefone!}
                    nome={patient?.nome || 'Paciente'}
                    onSuccess={handleInitialDataSuccess}
                  />
                </div>
              </CardContent>
            </Card>
          )}

        {/* Dados Atuais e Evolução (quando não há check-ins mas há dados atuais) */}
        {(() => {
          const hasCurrentData = patient && checkins.length === 0 && (
            (patient as any).foto_atual_frente ||
            (patient as any).foto_atual_lado ||
            (patient as any).foto_atual_lado_2 ||
            (patient as any).foto_atual_costas ||
            (patient as any).peso_atual ||
            (patient as any).altura_atual
          );
          return hasCurrentData;
        })() && (
            <>
              {/* Card de Dados Atuais */}
              <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm border-green-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Camera className="w-5 h-5 text-green-400" />
                    Dados Cadastrados
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Dados do paciente - {(patient as any)?.data_fotos_atuais ? new Date((patient as any).data_fotos_atuais).toLocaleDateString('pt-BR') : 'Data não informada'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Medidas Atuais */}
                  {((patient as any)?.data_nascimento || (patient as any)?.peso_atual || (patient as any)?.altura_atual || (patient as any)?.medida_cintura_atual || (patient as any)?.medida_quadril_atual) && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(patient as any)?.data_nascimento && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                          <p className="text-xs text-slate-400 mb-1">Idade</p>
                          <p className="text-2xl font-bold text-white">{calcularIdade((patient as any).data_nascimento)} anos</p>
                        </div>
                      )}
                      {(patient as any)?.peso_atual && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                          <p className="text-xs text-slate-400 mb-1">Peso Atual</p>
                          <p className="text-2xl font-bold text-white">{(patient as any).peso_atual} kg</p>
                        </div>
                      )}
                      {(patient as any)?.altura_atual && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                          <p className="text-xs text-slate-400 mb-1">Altura</p>
                          <p className="text-2xl font-bold text-white">{(patient as any).altura_atual} m</p>
                        </div>
                      )}
                      {(patient as any)?.medida_cintura_atual && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                          <p className="text-xs text-slate-400 mb-1">Cintura</p>
                          <p className="text-2xl font-bold text-white">{(patient as any).medida_cintura_atual} cm</p>
                        </div>
                      )}
                      {(patient as any)?.medida_quadril_atual && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                          <p className="text-xs text-slate-400 mb-1">Quadril</p>
                          <p className="text-2xl font-bold text-white">{(patient as any).medida_quadril_atual} cm</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fotos Atuais */}
                  {((patient as any)?.foto_atual_frente || (patient as any)?.foto_atual_lado || (patient as any)?.foto_atual_lado_2 || (patient as any)?.foto_atual_costas) && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-green-400" />
                        Fotos Atuais
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(patient as any)?.foto_atual_frente && (
                          <div className="space-y-2">
                            <div className="relative group" style={{ height: '384px' }}>
                              {isGoogleDriveUrl((patient as any).foto_atual_frente) ? (
                                <GoogleDriveImage
                                  src={(patient as any).foto_atual_frente}
                                  alt="Foto Frontal Atual"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto((patient as any).foto_atual_frente!, 'Foto Frontal Atual')}
                                />
                              ) : (
                                <img
                                  src={convertGoogleDriveUrl((patient as any).foto_atual_frente) || (patient as any).foto_atual_frente}
                                  alt="Foto Frontal Atual"
                                  loading="lazy"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto(convertGoogleDriveUrl((patient as any).foto_atual_frente) || (patient as any).foto_atual_frente!, 'Foto Frontal Atual')}
                                />
                              )}
                            </div>
                            <p className="text-center text-sm text-green-300 font-semibold">📷 Frontal</p>
                          </div>
                        )}
                        {(patient as any)?.foto_atual_lado && (
                          <div className="space-y-2">
                            <div className="relative group" style={{ height: '384px' }}>
                              {isGoogleDriveUrl((patient as any).foto_atual_lado) ? (
                                <GoogleDriveImage
                                  src={(patient as any).foto_atual_lado}
                                  alt="Foto Lateral Esquerda Atual"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto((patient as any).foto_atual_lado!, 'Foto Lateral Esquerda Atual')}
                                />
                              ) : (
                                <img
                                  src={convertGoogleDriveUrl((patient as any).foto_atual_lado) || (patient as any).foto_atual_lado}
                                  alt="Foto Lateral Esquerda Atual"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto(convertGoogleDriveUrl((patient as any).foto_atual_lado) || (patient as any).foto_atual_lado!, 'Foto Lateral Esquerda Atual')}
                                />
                              )}
                            </div>
                            <p className="text-center text-sm text-green-300 font-semibold">📷 Lateral Esquerda</p>
                          </div>
                        )}
                        {(patient as any)?.foto_atual_lado_2 && (
                          <div className="space-y-2">
                            <div className="relative group" style={{ height: '384px' }}>
                              {isGoogleDriveUrl((patient as any).foto_atual_lado_2) ? (
                                <GoogleDriveImage
                                  src={(patient as any).foto_atual_lado_2}
                                  alt="Foto Lateral Direita Atual"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto((patient as any).foto_atual_lado_2!, 'Foto Lateral Direita Atual')}
                                />
                              ) : (
                                <img
                                  src={convertGoogleDriveUrl((patient as any).foto_atual_lado_2) || (patient as any).foto_atual_lado_2}
                                  alt="Foto Lateral Direita Atual"
                                  loading="lazy"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto(convertGoogleDriveUrl((patient as any).foto_atual_lado_2) || (patient as any).foto_atual_lado_2!, 'Foto Lateral Direita Atual')}
                                />
                              )}
                            </div>
                            <p className="text-center text-sm text-green-300 font-semibold">📷 Lateral Direita</p>
                          </div>
                        )}
                        {(patient as any)?.foto_atual_costas && (
                          <div className="space-y-2">
                            <div className="relative group" style={{ height: '384px' }}>
                              {isGoogleDriveUrl((patient as any).foto_atual_costas) ? (
                                <GoogleDriveImage
                                  src={(patient as any).foto_atual_costas}
                                  alt="Foto Costas Atual"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto((patient as any).foto_atual_costas!, 'Foto de Costas Atual')}
                                />
                              ) : (
                                <img
                                  src={convertGoogleDriveUrl((patient as any).foto_atual_costas) || (patient as any).foto_atual_costas}
                                  alt="Foto Costas Atual"
                                  loading="lazy"
                                  className="w-full h-96 object-cover rounded-lg border-2 border-green-500/50 hover:border-green-500 transition-all cursor-pointer"
                                  onClick={() => handleZoomPhoto(convertGoogleDriveUrl((patient as any).foto_atual_costas) || (patient as any).foto_atual_costas!, 'Foto de Costas Atual')}
                                />
                              )}
                            </div>
                            <p className="text-center text-sm text-green-300 font-semibold">📷 Costas</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botão para editar */}
                  <div className="flex justify-center pt-4">
                    <CurrentDataInput
                      telefone={patient?.telefone || telefone!}
                      nome={patient?.nome || 'Paciente'}
                      onSuccess={handleCurrentDataSuccess}
                      editMode={true}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Card de Comparar Fotos */}
              {((patient as any)?.foto_inicial_frente || (patient as any)?.foto_inicial_lado || (patient as any)?.foto_inicial_lado_2 || (patient as any)?.foto_inicial_costas) &&
                ((patient as any)?.foto_atual_frente || (patient as any)?.foto_atual_lado || (patient as any)?.foto_atual_lado_2 || (patient as any)?.foto_atual_costas) && (
                  <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm border-blue-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Comparar Fotos
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Compare as fotos iniciais com as fotos atuais lado a lado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setShowPhotoComparison(true)}
                        style={{
                          backgroundImage: 'linear-gradient(to right, rgb(37, 99, 235), rgb(8, 145, 178))',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(29, 78, 216), rgb(14, 116, 144))';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(37, 99, 235), rgb(8, 145, 178))';
                        }}
                        className="w-full gap-2 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all border-0"
                      >
                        <Camera className="w-4 h-4" />
                        Comparar Fotos Inicial vs Atual
                      </Button>
                    </CardContent>
                  </Card>
                )}

              {/* Histórico do Paciente */}
              {(patient?.telefone || telefone) && (
                <ProtocolNotesHistory telefone={patient?.telefone || telefone!} />
              )}

              {/* Gráfico de Evolução do Peso (Inicial vs Atual) */}
              {((patient as any)?.peso_inicial && (patient as any)?.peso_atual) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-sm border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Evolução do Peso
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Comparação entre peso inicial e peso atual
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <EvolutionCharts
                        checkins={[]}
                        patient={{
                          ...patient,
                          peso_inicial: (patient as any).peso_inicial,
                          peso_atual: (patient as any).peso_atual,
                          data_fotos_iniciais: (patient as any).data_fotos_iniciais,
                          data_fotos_atuais: (patient as any).data_fotos_atuais
                        } as any}
                        refreshTrigger={chartsRefreshTrigger}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}

        {/* Métricas de Composição Corporal - Aparece independente de check-ins */}
        {bodyCompositions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
                          await loadEvolution();
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
                          await loadEvolution();
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
                          await loadEvolution();
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
                          await loadEvolution();
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
            <BodyFatChart
              data={bodyCompositions}
              headerAction={
                telefone ? (
                  <BioimpedanciaList
                    telefone={telefone}
                    nome={patient?.nome || 'Paciente'}
                    idade={patient?.idade || (patient?.data_nascimento ? calcularIdade(patient.data_nascimento) : null)}
                    altura={(patient as any)?.altura_inicial || null}
                    pesoInicial={(patient as any)?.peso_inicial || null}
                    sexo={patient?.genero || null}
                    onUpdate={handleBioSuccess}
                  />
                ) : null
              }
            />
          </motion.div>
        )}

        {/* Seções que só aparecem quando há check-ins */}
        {checkins.length > 0 && (
          <>

            {/* 1. Análise Inteligente com IA - OCULTA */}
            {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AIInsights checkins={checkins} />
          </motion.div> */}

            {/* 2. Gráficos de Evolução (Peso, Pontuações, Performance) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <EvolutionCharts
                checkins={checkins}
                patient={patient}
                refreshTrigger={chartsRefreshTrigger}
                onAddData={() => setAddEvolutionDataOpen(true)}
              />
            </motion.div>

            {/* 4. Timeline Detalhada */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Timeline
                checkins={checkins}
                onCheckinUpdated={loadEvolution}
              />
            </motion.div>

            {/* 5. Comparação de Fotos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <PhotoComparison
                checkins={checkins}
                patient={patient}
                onPhotoDeleted={loadEvolution}
                isEditable={true} // Página interna do nutricionista - sempre mostra TODAS as fotos
                showCreateComparisonButton={false} // Ocultar botão "Criar Comparação" na página de evolução
              />
            </motion.div>

            {/* 7. Badges de Conquistas */}
            {achievements.length > 0 && showAchievements && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 z-10 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800"
                    onClick={() => setShowAchievements(false)}
                    title="Ocultar seção"
                  >
                    <EyeOff className="w-4 h-4" />
                  </Button>
                  <AchievementBadges achievements={achievements} />
                </div>
              </motion.div>
            )}

          </>
        )}

      </motion.div>

      {/* Dialog de Zoom da Foto */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-5xl bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">{zoomedPhoto?.label}</DialogTitle>
          </DialogHeader>
          {zoomedPhoto && (
            <div className="flex items-center justify-center w-full" style={{ height: '70vh', minHeight: '500px' }}>
              {isGoogleDriveUrl(zoomedPhoto.url) ? (
                <div className="w-full h-full">
                  <GoogleDriveImage
                    src={zoomedPhoto.url}
                    alt={zoomedPhoto.label}
                    className="w-full h-full rounded-lg"
                  />
                </div>
              ) : (
                <img
                  src={zoomedPhoto.url}
                  alt={zoomedPhoto.label}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Dados de Evolução (aberto pelos botões + dos gráficos e Timeline) */}
      {telefone && patient && (
        <AddEvolutionData
          telefone={patient.telefone || telefone}
          nome={patient.nome || 'Paciente'}
          open={addEvolutionDataOpen}
          onOpenChange={setAddEvolutionDataOpen}
          onSuccess={() => {
            loadEvolution();
            setChartsRefreshTrigger(prev => prev + 1);
          }}
          showButton={false}
        />
      )}

      {/* Dialog de Confirmação de Exclusão de Foto */}
      <Dialog open={!!deletePhotoConfirm} onOpenChange={(open) => !open && setDeletePhotoConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a <strong>{deletePhotoConfirm?.label}</strong>?
              <br />
              <span className="text-red-400">Esta ação não pode ser desfeita.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletePhotoConfirm(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePhoto}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Modal de Comparação de Fotos Inicial vs Atual */}
      <InitialCurrentPhotoComparison
        patient={patient}
        open={showPhotoComparison}
        onOpenChange={setShowPhotoComparison}
      />

      {/* Modal de Edição de Paciente */}
      <PatientForm
        patient={mapPatientToFormData(patient)}
        trigger={<div />}
        open={isPatientFormOpen}
        onOpenChange={setIsPatientFormOpen}
        onSave={async (data) => {
          if (!patient) return;

          try {
            // Preparar dados para salvar (mesma lógica do PatientsListNew)
            const dataToSave: any = {
              nome: data.nome,
              telefone: data.telefone,
            };

            // Campos opcionais que existem na tabela
            if (data.apelido) dataToSave.apelido = data.apelido;
            if (data.cpf) dataToSave.cpf = data.cpf;
            if (data.email) dataToSave.email = data.email;
            if (data.telefone_filtro) dataToSave.telefone_filtro = data.telefone_filtro;
            if (data.genero) dataToSave.genero = data.genero;
            if (data.plano) dataToSave.plano = data.plano;
            if (data.observacao) dataToSave.observacao = data.observacao;
            if (data.objetivo) dataToSave.objetivo = data.objetivo;

            // Converter data_nascimento para string
            if (data.data_nascimento) {
              dataToSave.data_nascimento = data.data_nascimento instanceof Date
                ? data.data_nascimento.toISOString().split('T')[0]
                : data.data_nascimento;
            }

            // Converter vencimento para string
            if (data.vencimento) {
              dataToSave.vencimento = data.vencimento instanceof Date
                ? data.vencimento.toISOString().split('T')[0]
                : data.vencimento;
            }

            // Converter números
            if (data.tempo_acompanhamento !== undefined) {
              dataToSave.tempo_acompanhamento = Number(data.tempo_acompanhamento);
            }
            if (data.valor !== undefined) {
              dataToSave.valor = Number(data.valor);
            }
            if (data.peso !== undefined) {
              dataToSave.peso = Number(data.peso);
            }
            if (data.medida !== undefined) {
              dataToSave.medida = Number(data.medida);
            }

            // Atualizar paciente no Supabase
            await patientService.update(patient.id, dataToSave);

            // Recarregar dados do paciente após salvar
            await loadEvolution();
            setIsPatientFormOpen(false);

            toast({
              title: 'Paciente atualizado',
              description: 'Os dados do paciente foram atualizados com sucesso'
            });
          } catch (error: any) {
            console.error('Erro ao atualizar paciente:', error);
            toast({
              title: 'Erro ao atualizar',
              description: error.message || 'Não foi possível atualizar o paciente',
              variant: 'destructive'
            });
          }
        }}
      />
    </DashboardLayout>
  );
}





