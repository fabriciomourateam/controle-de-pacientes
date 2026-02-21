import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Loader2, Settings, MessageSquare, Copy, ExternalLink, Save, Send, ChevronDown, ChevronUp, Bot, TrendingUp, Sparkles, Check, X, Camera, Phone, Calendar, Download, Utensils } from 'lucide-react';
import { useCheckinFeedback } from '../../hooks/use-checkin-feedback';
import { useFeedbackTemplates } from '../../hooks/use-feedback-templates';
import { useAllCheckins } from '../../hooks/use-all-checkins';
import { extractMeasurements } from '../../lib/measurement-utils';
import { PromptEditor } from '../evolution/PromptEditor';
import { DietAdjustmentPromptEditor } from './DietAdjustmentPromptEditor';
import { DietAdjustmentModal } from './DietAdjustmentModal';
import { ManualDietAdjustmentModal } from './ManualDietAdjustmentModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { CheckinWithPatient } from '@/lib/checkin-service';
import { useCheckinManagement } from '../../hooks/use-checkin-management';
import { supabase } from '@/integrations/supabase/client';
import { CheckinPhotosViewer } from './CheckinPhotosViewer';
import { InitialDataInput } from '../evolution/InitialDataInput';
import { PhotoComparisonModal } from './PhotoComparisonModal';
import { BioimpedanciaModal } from './BioimpedanciaModal';

interface CheckinFeedbackCardProps {
  checkin: CheckinWithPatient;
  totalCheckins?: number;
  onUpdate?: () => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  isSheet?: boolean; // Quando true, renderiza em modo Sheet (sempre expandido, sem botão de colapsar)
}

const CheckinFeedbackCardComponent: React.FC<CheckinFeedbackCardProps> = ({
  checkin,
  totalCheckins = 0,
  onUpdate,
  expanded: externalExpanded,
  onExpandedChange,
  isSheet = false
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Se externalExpanded está definido, usar ele; caso contrário, usar o estado interno
  // Modo Sheet: sempre expandido
  const isExpanded = isSheet ? true : (externalExpanded !== undefined ? externalExpanded : internalExpanded);

  // Sincronizar estado interno quando externalExpanded mudar
  React.useEffect(() => {
    if (externalExpanded !== undefined) {
      setInternalExpanded(externalExpanded);
    }
  }, [externalExpanded]);

  const setIsExpanded = (value: boolean) => {
    // Se há controle externo, sempre chamar o callback
    if (externalExpanded !== undefined && onExpandedChange) {
      onExpandedChange(value);
    } else {
      // Caso contrário, usar estado interno
      setInternalExpanded(value);
      if (onExpandedChange) {
        onExpandedChange(value);
      }
    }
  };
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [showDietAdjustmentModal, setShowDietAdjustmentModal] = useState(false);
  const [showManualDietModal, setShowManualDietModal] = useState(false);
  const [observedImprovements, setObservedImprovements] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dietAdjustments, setDietAdjustments] = useState('');
  const [generatedFeedback, setGeneratedFeedback] = useState('');

  const {
    latestCheckin,
    evolutionData,
    feedbackAnalysis,
    isGenerating,
    loading,
    patientId,
    generateFeedback,
    saveFeedbackAnalysis,
    markFeedbackAsSent,
    refreshData
  } = useCheckinFeedback(checkin.telefone);

  // Estados para edição inline dos valores
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdatingCheckin, setIsUpdatingCheckin] = useState(false);
  const [editingPrevious, setEditingPrevious] = useState(false); // Indica se está editando check-in anterior
  const [previousCheckinId, setPreviousCheckinId] = useState<string | null>(null);
  const [editingInitialData, setEditingInitialData] = useState(false); // Indica se está editando dados iniciais do paciente
  const [showPhotosViewer, setShowPhotosViewer] = useState(false);
  const [photoViewerSource, setPhotoViewerSource] = useState<'current' | 'previous' | 'initial' | 'all'>('all');
  const [showPhotoComparison, setShowPhotoComparison] = useState(false);
  const [selectedHistoricCheckinId, setSelectedHistoricCheckinId] = useState<string | null>(null); // ID do check-in histórico selecionado
  const [hasInitialPhotos, setHasInitialPhotos] = useState(false);
  const [showInitialDataModal, setShowInitialDataModal] = useState(false);
  const [patientData, setPatientData] = useState<any>(null);
  const [hasBioimpedancia, setHasBioimpedancia] = useState(false);
  const [isEvolutionExpanded, setIsEvolutionExpanded] = useState(true);
  const [isFeedbackInfoExpanded, setIsFeedbackInfoExpanded] = useState(true);
  const [hasCurrentPhotos, setHasCurrentPhotos] = useState(false);
  const [hasPreviousPhotos, setHasPreviousPhotos] = useState(false);
  const [showAllCheckinsColumns, setShowAllCheckinsColumns] = useState(false);
  const [showBioimpedanciaModal, setShowBioimpedanciaModal] = useState(false);
  const [showAproveitamento, setShowAproveitamento] = useState(false); // Oculto por padrão

  // Ref para evitar múltiplas execuções do download
  const isExportingRef = React.useRef(false);

  const { activeTemplate } = useFeedbackTemplates();
  const { updateCheckinStatus } = useCheckinManagement();

  // ⚡ OTIMIZAÇÃO: Só buscar checkins anteriores quando expandido
  const { previousCheckins, loading: loadingAllCheckins } = useAllCheckins(
    checkin.telefone,
    checkin.id,
    isExpanded // Só busca quando expandido
  );

  // Debug: Log para verificar quantos check-ins anteriores existem
  React.useEffect(() => {
    if (isExpanded && checkin.telefone === '5511995844506') {
      console.log(`📊 Check-ins anteriores para ${checkin.telefone}:`, {
        total: previousCheckins.length,
        datas: previousCheckins.map(c => new Date(c.data_checkin).toLocaleDateString('pt-BR')),
        checkinAtualId: checkin.id,
        checkinAtualData: new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR'),
        showAllCheckinsColumns,
        condicaoPenultimo: `!showAllCheckinsColumns (${!showAllCheckinsColumns}) && previousCheckins.length >= 2 (${previousCheckins.length >= 2})`,
        condicaoUltimo: `!showAllCheckinsColumns (${!showAllCheckinsColumns}) && previousCheckins.length > 0 (${previousCheckins.length > 0})`
      });
    }
  }, [previousCheckins, isExpanded, checkin.telefone, checkin.id, checkin.data_checkin, checkin.data_preenchimento, showAllCheckinsColumns]);
  // Normalizar quebras de linha ao carregar feedback salvo (mesma lógica de cleanFeedback)
  const normalizeLineBreaks = (text: string) =>
    text.replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();

  // Carregar dados existentes quando disponível do hook
  React.useEffect(() => {
    if (feedbackAnalysis) {
      // Só atualizar se os dados vierem do mesmo check-in
      if (feedbackAnalysis.checkin_id === checkin.id) {
        setObservedImprovements(feedbackAnalysis.observed_improvements || '');
        setDietAdjustments(feedbackAnalysis.diet_adjustments || '');
        setGeneratedFeedback(normalizeLineBreaks(feedbackAnalysis.generated_feedback || ''));
      }
    }
  }, [feedbackAnalysis, checkin.id]);

  // Carregar análise específica deste check-in quando o componente montar ou check-in mudar
  React.useEffect(() => {
    const loadAnalysisForCheckin = async () => {
      if (!checkin?.id) return;

      // Buscar análise específica deste check-in por checkin_id (mais preciso)
      try {
        const { data, error } = await supabase
          .from('checkin_feedback_analysis' as any)
          .select('*')
          .eq('checkin_id', checkin.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao buscar análise:', error);
          }
          return;
        }

        if (data) {
          setObservedImprovements(data.observed_improvements || '');
          setDietAdjustments(data.diet_adjustments || '');
          setGeneratedFeedback(normalizeLineBreaks(data.generated_feedback || ''));
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao buscar análise do check-in:', error);
        }
      }
    };

    loadAnalysisForCheckin();
  }, [checkin.id]);

  // Verificar se há fotos iniciais do paciente - SÓ QUANDO EXPANDIDO
  React.useEffect(() => {
    if (!isExpanded) return; // ⚡ OTIMIZAÇÃO

    const checkInitialPhotos = async () => {
      try {
        const { data: patient } = await supabase
          .from('patients')
          .select('foto_inicial_frente, foto_inicial_lado, foto_inicial_lado_2, foto_inicial_costas, nome')
          .eq('telefone', checkin.telefone)
          .single();

        if (patient) {
          setPatientData(patient);
          const hasPhotos = !!(patient.foto_inicial_frente || patient.foto_inicial_lado || patient.foto_inicial_lado_2 || patient.foto_inicial_costas);
          setHasInitialPhotos(hasPhotos);
        }
      } catch (error) {
        console.error('Erro ao verificar fotos iniciais:', error);
      }
    };

    checkInitialPhotos();
  }, [checkin.telefone, isExpanded]); // ⚡ Adicionar isExpanded como dependência

  // Verificar se há bioimpedância do paciente - SÓ QUANDO EXPANDIDO
  React.useEffect(() => {
    if (!isExpanded) return; // ⚡ OTIMIZAÇÃO

    const checkBioimpedancia = async () => {
      try {
        const { data: bioData, error } = await supabase
          .from('body_composition')
          .select('id')
          .eq('telefone', checkin.telefone)
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao verificar bioimpedância:', error);
          return;
        }

        // Se encontrou pelo menos um registro, o paciente tem bioimpedância
        setHasBioimpedancia(!!bioData);
      } catch (error) {
        console.error('Erro ao verificar bioimpedância:', error);
        setHasBioimpedancia(false);
      }
    };

    checkBioimpedancia();
  }, [checkin.telefone, isExpanded]); // ⚡ Adicionar isExpanded como dependência

  // Buscar ID do check-in anterior quando os dados de evolução estiverem disponíveis
  React.useEffect(() => {
    if (evolutionData?.checkin_anterior_id) {
      setPreviousCheckinId(evolutionData.checkin_anterior_id);
    } else if (evolutionData?.tem_checkin_anterior && evolutionData?.checkin_anterior_data && checkin?.telefone) {
      // Fallback: buscar por data se o ID não estiver disponível
      const fetchPreviousCheckinId = async () => {
        try {
          const { data, error } = await supabase
            .from('checkin')
            .select('id')
            .eq('telefone', checkin.telefone)
            .eq('data_checkin', evolutionData.checkin_anterior_data)
            .maybeSingle();

          if (!error && data) {
            setPreviousCheckinId(data.id);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao buscar ID do check-in anterior:', error);
          }
        }
      };

      fetchPreviousCheckinId();
    } else {
      setPreviousCheckinId(null);
    }
  }, [evolutionData?.checkin_anterior_id, evolutionData?.tem_checkin_anterior, evolutionData?.checkin_anterior_data, checkin?.telefone]);

  // Verificar se há fotos no check-in atual
  React.useEffect(() => {
    const hasPhotos = !!(
      checkin?.foto_1 ||
      checkin?.foto_2 ||
      checkin?.foto_3 ||
      checkin?.foto_4
    );
    setHasCurrentPhotos(hasPhotos);
  }, [checkin?.foto_1, checkin?.foto_2, checkin?.foto_3, checkin?.foto_4]);

  // Verificar se há fotos no check-in anterior
  React.useEffect(() => {
    const checkPreviousPhotos = async () => {
      if (!previousCheckinId) {
        setHasPreviousPhotos(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('checkin')
          .select('foto_1, foto_2, foto_3, foto_4')
          .eq('id', previousCheckinId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          if (process.env.NODE_ENV === 'development') {
            console.error('Erro ao verificar fotos do check-in anterior:', error);
          }
          setHasPreviousPhotos(false);
          return;
        }

        const hasPhotos = !!(
          data?.foto_1 ||
          data?.foto_2 ||
          data?.foto_3 ||
          data?.foto_4
        );
        setHasPreviousPhotos(hasPhotos);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro ao verificar fotos do check-in anterior:', error);
        }
        setHasPreviousPhotos(false);
      }
    };

    checkPreviousPhotos();
  }, [previousCheckinId]);

  // Função para normalizar quebras de linha: no máximo uma quebra entre linhas/parágrafos
  const cleanFeedback = useCallback((text: string): string => {
    return text
      .replace(/\n{2,}/g, '\n') // Duas ou mais quebras viram uma só (evita "muitas linhas em branco")
      .replace(/[ \t]{2,}/g, ' ') // Substituir espaços/tabs múltiplos por um único espaço
      .trim();
  }, []);

  const handleGenerateFeedback = useCallback(async () => {
    if (!activeTemplate) {
      toast.error('Nenhum template ativo encontrado');
      return;
    }

    const feedback = await generateFeedback(
      checkin.patient?.nome || 'Paciente',
      observedImprovements,
      dietAdjustments,
      activeTemplate
    );

    if (feedback) {
      setGeneratedFeedback(cleanFeedback(feedback));
    }
  }, [activeTemplate, checkin.patient?.nome, observedImprovements, dietAdjustments, generateFeedback, cleanFeedback]);

  const handleSaveAnnotations = useCallback(async () => {
    if (!checkin || !patientId) {
      toast.error('Dados do check-in não disponíveis');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveFeedbackAnalysis({
        // Se já existe uma análise salva, incluir o ID para fazer UPDATE ao invés de INSERT
        ...(feedbackAnalysis?.id && { id: feedbackAnalysis.id }),
        patient_id: patientId!,
        checkin_id: checkin.id,
        checkin_date: checkin.data_checkin?.split('T')[0] || new Date().toISOString().split('T')[0],
        checkin_data: checkin,
        evolution_data: evolutionData,
        observed_improvements: observedImprovements,
        diet_adjustments: dietAdjustments,
        generated_feedback: generatedFeedback,
        feedback_status: feedbackAnalysis?.feedback_status || 'draft', // Manter status se já existir
        prompt_template_id: activeTemplate?.id || null
      });

      if (result) {
        toast.success('Anotações e feedback salvos com sucesso!');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar anotações e feedback');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao salvar anotações:', error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [checkin, patientId, feedbackAnalysis, saveFeedbackAnalysis, evolutionData, observedImprovements, dietAdjustments, generatedFeedback, activeTemplate]);

  const handleCopyFeedback = useCallback(async () => {
    if (!generatedFeedback) return;

    try {
      await navigator.clipboard.writeText(generatedFeedback);
      toast.success('Feedback copiado para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar feedback');
    }
  }, [generatedFeedback]);

  const handleCopyPhone = useCallback(async () => {
    const telefone = checkin.telefone || checkin.patient?.telefone;
    if (!telefone) {
      toast.error('Telefone não disponível');
      return;
    }

    try {
      await navigator.clipboard.writeText(telefone);
      toast.success('Telefone copiado!');
    } catch (error) {
      console.error('Erro ao copiar telefone:', error);
      toast.error('Erro ao copiar telefone');
    }
  }, [checkin.telefone, checkin.patient?.telefone]);

  const handleOpenWhatsApp = useCallback(async () => {
    if (!generatedFeedback) return;

    const encodedMessage = encodeURIComponent(generatedFeedback);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    // Atualizar status do check-in para enviado
    await updateCheckinStatus(checkin.id, 'enviado');
    onUpdate?.();

    // Marcar feedback como enviado também
    markFeedbackAsSent('whatsapp');

    // Minimizar o card automaticamente após enviar via WhatsApp
    setIsExpanded(false);
  }, [generatedFeedback, checkin.id, updateCheckinStatus, onUpdate, markFeedbackAsSent, setIsExpanded]);

  // Função helper para pegar valor de métrica de um check-in específico
  const getCheckinMetricValue = useCallback((checkinData: any, metric: string): string | null => {
    if (!checkinData) return null;

    switch (metric) {
      case 'peso':
        return checkinData.peso ? `${checkinData.peso}kg` : null;
      case 'cintura':
      case 'quadril': {
        if (!checkinData.medida) return null;
        const measurements = extractMeasurements(checkinData.medida);
        const value = metric === 'cintura' ? measurements.cintura : measurements.quadril;
        return value ? `${value}cm` : null;
      }
      case 'treino':
        return checkinData.treino || null;
      case 'cardio':
        return checkinData.cardio || null;
      case 'descanso':
        return checkinData.descanso || null;
      case 'refeicoes':
        return checkinData.ref_livre || null;
      case 'beliscos':
        return checkinData.beliscos || null;
      case 'agua':
        return checkinData.agua || null;
      case 'sono':
        return checkinData.sono || null;
      default:
        return null;
    }
  }, []);

  // Função para iniciar edição de um campo
  const handleStartEdit = useCallback((field: string, currentValue: number | string | null, isPrevious: boolean = false, isInitialData: boolean = false) => {
    setEditingField(field);
    setEditValue(currentValue?.toString() || '');
    setEditingPrevious(isPrevious);
    setEditingInitialData(isInitialData);
  }, []);

  // Função para cancelar edição
  const handleCancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
    setEditingPrevious(false);
  }, []);

  // Função para salvar valor editado
  const handleSaveEdit = useCallback(async (field: string) => {
    // Salvar posição de scroll antes de atualizar
    const scrollPosition = window.scrollY;
    const element = document.activeElement as HTMLElement;
    let elementToRestore: HTMLElement | null = null;
    if (element && element.closest('[data-checkin-feedback]')) {
      elementToRestore = element.closest('[data-checkin-feedback]') as HTMLElement;
    }

    setIsUpdatingCheckin(true);
    try {
      const value = editValue.trim();
      const numValue = value ? parseFloat(value.replace(',', '.')) : null;

      // Se está editando dados iniciais do paciente
      if (editingInitialData) {
        if (!checkin?.telefone) {
          toast.error('Telefone do paciente não encontrado');
          return;
        }

        // Buscar paciente pelo telefone
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('id')
          .eq('telefone', checkin.telefone)
          .single();

        if (patientError || !patient) {
          throw new Error('Paciente não encontrado');
        }

        let updateData: any = {};

        // Mapear campos para colunas da tabela patients
        switch (field) {
          case 'peso':
            updateData.peso_inicial = numValue;
            break;
          case 'cintura':
            updateData.medida_cintura_inicial = numValue;
            break;
          case 'quadril':
            updateData.medida_quadril_inicial = numValue;
            break;
          default:
            return;
        }

        // Atualizar dados iniciais do paciente
        const { error } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', patient.id);

        if (error) throw error;

        toast.success('Dados iniciais atualizados com sucesso!');

        // Recarregar dados
        await refreshData();
        onUpdate?.();

        // Restaurar posição de scroll
        setTimeout(() => {
          if (elementToRestore) {
            elementToRestore.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            window.scrollTo({ top: scrollPosition, behavior: 'auto' });
          }
        }, 100);

        setEditingField(null);
        setEditValue('');
        setEditingInitialData(false);
        return;
      }

      // Se está editando check-in (lógica original)
      const targetCheckinId = editingPrevious ? previousCheckinId : checkin?.id;
      if (!targetCheckinId) {
        toast.error('Check-in não encontrado');
        return;
      }

      // Buscar check-in atual para obter valores existentes
      const { data: targetCheckin } = await supabase
        .from('checkin')
        .select('*')
        .eq('id', targetCheckinId)
        .single();

      if (!targetCheckin) {
        throw new Error('Check-in não encontrado');
      }

      let updateData: any = {};

      // Mapear campos para colunas do banco
      switch (field) {
        case 'peso':
          updateData.peso = numValue?.toString() || null;
          break;
        case 'cintura':
        case 'quadril': {
          // Reconstruir campo medida usando os valores atuais do check-in
          const measurements = extractMeasurements(targetCheckin.medida || '');
          if (field === 'cintura') {
            measurements.cintura = numValue;
          } else {
            measurements.quadril = numValue;
          }
          const medidaParts: string[] = [];
          if (measurements.cintura !== null && measurements.cintura !== undefined) {
            medidaParts.push(`Cintura: ${measurements.cintura}cm`);
          }
          if (measurements.quadril !== null && measurements.quadril !== undefined) {
            medidaParts.push(`Quadril: ${measurements.quadril}cm`);
          }
          updateData.medida = medidaParts.length > 0 ? medidaParts.join(' ') : null;
          break;
        }
        case 'treino':
          updateData.pontos_treinos = numValue?.toString() || null;
          break;
        case 'cardio':
          updateData.pontos_cardios = numValue?.toString() || null;
          break;
        case 'agua':
          updateData.pontos_agua = numValue?.toString() || null;
          break;
        case 'sono':
          updateData.pontos_sono = numValue?.toString() || null;
          break;
        case 'ref_livre':
          updateData.pontos_refeicao_livre = numValue?.toString() || null;
          break;
        case 'beliscos':
          updateData.pontos_beliscos = numValue?.toString() || null;
          break;
        case 'tempo_treino':
          updateData.tempo = editValue || null;
          break;
        case 'tempo_cardio':
          updateData.tempo_cardio = editValue || null;
          break;
        case 'descanso':
          updateData.descanso = editValue || null;
          break;
        case 'aderencia':
          updateData.percentual_aproveitamento = numValue?.toString() || null;
          break;
        default:
          return;
      }

      // Atualizar no banco
      const { error } = await supabase
        .from('checkin')
        .update(updateData)
        .eq('id', targetCheckinId);

      if (error) throw error;

      toast.success('Valor atualizado com sucesso!');

      // Recarregar dados
      await refreshData();
      onUpdate?.(); // Atualizar lista

      // Restaurar posição de scroll após um pequeno delay para garantir que o DOM foi atualizado
      setTimeout(() => {
        if (elementToRestore) {
          elementToRestore.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          window.scrollTo({ top: scrollPosition, behavior: 'auto' });
        }
      }, 100);

      setEditingField(null);
      setEditValue('');
      setEditingPrevious(false);
    } catch (error) {
      toast.error('Erro ao atualizar valor');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao atualizar:', error);
      }
    } finally {
      setIsUpdatingCheckin(false);
    }
  }, [checkin, editValue, editingPrevious, editingInitialData, previousCheckinId, refreshData, onUpdate]);

  const handleMarkAsSent = useCallback(async () => {
    try {
      // Atualizar status do check-in para enviado
      const success = await updateCheckinStatus(checkin.id, 'enviado');

      if (success) {
        toast.success('Check-in marcado como enviado!');
        onUpdate?.(); // Notificar componente pai para atualizar lista

        // Minimizar o card automaticamente após marcar como enviado
        setIsExpanded(false);
      } else {
        toast.error('Erro ao atualizar status do check-in');
      }

      // Marcar feedback como enviado também (se existir)
      if (feedbackAnalysis) {
        markFeedbackAsSent('manual');
      }
    } catch (error) {
      toast.error('Erro ao marcar como enviado');
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro ao marcar como enviado:', error);
      }
    }
  }, [checkin.id, updateCheckinStatus, onUpdate, feedbackAnalysis, markFeedbackAsSent, setIsExpanded]);

  // Função de exportação de evolução - Abre página de evolução em nova aba
  const handleExportEvolution = async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!checkin?.telefone) {
      toast.error('Erro', { description: 'Telefone do paciente não disponível' });
      return;
    }

    // Abrir página de evolução em nova aba com parâmetros de auto-export
    const exportFormat = format === 'jpeg' ? 'png' : format;
    const url = `/checkins/evolution/${checkin.telefone}?autoExport=${exportFormat}&autoClose=true`;

    toast.success('Abrindo página de evolução...', {
      description: 'O download iniciará automaticamente'
    });

    // Abrir em nova aba
    window.open(url, '_blank');
  };

  if (!checkin) return null;

  return (
    <div>
      {/* Botão de Expandir/Colapsar - Oculto em modo Sheet */}
      {!isSheet && (
        <div className={`flex items-center justify-between ${isExpanded ? 'mb-1' : 'mb-0'}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 w-full ${isExpanded ? 'justify-start h-8' : 'justify-between h-5'}`}
          >
            {isExpanded ? (
              <>
                <Bot className="text-slate-200 w-4 h-4" />
                <span className="font-medium flex-1 text-left text-sm">Feedback</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                <Bot className="text-slate-200 w-3 h-3" />
              </>
            )}
          </Button>

          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowPromptEditor(!showPromptEditor);
              }}
              className="text-slate-400 hover:text-white h-8 ml-2"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Botão de Configurações no modo Sheet */}
      {isSheet && (
        <div className="flex items-center justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowPromptEditor(!showPromptEditor);
            }}
            className="text-slate-400 hover:text-white h-8"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      )}

      {/* Conteúdo Expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="space-y-3">
              {/* Editor de Prompt (colapsável) */}
              {showPromptEditor && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <PromptEditor />
                  <DietAdjustmentPromptEditor />
                </motion.div>
              )}

              {/* Evolução Comparativa - Tabela */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEvolutionExpanded(!isEvolutionExpanded)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        title={isEvolutionExpanded ? "Minimizar" : "Expandir"}
                      >
                        {isEvolutionExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <Badge
                        className="text-xs font-medium text-slate-200 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg cursor-pointer transition-all duration-200 px-2.5 py-1 border-0"
                        onClick={() => handleExportEvolution('png')}
                        title="Clique para baixar a evolução do paciente (PNG)"
                      >
                        <Download className="w-3 h-3 mr-1.5" />
                        Evolução Comparativa
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {previousCheckins.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllCheckinsColumns(!showAllCheckinsColumns)}
                          className="text-xs h-7 px-3 font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:text-purple-300 hover:bg-purple-500/30 hover:border-purple-500/50 shadow-sm shadow-purple-500/10 transition-all"
                          title={showAllCheckinsColumns ? "Ocultar histórico" : "Mostrar todos os check-ins"}
                        >
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          {showAllCheckinsColumns ? 'Ocultar' : `Ver ${previousCheckins.length - 1}`} Check-ins
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAproveitamento(!showAproveitamento)}
                        className={`text-xs h-7 px-3 font-semibold border transition-all ${showAproveitamento
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:text-amber-300 hover:bg-amber-500/30 hover:border-amber-500/50 shadow-sm shadow-amber-500/10'
                          : 'bg-slate-700/30 text-slate-400 border-slate-600/30 hover:text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50'
                          }`}
                        title={showAproveitamento ? "Ocultar linha de Aproveitamento" : "Mostrar linha de Aproveitamento"}
                      >
                        🎯 {showAproveitamento ? 'Ocultar' : 'Mostrar'} Aproveitamento
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPhotoComparison(true)}
                        className="text-xs h-7 px-3 font-semibold bg-green-500/20 text-green-400 border border-green-500/30 hover:text-green-300 hover:bg-green-500/30 hover:border-green-500/50 shadow-sm shadow-green-500/10 transition-all"
                        title="Comparar fotos lado a lado"
                      >
                        <Camera className="w-3.5 h-3.5 mr-1.5" />
                        Comparar Fotos
                      </Button>
                      {!evolutionData?.tem_checkin_anterior && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Primeiro Check-in
                        </Badge>
                      )}
                      {hasBioimpedancia && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBioimpedanciaModal(true)}
                          className="bg-purple-500/20 text-purple-300 border-purple-500/30 hover:text-purple-200 hover:bg-purple-500/30 hover:border-purple-500/50 transition-all cursor-pointer h-7 px-3 text-xs font-semibold"
                          title="Abrir dados de bioimpedância"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Bioimpedância
                        </Button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEvolutionExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {evolutionData?.tem_checkin_anterior && evolutionData ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/20 bg-slate-800/60">
                                  <th className="text-left py-1.5 px-2 text-slate-300 font-medium sticky left-0 z-10">Métrica</th>
                                  {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                  {showAllCheckinsColumns && previousCheckins.map((checkin, index) => (
                                    <th key={checkin.id} className="text-center py-1.5 px-1.5 text-slate-300 font-medium text-xs bg-slate-800/60">
                                      {new Date(checkin.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                    </th>
                                  ))}
                                  {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 2 colunas: dados iniciais + último */}
                                  {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                    <>
                                      {/* Coluna de dados iniciais */}
                                      <th className="text-center py-1.5 px-1.5 text-slate-400 font-medium text-xs bg-slate-800/95 z-10">
                                        Dados Iniciais
                                      </th>
                                      {/* Coluna do único check-in anterior */}
                                      <th className="text-center py-1.5 px-1.5 text-slate-400 font-medium text-xs bg-slate-800/95 z-10">
                                        {new Date(previousCheckins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </th>
                                    </>
                                  )}
                                  {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                  {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                    <>
                                      {/* Coluna do penúltimo check-in */}
                                      <th className="text-center py-1.5 px-1.5 text-slate-400 font-medium text-xs bg-slate-800/95 z-10">
                                        {new Date(previousCheckins[previousCheckins.length - 2].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </th>
                                      {/* Coluna do último check-in */}
                                      <th className="text-center py-1.5 px-1.5 text-slate-400 font-medium text-xs bg-slate-800/95 z-10">
                                        {new Date(previousCheckins[previousCheckins.length - 1].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </th>
                                    </>
                                  )}
                                  {/* Coluna do check-in atual */}
                                  <th className="text-center py-1.5 px-1.5 text-slate-400 font-medium text-xs bg-slate-800/95 z-10">
                                    {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </th>
                                  <th className="text-center py-1.5 px-2 text-slate-300 font-medium sticky right-0 z-10">Evolução</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Peso */}
                                {evolutionData.peso_anterior !== undefined && evolutionData.peso_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Peso</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'peso') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 2 colunas: dados iniciais + último */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <>
                                        {/* Coluna com dados iniciais do paciente */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400 text-xs">
                                            {evolutionData.peso_inicial ? `${evolutionData.peso_inicial}kg` : '-'}
                                          </span>
                                        </td>
                                        {/* Coluna do único check-in anterior */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'peso' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('peso');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">kg</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('peso')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('peso', getCheckinMetricValue(previousCheckins[0], 'peso')?.replace('kg', ''), true)}
                                              title="Clique para editar"
                                            >
                                              {getCheckinMetricValue(previousCheckins[0], 'peso') || '-'}
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <>
                                        {/* Coluna penúltimo */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], 'peso') || '-'}
                                          </span>
                                        </td>
                                        {/* Coluna último */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'peso' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('peso');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">kg</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('peso')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('peso', evolutionData.peso_anterior, true)}
                                              title="Clique para editar"
                                            >
                                              {evolutionData.peso_anterior || '-'}kg
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Coluna atual (sempre visível) */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'peso' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('peso');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">kg</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('peso')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('peso', evolutionData.peso_atual, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.peso_atual || '-'}kg
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.peso_diferenca < 0 ? 'text-green-400' : evolutionData.peso_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.peso_diferenca > 0 ? '+' : ''}{evolutionData.peso_diferenca}kg
                                    </td>
                                  </tr>
                                )}

                                {/* Cintura */}
                                {(evolutionData.cintura_anterior !== null && evolutionData.cintura_anterior !== undefined) ||
                                  (evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined) ? (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Cintura</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'cintura') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 2 colunas: dados iniciais + último */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <>
                                        {/* Coluna com dados iniciais do paciente */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400 text-xs">
                                            {evolutionData.cintura_inicial ? `${evolutionData.cintura_inicial}cm` : '-'}
                                          </span>
                                        </td>
                                        {/* Coluna do único check-in anterior */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'cintura' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('cintura');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">cm</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cintura')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('cintura', getCheckinMetricValue(previousCheckins[0], 'cintura')?.replace('cm', ''), true)}
                                              title="Clique para editar"
                                            >
                                              {getCheckinMetricValue(previousCheckins[0], 'cintura') || '-'}
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <>
                                        {/* Coluna penúltimo */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], 'cintura') || '-'}
                                          </span>
                                        </td>
                                        {/* Coluna último */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'cintura' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('cintura');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">cm</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cintura')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('cintura', evolutionData.cintura_anterior, true)}
                                              title="Clique para editar"
                                            >
                                              {evolutionData.cintura_anterior || '-'}cm
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Coluna atual (sempre visível) */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'cintura' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('cintura');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cintura')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('cintura', evolutionData.cintura_atual, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.cintura_atual || '-'}cm
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.cintura_diferenca < 0 ? 'text-green-400' : evolutionData.cintura_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.cintura_diferenca !== undefined && evolutionData.cintura_diferenca !== 0
                                        ? `${evolutionData.cintura_diferenca > 0 ? '+' : ''}${evolutionData.cintura_diferenca}cm`
                                        : '0cm'}
                                    </td>
                                  </tr>
                                ) : null}

                                {/* Quadril */}
                                {(evolutionData.quadril_anterior !== null && evolutionData.quadril_anterior !== undefined) ||
                                  (evolutionData.quadril_atual !== null && evolutionData.quadril_atual !== undefined) ? (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Quadril</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'quadril') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 2 colunas: dados iniciais + último */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <>
                                        {/* Coluna com dados iniciais do paciente */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400 text-xs">
                                            {evolutionData.quadril_inicial ? `${evolutionData.quadril_inicial}cm` : '-'}
                                          </span>
                                        </td>
                                        {/* Coluna do único check-in anterior */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'quadril' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('quadril');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">cm</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('quadril')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('quadril', getCheckinMetricValue(previousCheckins[0], 'quadril')?.replace('cm', ''), true)}
                                              title="Clique para editar"
                                            >
                                              {getCheckinMetricValue(previousCheckins[0], 'quadril') || '-'}
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <>
                                        {/* Coluna penúltimo */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], 'quadril') || '-'}
                                          </span>
                                        </td>
                                        {/* Coluna último */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          {editingField === 'quadril' && editingPrevious ? (
                                            <div className="flex items-center justify-center gap-1">
                                              <Input
                                                type="number"
                                                step="0.1"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEdit('quadril');
                                                  if (e.key === 'Escape') handleCancelEdit();
                                                }}
                                              />
                                              <span className="text-xs text-slate-400">cm</span>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('quadril')} disabled={isUpdatingCheckin}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <span
                                              className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                              onClick={() => handleStartEdit('quadril', evolutionData.quadril_anterior, true)}
                                              title="Clique para editar"
                                            >
                                              {evolutionData.quadril_anterior || '-'}cm
                                            </span>
                                          )}
                                        </td>
                                      </>
                                    )}
                                    {/* Coluna atual (sempre visível) */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'quadril' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            step="0.1"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('quadril');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('quadril')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('quadril', evolutionData.quadril_atual, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.quadril_atual || '-'}cm
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.quadril_diferenca < 0 ? 'text-green-400' : evolutionData.quadril_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.quadril_diferenca !== undefined && evolutionData.quadril_diferenca !== 0
                                        ? `${evolutionData.quadril_diferenca > 0 ? '+' : ''}${evolutionData.quadril_diferenca}cm`
                                        : '0cm'}
                                    </td>
                                  </tr>
                                ) : null}

                                {/* Aproveitamento - não editável, calculado automaticamente */}
                                {showAproveitamento && evolutionData.aderencia_anterior !== undefined && evolutionData.aderencia_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">🎯 Aproveitamento</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {historicCheckin.percentual_aproveitamento ? `${historicCheckin.percentual_aproveitamento}%` : '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 2 colunas: dados iniciais (vazio) + último */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <>
                                        {/* Coluna vazia (não há dados iniciais de aproveitamento) */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-500 text-xs">-</span>
                                        </td>
                                        {/* Coluna do único check-in anterior */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {previousCheckins[0].percentual_aproveitamento ? `${previousCheckins[0].percentual_aproveitamento}%` : '-'}
                                          </span>
                                        </td>
                                      </>
                                    )}
                                    {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <>
                                        {/* Coluna penúltimo */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {previousCheckins[previousCheckins.length - 2].percentual_aproveitamento ? `${previousCheckins[previousCheckins.length - 2].percentual_aproveitamento}%` : '-'}
                                          </span>
                                        </td>
                                        {/* Coluna último */}
                                        <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                          <span className="text-slate-400">
                                            {previousCheckins[previousCheckins.length - 1].percentual_aproveitamento ? `${previousCheckins[previousCheckins.length - 1].percentual_aproveitamento}%` : '-'}
                                          </span>
                                        </td>
                                      </>
                                    )}
                                    {/* Coluna atual (sempre visível) */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10 text-slate-200">{evolutionData.aderencia_atual || 0}%</td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.aderencia_diferenca > 0 ? 'text-green-400' : evolutionData.aderencia_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.aderencia_diferenca !== 0
                                        ? `${evolutionData.aderencia_diferenca > 0 ? '+' : ''}${evolutionData.aderencia_diferenca}%`
                                        : '0%'}
                                    </td>
                                  </tr>
                                )}

                                {/* Treinos */}
                                {evolutionData.treino_anterior !== undefined && evolutionData.treino_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃 Treinos</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'treino') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar coluna vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs"></span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'treino') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'treino' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('treino');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('treino')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('treino', evolutionData.treino_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.treino_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'treino' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('treino');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('treino')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('treino', evolutionData.treino_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.treino_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.treino_diferenca > 0 ? 'text-green-400' : evolutionData.treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.treino_diferenca !== 0
                                        ? `${evolutionData.treino_diferenca > 0 ? '+' : ''}${evolutionData.treino_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}

                                {/* Cardio */}
                                {evolutionData.cardio_anterior !== undefined && evolutionData.cardio_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃‍♂️ Cardio</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'cardio') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'cardio') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'cardio' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('cardio');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('cardio')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('cardio', evolutionData.cardio_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.cardio_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'cardio' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('cardio');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('cardio')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('cardio', evolutionData.cardio_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.cardio_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.cardio_diferenca > 0 ? 'text-green-400' : evolutionData.cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.cardio_diferenca !== 0
                                        ? `${evolutionData.cardio_diferenca > 0 ? '+' : ''}${evolutionData.cardio_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}

                                {/* Tempo de Treino */}
                                {evolutionData && ((evolutionData as any).tempo_treino_atual_text || evolutionData.tempo_treino_atual !== undefined) && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">⏱️ Tempo de Treino</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {historicCheckin.tempo || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {previousCheckins[previousCheckins.length - 1].tempo || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'tempo_treino' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              placeholder="Ex: 60 a 70 min"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('tempo_treino');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('tempo_treino')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                            onClick={() => handleStartEdit('tempo_treino', (evolutionData as any).tempo_treino_anterior_text ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {(evolutionData as any).tempo_treino_anterior_text || '-'}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'tempo_treino' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('tempo_treino');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">min</span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('tempo_treino')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('tempo_treino', (evolutionData as any).tempo_treino_atual_text ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).tempo_treino_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.tempo_treino_diferenca !== null && evolutionData.tempo_treino_diferenca !== undefined
                                      ? (evolutionData.tempo_treino_diferenca > 0 ? 'text-green-400' : evolutionData.tempo_treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.tempo_treino_diferenca !== null && evolutionData.tempo_treino_diferenca !== undefined
                                        ? (evolutionData.tempo_treino_diferenca !== 0
                                          ? `${evolutionData.tempo_treino_diferenca > 0 ? '+' : ''}${evolutionData.tempo_treino_diferenca}`
                                          : '0')
                                        : '-'}
                                    </td>
                                  </tr>
                                )}

                                {/* Tempo de Cardio */}
                                {evolutionData && ((evolutionData as any).tempo_cardio_atual_text || evolutionData.tempo_cardio_atual !== undefined) && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃 Tempo de Cardio</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {historicCheckin.tempo_cardio || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {previousCheckins[previousCheckins.length - 1].tempo_cardio || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'tempo_cardio' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              placeholder="Ex: 30 minutos"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('tempo_cardio');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('tempo_cardio')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                            onClick={() => handleStartEdit('tempo_cardio', (evolutionData as any).tempo_cardio_anterior_text ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {(evolutionData as any).tempo_cardio_anterior_text || '-'}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'tempo_cardio' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            placeholder="Ex: 30 minutos"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('tempo_cardio');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('tempo_cardio')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('tempo_cardio', (evolutionData as any).tempo_cardio_atual_text ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).tempo_cardio_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.tempo_cardio_diferenca !== null && evolutionData.tempo_cardio_diferenca !== undefined
                                      ? (evolutionData.tempo_cardio_diferenca > 0 ? 'text-green-400' : evolutionData.tempo_cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.tempo_cardio_diferenca !== null && evolutionData.tempo_cardio_diferenca !== undefined
                                        ? (evolutionData.tempo_cardio_diferenca !== 0
                                          ? `${evolutionData.tempo_cardio_diferenca > 0 ? '+' : ''}${evolutionData.tempo_cardio_diferenca}`
                                          : '0')
                                        : '-'}
                                    </td>
                                  </tr>
                                )}

                                {/* Descanso entre Séries */}
                                {evolutionData && ((evolutionData as any).descanso_atual_text || evolutionData.descanso_atual !== undefined) && (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">⏸️ Descanso entre as séries</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'descanso') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'descanso') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'descanso' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="text"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              placeholder="Ex: Mais de um minuto"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('descanso');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('descanso')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                            onClick={() => handleStartEdit('descanso', (evolutionData as any).descanso_anterior_text ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {(evolutionData as any).descanso_anterior_text || '-'}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'descanso' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            placeholder="Ex: Mais de um minuto"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('descanso');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('descanso')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('descanso', (evolutionData as any).descanso_atual_text ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).descanso_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.descanso_diferenca !== null && evolutionData.descanso_diferenca !== undefined
                                      ? (evolutionData.descanso_diferenca > 0 ? 'text-green-400' : evolutionData.descanso_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.descanso_diferenca !== null && evolutionData.descanso_diferenca !== undefined
                                        ? (evolutionData.descanso_diferenca !== 0
                                          ? `${evolutionData.descanso_diferenca > 0 ? '+' : ''}${evolutionData.descanso_diferenca}`
                                          : '0')
                                        : '-'}
                                    </td>
                                  </tr>
                                )}

                                {/* Água */}
                                {evolutionData.agua_anterior !== undefined && evolutionData.agua_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">💧 Água</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'agua') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'agua') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'agua' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('agua');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('agua')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('agua', evolutionData.agua_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.agua_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'agua' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('agua');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('agua')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('agua', evolutionData.agua_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.agua_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.agua_diferenca > 0 ? 'text-green-400' : evolutionData.agua_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.agua_diferenca !== 0
                                        ? `${evolutionData.agua_diferenca > 0 ? '+' : ''}${evolutionData.agua_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}

                                {/* Sono */}
                                {evolutionData.sono_anterior !== undefined && evolutionData.sono_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">😴 Sono</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'sono') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'sono') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'sono' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('sono');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('sono')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('sono', evolutionData.sono_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.sono_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'sono' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('sono');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('sono')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('sono', evolutionData.sono_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.sono_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.sono_diferenca > 0 ? 'text-green-400' : evolutionData.sono_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.sono_diferenca !== 0
                                        ? `${evolutionData.sono_diferenca > 0 ? '+' : ''}${evolutionData.sono_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}

                                {/* Refeições Livres */}
                                {evolutionData.ref_livre_anterior !== undefined && evolutionData.ref_livre_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">🍽️ Refeições Livres</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'refeicoes') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'refeicoes') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'ref_livre' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('ref_livre');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('ref_livre')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('ref_livre', evolutionData.ref_livre_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.ref_livre_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'ref_livre' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('ref_livre');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('ref_livre')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('ref_livre', evolutionData.ref_livre_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.ref_livre_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.ref_livre_diferenca > 0 ? 'text-green-400' : evolutionData.ref_livre_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.ref_livre_diferenca !== 0
                                        ? `${evolutionData.ref_livre_diferenca > 0 ? '+' : ''}${evolutionData.ref_livre_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}

                                {/* Beliscos */}
                                {evolutionData.beliscos_anterior !== undefined && evolutionData.beliscos_atual !== undefined && (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">🍪 Beliscos</td>
                                    {/* Colunas históricas - quando expandido, mostra TODOS os check-ins anteriores */}
                                    {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                        {getCheckinMetricValue(historicCheckin, 'beliscos') || '-'}
                                      </td>
                                    ))}
                                    {/* Quando há exatamente 1 check-in anterior, mostrar célula vazia (dados iniciais) */}
                                    {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-500 text-xs">-</span>
                                      </td>
                                    )}
                                    {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                                    {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <span className="text-slate-400">
                                          {getCheckinMetricValue(previousCheckins[previousCheckins.length - 1], 'beliscos') || '-'}
                                        </span>
                                      </td>
                                    )}
                                    {/* Coluna penúltimo (se não estiver mostrando todas) */}
                                    {!showAllCheckinsColumns && (
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        {editingField === 'beliscos' && editingPrevious ? (
                                          <div className="flex items-center justify-center gap-1">
                                            <Input
                                              type="number"
                                              value={editValue}
                                              onChange={(e) => setEditValue(e.target.value)}
                                              className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveEdit('beliscos');
                                                if (e.key === 'Escape') handleCancelEdit();
                                              }}
                                            />
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                              onClick={() => handleSaveEdit('beliscos')}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                              onClick={handleCancelEdit}
                                              disabled={isUpdatingCheckin}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                            onClick={() => handleStartEdit('beliscos', evolutionData.beliscos_anterior ?? null, true)}
                                            title="Clique para editar"
                                          >
                                            {evolutionData.beliscos_anterior || 0}
                                          </span>
                                        )}
                                      </td>
                                    )}
                                    {/* Coluna atual */}
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'beliscos' && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('beliscos');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('beliscos')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('beliscos', evolutionData.beliscos_atual ?? null, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.beliscos_atual ?? 0}
                                        </span>
                                      )}
                                    </td>
                                    {/* Coluna de evolução */}
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.beliscos_diferenca < 0 ? 'text-green-400' : evolutionData.beliscos_diferenca > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                      {evolutionData.beliscos_diferenca !== 0
                                        ? `${evolutionData.beliscos_diferenca > 0 ? '+' : ''}${evolutionData.beliscos_diferenca}`
                                        : '0'}
                                    </td>
                                  </tr>
                                )}
                                {/* Linha de botões de fotos */}
                                <tr className="border-b border-slate-700/30">
                                  <td className="py-1.5 px-2 text-slate-200 sticky left-0 z-10">📷 Fotos</td>

                                  {/* Colunas históricas de fotos (quando expandido) - mostra TODOS os check-ins anteriores */}
                                  {showAllCheckinsColumns && previousCheckins.map((historicCheckin) => {
                                    const hasPhotos = !!(
                                      historicCheckin.foto_1 ||
                                      historicCheckin.foto_2 ||
                                      historicCheckin.foto_3 ||
                                      historicCheckin.foto_4
                                    );

                                    return (
                                      <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center bg-blue-500/5">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (hasPhotos) {
                                              // Abrir visualizador simples mostrando SOMENTE as fotos deste check-in específico
                                              setSelectedHistoricCheckinId(historicCheckin.id);
                                              setPhotoViewerSource('current'); // Mostrar SOMENTE fotos deste check-in
                                              setShowPhotosViewer(true);
                                            } else {
                                              toast.info('Sem fotos neste check-in');
                                            }
                                          }}
                                          className={`text-[10px] h-5 px-1.5 ${hasPhotos
                                            ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700/30'
                                            }`}
                                          title={hasPhotos ? `Ver fotos de ${new Date(historicCheckin.data_checkin).toLocaleDateString('pt-BR')}` : 'Sem fotos'}
                                        >
                                          <Camera className={`w-2.5 h-2.5 ${hasPhotos ? 'text-slate-200' : ''}`} />
                                        </Button>
                                      </td>
                                    );
                                  })}

                                  {/* Quando há exatamente 1 check-in anterior (2 no total), mostrar 3 colunas: dados iniciais + anterior + atual */}
                                  {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                    <>
                                      {/* Coluna de fotos iniciais do paciente */}
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (hasInitialPhotos) {
                                              setPhotoViewerSource('initial');
                                              setShowPhotosViewer(true);
                                            } else {
                                              toast.info('Sem fotos iniciais');
                                            }
                                          }}
                                          className={`text-xs h-6 px-2 ${hasInitialPhotos
                                            ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                            : 'text-slate-500 cursor-not-allowed opacity-50'
                                            }`}
                                          disabled={!hasInitialPhotos}
                                          title={hasInitialPhotos ? 'Ver fotos iniciais' : 'Sem fotos iniciais'}
                                        >
                                          <Camera className={`w-3 h-3 mr-1 ${hasInitialPhotos ? 'text-slate-200' : ''}`} />
                                          {hasInitialPhotos ? 'Ver' : '-'}
                                        </Button>
                                      </td>
                                      {/* Coluna do único check-in anterior */}
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const ultimoCheckin = previousCheckins[0];
                                            const hasPhotos = !!(ultimoCheckin.foto_1 || ultimoCheckin.foto_2 || ultimoCheckin.foto_3 || ultimoCheckin.foto_4);

                                            if (hasPhotos) {
                                              setSelectedHistoricCheckinId(ultimoCheckin.id);
                                              setPhotoViewerSource('current');
                                              setShowPhotosViewer(true);
                                            } else {
                                              toast.info('Sem fotos neste check-in');
                                            }
                                          }}
                                          className={`text-xs h-6 px-2 ${previousCheckins[0].foto_1 || previousCheckins[0].foto_2 || previousCheckins[0].foto_3 || previousCheckins[0].foto_4
                                            ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                            }`}
                                          title="Ver fotos do check-in anterior"
                                        >
                                          <Camera className={`w-3 h-3 mr-1 ${previousCheckins[0].foto_1 || previousCheckins[0].foto_2 || previousCheckins[0].foto_3 || previousCheckins[0].foto_4 ? 'text-slate-200' : ''}`} />
                                          {new Date(previousCheckins[0].data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        </Button>
                                      </td>
                                    </>
                                  )}

                                  {/* Quando há 2 ou mais check-ins anteriores, mostrar penúltimo + último normalmente */}
                                  {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                    <>
                                      {/* Coluna do penúltimo */}
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const penultimoCheckin = previousCheckins[previousCheckins.length - 2];
                                            const hasPhotos = !!(penultimoCheckin.foto_1 || penultimoCheckin.foto_2 || penultimoCheckin.foto_3 || penultimoCheckin.foto_4);

                                            if (hasPhotos) {
                                              setSelectedHistoricCheckinId(penultimoCheckin.id);
                                              setPhotoViewerSource('current');
                                              setShowPhotosViewer(true);
                                            } else {
                                              toast.info('Sem fotos neste check-in');
                                            }
                                          }}
                                          className={`text-xs h-6 px-2 ${previousCheckins[previousCheckins.length - 2].foto_1 || previousCheckins[previousCheckins.length - 2].foto_2 || previousCheckins[previousCheckins.length - 2].foto_3 || previousCheckins[previousCheckins.length - 2].foto_4
                                            ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                            : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700/30'
                                            }`}
                                          title="Ver fotos do penúltimo check-in"
                                        >
                                          <Camera className="w-3 h-3 mr-1" />
                                          {previousCheckins[previousCheckins.length - 2].foto_1 || previousCheckins[previousCheckins.length - 2].foto_2 || previousCheckins[previousCheckins.length - 2].foto_3 || previousCheckins[previousCheckins.length - 2].foto_4 ? 'Ver' : 'Sem fotos'}
                                        </Button>
                                      </td>
                                      {/* Coluna do último */}
                                      <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (previousCheckinId && hasPreviousPhotos) {
                                              setSelectedHistoricCheckinId(previousCheckinId);
                                              setPhotoViewerSource('current');
                                              setShowPhotosViewer(true);
                                            } else if (previousCheckinId) {
                                              toast.info('Sem fotos neste check-in');
                                            } else {
                                              toast.info('ID do check-in anterior não disponível');
                                            }
                                          }}
                                          className={`text-xs h-6 px-2 ${hasPreviousPhotos
                                            ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                            }`}
                                          title={hasPreviousPhotos ? "Ver fotos do check-in anterior (há fotos)" : "Ver fotos do check-in anterior"}
                                        >
                                          <Camera className={`w-3 h-3 mr-1 ${hasPreviousPhotos ? 'text-slate-200' : ''}`} />
                                          {evolutionData.checkin_anterior_data
                                            ? new Date(evolutionData.checkin_anterior_data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                            : 'Anterior'}
                                        </Button>
                                      </td>
                                    </>
                                  )}

                                  {/* Coluna do check-in atual */}
                                  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedHistoricCheckinId(null); // Limpar qualquer check-in histórico selecionado
                                        setPhotoViewerSource('current');
                                        setShowPhotosViewer(true);
                                      }}
                                      className={`text-xs h-6 px-2 ${hasCurrentPhotos
                                        ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                        }`}
                                      title={hasCurrentPhotos ? "Ver fotos do check-in atual (há fotos)" : "Ver fotos do check-in atual"}
                                    >
                                      <Camera className={`w-3 h-3 mr-1 ${hasCurrentPhotos ? 'text-slate-200' : ''}`} />
                                      {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </Button>
                                  </td>

                                  {/* Coluna de Fotos Iniciais (sticky right) */}
                                  <td className="py-1.5 px-2 text-center sticky right-0 z-10">
                                    {hasInitialPhotos ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedHistoricCheckinId(null); // Limpar qualquer check-in histórico selecionado
                                          setPhotoViewerSource('initial');
                                          setShowPhotosViewer(true);
                                        }}
                                        className="text-xs h-6 px-2 text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30"
                                        title="Ver fotos iniciais (há fotos)"
                                      >
                                        <Camera className="w-3 h-3 mr-1 text-slate-200" />
                                        Iniciais
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedHistoricCheckinId(null); // Limpar qualquer check-in histórico selecionado
                                          setPhotoViewerSource('initial');
                                          setShowPhotosViewer(true);
                                        }}
                                        className="text-xs h-6 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                                        title="Adicionar fotos iniciais"
                                      >
                                        <Camera className="w-3 h-3 mr-1" />
                                        Iniciais
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : evolutionData ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-white/20 bg-slate-800/60">
                                  <th className="text-left py-1.5 px-2 text-slate-300 font-medium sticky left-0 z-10">Métrica</th>
                                  <th className="text-center py-1.5 px-1.5 text-slate-300 font-medium text-xs bg-slate-800/95 z-10">
                                    {evolutionData?.usando_dados_iniciais ? 'Dados Iniciais' : 'Anterior'}
                                  </th>
                                  <th className="text-center py-1.5 px-1.5 text-slate-300 font-medium text-xs bg-slate-800/95 z-10">
                                    {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </th>
                                  <th className="text-center py-1.5 px-2 text-slate-300 font-medium sticky right-0 z-10">Evolução</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Peso */}
                                {evolutionData?.peso_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Peso</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'peso' && editingInitialData ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('peso');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">kg</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('peso')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('peso', evolutionData.peso_anterior || null, false, true)}
                                          title="Clique para editar ou adicionar"
                                        >
                                          {evolutionData.peso_anterior !== null && evolutionData.peso_anterior !== undefined
                                            ? `${evolutionData.peso_anterior}kg`
                                            : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'peso' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('peso');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">kg</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('peso')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('peso', evolutionData.peso_atual, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.peso_atual || 0}kg
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.peso_diferenca !== null && evolutionData.peso_diferenca !== undefined
                                      ? (evolutionData.peso_diferenca < 0 ? 'text-green-400' : evolutionData.peso_diferenca > 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.peso_diferenca !== null && evolutionData.peso_diferenca !== undefined
                                        ? `${evolutionData.peso_diferenca > 0 ? '+' : ''}${evolutionData.peso_diferenca}kg`
                                        : '-'}
                                    </td>
                                  </tr>
                                )}

                                {/* Cintura */}
                                {(evolutionData?.cintura_anterior !== null && evolutionData?.cintura_anterior !== undefined) ||
                                  (evolutionData?.cintura_atual !== null && evolutionData?.cintura_atual !== undefined) ? (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Cintura</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'cintura' && editingInitialData ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('cintura');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cintura')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('cintura', evolutionData.cintura_anterior || null, false, true)}
                                          title="Clique para editar ou adicionar"
                                        >
                                          {evolutionData.cintura_anterior !== null && evolutionData.cintura_anterior !== undefined
                                            ? `${evolutionData.cintura_anterior}cm`
                                            : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'cintura' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('cintura');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cintura')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className={`text-slate-200 ${evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined ? 'cursor-pointer hover:text-slate-200 hover:underline font-medium' : ''}`}
                                          onClick={() => {
                                            if (evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined) {
                                              handleStartEdit('cintura', evolutionData.cintura_atual, false, false);
                                            }
                                          }}
                                          title={evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined ? "Clique para editar" : ""}
                                        >
                                          {evolutionData.cintura_atual !== null && evolutionData.cintura_atual !== undefined
                                            ? `${evolutionData.cintura_atual}cm`
                                            : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.cintura_diferenca !== null && evolutionData.cintura_diferenca !== undefined
                                      ? (evolutionData.cintura_diferenca < 0 ? 'text-green-400' : evolutionData.cintura_diferenca > 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.cintura_diferenca !== null && evolutionData.cintura_diferenca !== undefined
                                        ? `${evolutionData.cintura_diferenca > 0 ? '+' : ''}${evolutionData.cintura_diferenca}cm`
                                        : '-'}
                                    </td>
                                  </tr>
                                ) : null}

                                {/* Quadril */}
                                {(evolutionData?.quadril_anterior !== null && evolutionData?.quadril_anterior !== undefined) ||
                                  (evolutionData?.quadril_atual !== null && evolutionData?.quadril_atual !== undefined) ? (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">Quadril</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'quadril' && editingInitialData ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('quadril');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('quadril')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-400 cursor-pointer hover:text-slate-200 hover:underline"
                                          onClick={() => handleStartEdit('quadril', evolutionData.quadril_anterior || null, false, true)}
                                          title="Clique para editar ou adicionar"
                                        >
                                          {evolutionData.quadril_anterior !== null && evolutionData.quadril_anterior !== undefined
                                            ? `${evolutionData.quadril_anterior}cm`
                                            : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'quadril' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('quadril');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">cm</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('quadril')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('quadril', evolutionData.quadril_atual || null, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.quadril_atual !== null && evolutionData.quadril_atual !== undefined
                                            ? `${evolutionData.quadril_atual}cm`
                                            : '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.quadril_diferenca !== null && evolutionData.quadril_diferenca !== undefined
                                      ? (evolutionData.quadril_diferenca < 0 ? 'text-green-400' : evolutionData.quadril_diferenca > 0 ? 'text-red-400' : 'text-slate-400')
                                      : 'text-slate-400'
                                      }`}>
                                      {evolutionData.quadril_diferenca !== null && evolutionData.quadril_diferenca !== undefined
                                        ? `${evolutionData.quadril_diferenca > 0 ? '+' : ''}${evolutionData.quadril_diferenca}cm`
                                        : '-'}
                                    </td>
                                  </tr>
                                ) : null}

                                {/* Aproveitamento */}
                                {showAproveitamento && evolutionData?.aderencia_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">🎯 Aproveitamento</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'aderencia' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('aderencia');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <span className="text-xs text-slate-400">%</span>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('aderencia')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-blue-300 hover:underline font-medium"
                                          onClick={() => handleStartEdit('aderencia', evolutionData.aderencia_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.aderencia_atual || 0}%
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Treinos */}
                                {evolutionData?.treino_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃 Treinos</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'treino' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('treino');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('treino')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('treino', evolutionData.treino_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.treino_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Cardio */}
                                {evolutionData?.cardio_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃‍♂️ Cardio</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'cardio' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('cardio');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('cardio')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('cardio', evolutionData.cardio_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.cardio_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Tempo de Treino */}
                                {evolutionData && ((evolutionData as any).tempo_treino_atual_text || evolutionData.tempo_treino_atual !== undefined) && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">⏱️ Tempo de Treino</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'tempo_treino' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            placeholder="Ex: 60 a 70 min"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('tempo_treino');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('tempo_treino')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('tempo_treino', (evolutionData as any).tempo_treino_atual_text ?? null, false, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).tempo_treino_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Tempo de Cardio */}
                                {evolutionData && ((evolutionData as any).tempo_cardio_atual_text || evolutionData.tempo_cardio_atual !== undefined) && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">🏃 Tempo de Cardio</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'tempo_cardio' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            placeholder="Ex: 30 minutos"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('tempo_cardio');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('tempo_cardio')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('tempo_cardio', (evolutionData as any).tempo_cardio_atual_text ?? null, false, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).tempo_cardio_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Descanso entre Séries */}
                                {evolutionData && ((evolutionData as any).descanso_atual_text || evolutionData.descanso_atual !== undefined) && (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] font-semibold text-slate-300 sticky left-0 z-10">⏸️ Descanso entre as séries</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'descanso' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-24 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            placeholder="Ex: 60 seg"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('descanso');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit('descanso')}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                            onClick={handleCancelEdit}
                                            disabled={isUpdatingCheckin}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline text-xs"
                                          onClick={() => handleStartEdit('descanso', (evolutionData as any).descanso_atual_text ?? null, false, false)}
                                          title="Clique para editar"
                                        >
                                          {(evolutionData as any).descanso_atual_text || '-'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Água */}
                                {evolutionData?.agua_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">💧 Água</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'agua' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('agua');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('agua')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('agua', evolutionData.agua_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.agua_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Sono */}
                                {evolutionData?.sono_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">😴 Sono</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'sono' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('sono');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('sono')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('sono', evolutionData.sono_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.sono_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Refeições Livres */}
                                {evolutionData?.ref_livre_atual !== undefined && (
                                  <tr className="border-b border-slate-700/30">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">🍽️ Refeições Livres</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'ref_livre' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('ref_livre');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('ref_livre')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('ref_livre', evolutionData.ref_livre_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.ref_livre_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}

                                {/* Beliscos */}
                                {evolutionData?.beliscos_atual !== undefined && (
                                  <tr className="border-b border-white/20">
                                    <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">🍪 Beliscos</td>
                                    <td className="py-1.5 px-1.5 text-center text-slate-400 bg-slate-800/95 z-10">-</td>
                                    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                      {editingField === 'beliscos' && !editingInitialData && !editingPrevious ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 w-16 text-xs px-1 text-center bg-slate-700 border-slate-600 text-slate-200"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveEdit('beliscos');
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-green-400 hover:text-green-300" onClick={() => handleSaveEdit('beliscos')} disabled={isUpdatingCheckin}>
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-400 hover:text-red-300" onClick={handleCancelEdit} disabled={isUpdatingCheckin}>
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <span
                                          className="text-slate-200 cursor-pointer hover:text-slate-200 hover:underline font-medium"
                                          onClick={() => handleStartEdit('beliscos', evolutionData.beliscos_atual || 0, false, false)}
                                          title="Clique para editar"
                                        >
                                          {evolutionData.beliscos_atual || 0}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-2 text-center text-slate-400 sticky right-0 z-10">-</td>
                                  </tr>
                                )}
                                {/* Linha de botões de fotos */}
                                <tr className="border-b border-slate-700/30">
                                  <td className="py-1.5 px-2 text-[13px] text-slate-300 sticky left-0 z-10">📷 Fotos</td>
                                  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPhotoViewerSource('initial');
                                        setShowPhotosViewer(true);
                                      }}
                                      className={`text-xs h-6 px-2 ${hasInitialPhotos
                                        ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                        }`}
                                      title={hasInitialPhotos ? "Ver fotos dos dados iniciais (há fotos)" : "Ver fotos dos dados iniciais"}
                                    >
                                      <Camera className={`w-3 h-3 mr-1 ${hasInitialPhotos ? 'text-slate-200' : ''}`} />
                                      Dados Iniciais
                                    </Button>
                                  </td>
                                  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPhotoViewerSource('current');
                                        setShowPhotosViewer(true);
                                      }}
                                      className={`text-xs h-6 px-2 ${hasCurrentPhotos
                                        ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                        }`}
                                      title={hasCurrentPhotos ? "Ver fotos do check-in atual (há fotos)" : "Ver fotos do check-in atual"}
                                    >
                                      <Camera className={`w-3 h-3 mr-1 ${hasCurrentPhotos ? 'text-slate-200' : ''}`} />
                                      {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </Button>
                                  </td>
                                  <td className="py-1.5 px-2 sticky right-0 z-10"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-slate-400">
                            <p>Carregando dados de evolução...</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Informações Adicionais para Elaboração do Feedback */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3 space-y-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsFeedbackInfoExpanded(!isFeedbackInfoExpanded)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-slate-200"
                        title={isFeedbackInfoExpanded ? "Minimizar" : "Expandir"}
                      >
                        {isFeedbackInfoExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <h4 className="text-sm font-semibold text-slate-200">📋 Informações para Elaboração do Feedback</h4>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isFeedbackInfoExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Objetivo & Dificuldades */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-slate-300 mb-2">🎯 Objetivo & Dificuldades</h5>
                            <div className="space-y-2.5 text-[13px]">
                              <div>
                                <span className="font-semibold text-slate-200">Objetivo: </span>
                                <span className="text-slate-200">{checkin.objetivo || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">Dificuldades: </span>
                                <span className="text-slate-200">{checkin.dificuldades || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Percepções Visuais */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-slate-300 mb-2">👁️ Percepções Visuais</h5>
                            <div className="space-y-2.5 text-[13px]">
                              <div>
                                <span className="font-semibold text-slate-200">Melhora Visual: </span>
                                <span className="text-slate-200">{checkin.melhora_visual || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">Quais Pontos: </span>
                                <span className="text-slate-200">{checkin.quais_pontos || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Refeições Livres & Beliscos */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-slate-300 mb-2">🍽️ Refeições Livres & Beliscos</h5>
                            <div className="space-y-2.5 text-[13px]">
                              <div>
                                <span className="font-semibold text-slate-200">O que comeu na refeição livre: </span>
                                <span className="text-slate-200">{checkin.oq_comeu_ref_livre || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">O que beliscou: </span>
                                <span className="text-slate-200">{checkin.oq_beliscou || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Fome & Ajustes */}
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold text-slate-300 mb-2">🍴 Fome & Ajustes</h5>
                            <div className="space-y-2.5 text-[13px]">
                              <div>
                                <span className="font-semibold text-slate-200">Comeu menos que o planejado: </span>
                                <span className="text-slate-200">{checkin.comeu_menos || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">Fome em algum horário: </span>
                                <span className="text-slate-200">{checkin.fome_algum_horario || 'Não informado'}</span>
                              </div>
                              <div>
                                <span className="font-semibold text-slate-200">Alimento para incluir: </span>
                                <span className="text-slate-200">{checkin.alimento_para_incluir || 'Não informado'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Suas Observações */}
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3 space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">📝 Suas Observações</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[13px] font-medium text-slate-200 mb-1.5">
                        🔍 Melhoras Observadas:
                      </label>
                      <Textarea
                        value={observedImprovements}
                        onChange={(e) => setObservedImprovements(e.target.value)}
                        placeholder="Descreva as melhoras que você observou no paciente..."
                        rows={3}
                        className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-[13px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] font-medium text-slate-200 mb-1.5">
                        ⚙️ Ajustes Realizados na Dieta:
                      </label>
                      <Textarea
                        value={dietAdjustments}
                        onChange={(e) => setDietAdjustments(e.target.value)}
                        placeholder="Descreva os ajustes que você fez na dieta..."
                        rows={3}
                        className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Botão Salvar (mostra antes de gerar feedback) */}
                    {!generatedFeedback && (
                      <Button
                        onClick={handleSaveAnnotations}
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleGenerateFeedback}
                      disabled={isGenerating || !activeTemplate}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <MessageSquare className="h-3 w-3 mr-1" />
                      )}
                      {isGenerating ? 'Gerando...' : 'Gerar Feedback'}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          title="Ajustar dieta do paciente"
                        >
                          <Utensils className="h-3 w-3 mr-1" />
                          Ajuste Dieta
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem
                          onClick={() => setShowDietAdjustmentModal(true)}
                          className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700 focus:text-white cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-2 text-blue-400" />
                          Ajuste pela IA
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowManualDietModal(true)}
                          className="text-slate-200 hover:bg-slate-700 focus:bg-slate-700 focus:text-white cursor-pointer"
                        >
                          <Utensils className="h-3.5 w-3.5 mr-2 text-emerald-400" />
                          Ajuste Manual
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Gerado */}
              {generatedFeedback && (
                <Card className="bg-slate-800/30 border-slate-700/50">
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200">🤖 Feedback Gerado</h4>
                      <span className="text-[10px] text-slate-400 italic">Você pode editar o feedback antes de enviar</span>
                    </div>

                    <Textarea
                      value={generatedFeedback}
                      onChange={(e) => setGeneratedFeedback(e.target.value)}
                      placeholder="O feedback gerado aparecerá aqui..."
                      rows={20}
                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400 text-xs font-mono whitespace-pre-wrap"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={handleSaveAnnotations}
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 mr-1" />
                            Salvar
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={handleCopyFeedback}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>

                      <Button
                        onClick={handleCopyPhone}
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                        title={`Copiar telefone: ${checkin.telefone || checkin.patient?.telefone || ''}`}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {checkin.telefone || checkin.patient?.telefone || 'Telefone'}
                      </Button>

                      <Button
                        onClick={handleOpenWhatsApp}
                        variant="outline"
                        size="sm"
                        className="bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        WhatsApp
                      </Button>

                      <Button
                        onClick={handleMarkAsSent}
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Marcar Enviado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualizador de Fotos */}
      <CheckinPhotosViewer
        checkinId={selectedHistoricCheckinId || checkin.id}
        telefone={checkin.telefone}
        checkinDate={checkin.data_checkin || checkin.data_preenchimento?.split('T')[0] || new Date().toISOString().split('T')[0]}
        open={showPhotosViewer}
        onOpenChange={(open) => {
          setShowPhotosViewer(open);
          if (!open) {
            setPhotoViewerSource('all'); // Reset ao fechar
            setSelectedHistoricCheckinId(null); // Limpar o check-in histórico selecionado
          }
        }}
        photoSource={photoViewerSource}
        previousCheckinId={previousCheckinId}
        onAddInitialPhotos={() => setShowInitialDataModal(true)}
      />

      {/* Modal de Comparação de Fotos */}
      <PhotoComparisonModal
        checkinId={selectedHistoricCheckinId || checkin.id}
        telefone={checkin.telefone}
        checkinDate={checkin.data_checkin || checkin.data_preenchimento || new Date()}
        open={showPhotoComparison}
        onOpenChange={(open) => {
          setShowPhotoComparison(open);
          if (!open) {
            // Limpar o check-in histórico selecionado quando fechar o modal
            setSelectedHistoricCheckinId(null);
          }
        }}
        previousCheckinId={previousCheckinId}
      />

      {/* Modal para adicionar fotos iniciais */}
      {patientData && (
        <InitialDataInput
          telefone={checkin.telefone}
          nome={patientData?.nome || checkin.patient?.nome || checkin.nome || 'Paciente'}
          open={showInitialDataModal}
          onOpenChange={setShowInitialDataModal}
          onSuccess={() => {
            setShowInitialDataModal(false);
            // Recarregar dados para atualizar o estado de hasInitialPhotos
            const checkInitialPhotos = async () => {
              try {
                const { data: patient } = await supabase
                  .from('patients')
                  .select('foto_inicial_frente, foto_inicial_lado, foto_inicial_lado_2, foto_inicial_costas, nome')
                  .eq('telefone', checkin.telefone)
                  .single();

                if (patient) {
                  setPatientData(patient);
                  const hasPhotos = !!(patient.foto_inicial_frente || patient.foto_inicial_lado || patient.foto_inicial_lado_2 || patient.foto_inicial_costas);
                  setHasInitialPhotos(hasPhotos);
                }
              } catch (error) {
                console.error('Erro ao verificar fotos iniciais:', error);
              }
            };
            checkInitialPhotos();
            refreshData();
            onUpdate?.();
          }}
          editMode={hasInitialPhotos}
        />
      )}

      {/* Modal de Bioimpedância */}
      <BioimpedanciaModal
        open={showBioimpedanciaModal}
        onOpenChange={setShowBioimpedanciaModal}
        telefone={checkin.telefone}
        patientName={checkin.patient?.nome || checkin.nome || 'Paciente'}
      />

      {/* Modal de Ajuste de Dieta IA */}
      <DietAdjustmentModal
        open={showDietAdjustmentModal}
        onOpenChange={setShowDietAdjustmentModal}
        checkinId={checkin.id}
        patientId={patientId || ''}
        checkinData={checkin}
        evolutionData={evolutionData}
        patientName={checkin.patient?.nome || checkin.nome || 'Paciente'}
        patientPhone={checkin.telefone || checkin.patient?.telefone}
        onAdjustmentComplete={() => {
          refreshData();
          onUpdate?.();
        }}
      />

      {/* Modal de Ajuste Manual de Dieta */}
      <ManualDietAdjustmentModal
        open={showManualDietModal}
        onOpenChange={setShowManualDietModal}
        patientId={patientId || ''}
        checkinData={checkin}
        patientName={checkin.patient?.nome || checkin.nome || 'Paciente'}
        onComplete={() => {
          refreshData();
          onUpdate?.();
        }}
      />
    </div>
  );
};

// Memoizar o componente para evitar re-renders desnecessários
export const CheckinFeedbackCard = React.memo(CheckinFeedbackCardComponent, (prevProps, nextProps) => {
  // Se expanded mudou, deve re-renderizar
  if (prevProps.expanded !== nextProps.expanded) {
    return false;
  }

  // Só pular render se checkin.id e totalCheckins forem iguais E expanded não mudou
  return prevProps.checkin.id === nextProps.checkin.id &&
    prevProps.totalCheckins === nextProps.totalCheckins;
});

