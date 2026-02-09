import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PatientForm } from "@/components/forms/PatientForm";
import { AutoSyncManager } from "@/components/auto-sync/AutoSyncManager";
import { InteractiveChart } from "./InteractiveChart";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  ArrowRight,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Send,
  RefreshCw,
  Save,
  Plus,
  FileText,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Pencil,
  ClipboardList,
  MessageSquarePlus
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useDashboardMetrics, useChartData, useExpiringPatients, useRecentFeedbacks } from "@/hooks/use-supabase-data";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCheckinsWithPatient } from "@/hooks/use-checkin-data";
import { CheckinDetailsModal } from "@/components/modals/CheckinDetailsModal";
import type { CheckinWithPatient } from "@/lib/checkin-service";
import { userPreferencesService } from "@/lib/user-preferences-service";

// Interface para templates de renovação
interface RenewalTemplate {
  id: string;
  title: string;
  message: string;
}

export function DashboardOverview() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [filterThisMonth, setFilterThisMonth] = useState(false);
  const { data: metricsData, isLoading: metricsLoading } = useDashboardMetrics(filterThisMonth);
  const { data: chartData, isLoading: chartLoading } = useChartData(filterThisMonth);
  const { data: expiringPatients = [], isLoading: expiringLoading } = useExpiringPatients();
  const { data: recentCheckinsFromHook = [], isLoading: checkinsLoadingFromHook } = useRecentFeedbacks();
  const { data: recentCheckins = [], isLoading: checkinsLoading } = useCheckinsWithPatient();

  const metrics = metricsData || {
    totalPatients: 0,
    activePatients: 0,
    expiringPatients: 0,
    pendingFeedbacks: 0,
    avgOverallScore: '0.0'
  };
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinWithPatient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);

  // Estados para modal de renovação
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [renewalMessage, setRenewalMessage] = useState("");
  const [isSendingRenewal, setIsSendingRenewal] = useState(false);
  const [sentRenewals, setSentRenewals] = useState<Set<string>>(new Set());
  const [isLoadingRenewals, setIsLoadingRenewals] = useState(true);
  const [hideSentRenewals, setHideSentRenewals] = useState(true);

  // Estados para múltiplos templates de renovação
  const [renewalTemplates, setRenewalTemplates] = useState<RenewalTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  const { monthlyData, planDistribution } = chartData || { monthlyData: [], planDistribution: [] };

  // Garantir que os dados sejam arrays válidos
  const safeMonthlyData = Array.isArray(monthlyData) ? monthlyData : [];
  const safePlanDistribution = Array.isArray(planDistribution) ? planDistribution : [];

  // Carregar dados de renovação do banco ao montar o componente
  useEffect(() => {
    const loadRenewalData = async () => {
      try {
        setIsLoadingRenewals(true);
        const preferences = await userPreferencesService.getUserPreferences();

        console.log('📋 [DashboardOverview] Preferências carregadas:', {
          hasPreferences: !!preferences,
          hasFilters: !!preferences?.filters,
          filtersKeys: preferences?.filters ? Object.keys(preferences.filters) : [],
          sent_renewals: preferences?.filters?.sent_renewals,
          sent_renewals_count: preferences?.filters?.sent_renewals?.length || 0
        });

        if (preferences?.filters) {
          // Carregar lista de renovações enviadas
          if (preferences.filters.sent_renewals) {
            const renewalsArray = Array.isArray(preferences.filters.sent_renewals)
              ? preferences.filters.sent_renewals
              : [];
            console.log('✅ [DashboardOverview] Carregando renovações enviadas:', {
              arrayLength: renewalsArray.length,
              renewals: renewalsArray
            });
            setSentRenewals(new Set(renewalsArray));
          } else {
            console.log('⚠️ [DashboardOverview] Nenhuma renovação enviada encontrada em preferences.filters.sent_renewals');
          }

          // Carregar templates de renovação (várias chaves possíveis nas preferências)
          const rawTemplates = preferences.filters.renewal_templates
            ?? preferences.filters.renewal_message_templates
            ?? preferences.filters.message_templates;
          let templates: RenewalTemplate[] = [];
          if (rawTemplates && Array.isArray(rawTemplates)) {
            templates = rawTemplates.map((t: any) => ({
              id: t.id || crypto.randomUUID(),
              title: (t.title ?? t.name ?? 'Sem título').toString().trim(),
              message: (t.message ?? t.content ?? '').toString().trim()
            })).filter((t: RenewalTemplate) => t.message || t.title !== 'Sem título');
          }
          // Fallback: procurar em TODAS as chaves de filters que tenham array de objetos com title/message e mesclar
          if (templates.length === 0 && preferences.filters && typeof preferences.filters === 'object') {
            const seen = new Set<string>();
            for (const key of Object.keys(preferences.filters)) {
              const val = (preferences.filters as any)[key];
              if (!Array.isArray(val) || val.length === 0) continue;
              const maybeTemplates = val.filter((x: any) => x && typeof x === 'object' && ((x.message ?? x.content ?? x.body ?? x.text ?? '') || (x.title ?? x.name ?? '')));
              for (const t of maybeTemplates) {
                const title = (t.title ?? t.name ?? 'Sem título').toString().trim();
                const message = (t.message ?? t.content ?? t.body ?? t.text ?? '').toString().trim();
                const key = `${title}|${message}`;
                if (seen.has(key)) continue;
                seen.add(key);
                templates.push({
                  id: t.id || crypto.randomUUID(),
                  title: title || 'Sem título',
                  message
                });
              }
            }
          }
          if (templates.length > 0) setRenewalTemplates(templates);

          // Migrar template antigo para novo formato se existir
          if (preferences.filters.renewal_message_template &&
            (!preferences.filters.renewal_templates || preferences.filters.renewal_templates.length === 0)) {
            const legacyTemplate: RenewalTemplate = {
              id: crypto.randomUUID(),
              title: "Mensagem Padrão",
              message: preferences.filters.renewal_message_template
            };
            setRenewalTemplates([legacyTemplate]);
            // Salvar migração
            await saveRenewalTemplates([legacyTemplate]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de renovação:', error);
      } finally {
        setIsLoadingRenewals(false);
      }
    };

    loadRenewalData();
  }, []);

  // Salvar lista de renovações enviadas no banco
  const saveSentRenewals = async (renewals: Set<string>) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences();
      const currentFilters = preferences?.filters || {};

      await userPreferencesService.upsertUserPreferences({
        filters: {
          ...currentFilters,
          sent_renewals: Array.from(renewals)
        }
      });
    } catch (error) {
      console.error('Erro ao salvar renovações enviadas:', error);
    }
  };

  // Salvar templates de renovação no banco
  const saveRenewalTemplates = async (templates: RenewalTemplate[]) => {
    try {
      const preferences = await userPreferencesService.getUserPreferences();
      const currentFilters = preferences?.filters || {};

      await userPreferencesService.upsertUserPreferences({
        filters: {
          ...currentFilters,
          renewal_templates: templates
        }
      });
    } catch (error) {
      console.error('Erro ao salvar templates de renovação:', error);
    }
  };

  // Salvar nova mensagem como template
  const handleSaveNewTemplate = async () => {
    if (!renewalMessage.trim()) {
      toast({
        title: "Erro",
        description: "A mensagem não pode estar vazia.",
        variant: "destructive",
      });
      return;
    }

    if (!newTemplateTitle.trim()) {
      toast({
        title: "Erro",
        description: "Digite um título para o template.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Salvar template no banco (usando placeholder {nome} para o primeiro nome)
      const firstName = selectedPatient?.nome?.split(' ')[0] || '{nome}';
      const template = renewalMessage.replace(new RegExp(firstName, 'gi'), '{nome}');

      const newTemplate: RenewalTemplate = {
        id: crypto.randomUUID(),
        title: newTemplateTitle.trim(),
        message: template
      };

      const updatedTemplates = [...renewalTemplates, newTemplate];
      setRenewalTemplates(updatedTemplates);
      await saveRenewalTemplates(updatedTemplates);

      // Limpar campos e fechar seção
      setNewTemplateTitle("");
      setShowSaveTemplate(false);
      setSelectedTemplateId(newTemplate.id);

      toast({
        title: "Sucesso",
        description: `Template "${newTemplate.title}" salvo com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o template. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Editar template (abre o formulário de edição com título e mensagem atuais)
  const handleStartEditTemplate = (templateId: string) => {
    const template = renewalTemplates.find(t => t.id === templateId);
    if (!template) return;
    setEditingTemplateId(templateId);
    setNewTemplateTitle(template.title);
    const firstName = selectedPatient?.nome?.split(' ')[0] || 'amigo';
    setRenewalMessage(template.message.replace(/\{nome\}/g, firstName));
  };

  // Salvar alterações no template em edição
  const handleSaveEditTemplate = async () => {
    if (!editingTemplateId || !newTemplateTitle.trim() || !renewalMessage.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o título e a mensagem.",
        variant: "destructive",
      });
      return;
    }
    const firstName = selectedPatient?.nome?.split(' ')[0] || '{nome}';
    const messageToSave = renewalMessage.replace(new RegExp(firstName, 'gi'), '{nome}');
    try {
      const updatedTemplates = renewalTemplates.map(t =>
        t.id === editingTemplateId
          ? { ...t, title: newTemplateTitle.trim(), message: messageToSave }
          : t
      );
      setRenewalTemplates(updatedTemplates);
      await saveRenewalTemplates(updatedTemplates);
      setEditingTemplateId(null);
      setNewTemplateTitle("");
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o template.",
        variant: "destructive",
      });
    }
  };

  // Deletar template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const updatedTemplates = renewalTemplates.filter(t => t.id !== templateId);
      setRenewalTemplates(updatedTemplates);
      await saveRenewalTemplates(updatedTemplates);

      if (selectedTemplateId === templateId) {
        setSelectedTemplateId("");
      }

      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
    }
  };

  // Selecionar template
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);

    if (templateId === "new") {
      // Carregar mensagem padrão para novo template
      getDefaultRenewalMessage(selectedPatient?.nome || '').then(setRenewalMessage);
      return;
    }

    const template = renewalTemplates.find(t => t.id === templateId);
    if (template) {
      const firstName = selectedPatient?.nome?.split(' ')[0] || 'amigo';
      const message = template.message.replace(/\{nome\}/g, firstName);
      setRenewalMessage(message);
    }
  };

  // Função para obter mensagem padrão (do banco ou padrão do código)
  const getDefaultRenewalMessage = async (patientName: string): Promise<string> => {
    const firstName = patientName?.split(' ')[0] || 'amigo';

    try {
      const preferences = await userPreferencesService.getUserPreferences();

      // Tentar carregar do banco
      if (preferences?.filters?.renewal_message_template) {
        const template = preferences.filters.renewal_message_template;
        // Substituir placeholder do nome se existir
        return template.replace(/\{nome\}/g, firstName);
      }
    } catch (error) {
      console.error('Erro ao carregar template do banco:', error);
    }

    // Mensagem padrão do código
    return `Falaaa ${firstName}, como vc ta?

Passando pra avisar que *completamos nosso período de acompanhamento* e, primeiramente, quero muito te agradecer por toda confiança no que estamos fazendo. 

Seguir tudo 100% é pra poucooooss, pois sei que sempre vai ter algum perrengue pra tirar o foco, seja a correria do dia a dia, imprevistos, enfim.

Mas o simples fato de você ter confiado no meu trabalho já significa muito pra mim.

Tenho certeza que no momento atual há uma experiência muito melhor e diferente de como iniciamos, e isso já é uma vitória gigante!

Gostaria de pedir um favor?
Queria um feedback seu sobre todo esse processo. 
Isso *me ajuda demais* a entender o que funcionou e o que posso melhorar.

Coisa muito rápida mesmo, só clicar no link:
https://chat.shapepro.shop/feedback-

Muito obrigado por tudo, novamente agradeço demais por toda confiança!`;
  };


  // Função para abrir modal de renovação
  const handleOpenRenewalModal = async (patient: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegação ao clicar no botão
    setSelectedPatient(patient);
    setEditingTemplateId(null);

    // Carregar mensagem padrão do banco
    const defaultMessage = await getDefaultRenewalMessage(patient.nome || '');
    setRenewalMessage(defaultMessage);
    setRenewalModalOpen(true);
  };

  // Função para marcar como enviado manualmente (sem enviar mensagem)
  const handleMarkAsSent = async (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir navegação ao clicar no botão

    try {
      // Marcar como enviado e salvar no banco
      const updatedRenewals = new Set(sentRenewals).add(patientId);
      setSentRenewals(updatedRenewals);
      await saveSentRenewals(updatedRenewals);

      toast({
        title: "Sucesso",
        description: "Paciente marcado como enviado!",
      });
    } catch (error) {
      console.error('Erro ao marcar como enviado:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar como enviado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para enviar renovação
  const handleSendRenewal = async () => {
    if (!selectedPatient || !renewalMessage.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha a mensagem de renovação.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingRenewal(true);

    try {
      const response = await fetch('https://n8n.shapepro.shop/webhook/renovar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: selectedPatient.nome || '',
          telefone: selectedPatient.telefone || '',
          mensagem: renewalMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar renovação');
      }

      // Marcar como enviado e salvar no banco
      const updatedRenewals = new Set(sentRenewals).add(selectedPatient.id);
      setSentRenewals(updatedRenewals);
      await saveSentRenewals(updatedRenewals);

      toast({
        title: "Sucesso",
        description: "Mensagem de renovação enviada com sucesso!",
      });

      setRenewalModalOpen(false);
      setSelectedPatient(null);
      setRenewalMessage("");
    } catch (error) {
      console.error('Erro ao enviar renovação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem de renovação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSendingRenewal(false);
    }
  };

  const handleViewCheckin = (checkin: CheckinWithPatient) => {
    setSelectedCheckin(checkin);
    setIsModalOpen(true);
  };

  const handlePatientClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  // Função para criar novo paciente
  const handleCreatePatient = async (patientData: any) => {
    try {
      // A lógica de criação será implementada no PatientForm
      toast({
        title: "Sucesso",
        description: "Paciente criado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o paciente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header com destaque visual melhorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/30">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm">
            Visão geral dos seus pacientes e atividades
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PatientForm
            trigger={
              <Button className="btn-premium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                <Users className="w-4 h-4 mr-2" />
                Novo Paciente
              </Button>
            }
            onSave={handleCreatePatient}
          />
          <Button
            variant="outline"
            onClick={() => {
              if (user?.id) {
                const link = `${window.location.origin}/anamnese/${user.id}`;
                navigator.clipboard.writeText(link);
                toast({ title: 'Link copiado!', description: 'Cole e envie para o paciente preencher a anamnese.' });
              } else {
                navigate('/patients/new-anamnesis');
              }
            }}
            className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 transition-all duration-300"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Nova Anamnese
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (user?.id) {
                const link = `${window.location.origin}/checkin/${user.id}`;
                navigator.clipboard.writeText(link);
                toast({ title: 'Link copiado!', description: 'Cole e envie para o paciente preencher o check-in mensal.' });
              }
            }}
            className="border-blue-500/30 hover:bg-blue-500/10 text-blue-300 hover:text-blue-200 transition-all duration-300"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Link Check-in
          </Button>
          <AutoSyncManager />
        </div>
      </div>

      {/* Métricas Principais com animação escalonada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {metricsLoading ? '...' : metrics.totalPatients}
            </div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% este mês
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-0.5 group" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Pacientes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">
              {metricsLoading ? '...' : metrics.activePatients}
            </div>
            <p className="text-xs text-green-400 flex items-center mt-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativos no sistema
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 group" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Expirando (30 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400 group-hover:scale-105 transition-transform inline-block">
              {metricsLoading ? '...' : metrics.expiringPatients}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Precisam renovação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/20 hover:-translate-y-0.5 group" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Checkins Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-red-400 animate-pulse group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400 group-hover:scale-105 transition-transform inline-block">
              {metricsLoading ? '...' : metrics.pendingFeedbacks}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sem checkin há 30+ dias
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-0.5 group" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">Score Médio</CardTitle>
            <Star className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
              {metricsLoading ? '...' : metrics.avgOverallScore}
            </div>
            <p className="text-xs text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Score dos checkins
            </p>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Interativo de Evolução */}
        <div className="col-span-1 lg:col-span-2 transform transition-all duration-300 hover:scale-[1.01]">
          <InteractiveChart
            data={safeMonthlyData}
            title="Evolução Mensal"
            description="Novos pacientes, % de renovação e % de churn por mês"
            icon={BarChart3}
            iconColor="text-blue-400"
          />
        </div>

        {/* Distribuição de Planos */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Planos</CardTitle>
            <CardDescription className="text-slate-400">
              Pacientes por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              {!safePlanDistribution || safePlanDistribution.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
                  <p>Nenhum dado disponível</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={safePlanDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {safePlanDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '12px',
                        color: '#ffffff !important',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(10px)'
                      }}
                      formatter={(value: any, name: any) => [
                        `${value} pacientes`,
                        name
                      ]}
                      labelStyle={{
                        color: '#ffffff !important',
                        fontWeight: '700',
                        fontSize: '15px'
                      }}
                      itemStyle={{
                        color: '#ffffff !important'
                      }}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.2)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legenda personalizada */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-slate-300">Legenda dos Planos</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLegendMinimized(!isLegendMinimized)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50 p-1 h-auto"
                >
                  {isLegendMinimized ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {!isLegendMinimized && planDistribution && planDistribution.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {planDistribution.map((entry, index) => (
                    <div key={`legend-${entry.name}-${index}`} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-300 truncate">{entry.name}</span>
                      <span className="text-slate-400 ml-auto">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Necessárias */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:border-amber-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  Ação Necessária
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Pacientes vencidos e expirando nos próximos 7 dias
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Label htmlFor="hide-sent-renewals" className="text-sm text-slate-400 cursor-pointer">
                  Ocultar enviados
                </Label>
                <Switch
                  id="hide-sent-renewals"
                  checked={hideSentRenewals}
                  onCheckedChange={setHideSentRenewals}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {expiringLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
                Carregando...
              </div>
            ) : (() => {
              // Filtrar pacientes baseado no filtro de ocultar enviados
              const filteredPatients = hideSentRenewals
                ? expiringPatients.filter(patient => !sentRenewals.has(patient.id))
                : expiringPatients;

              if (filteredPatients.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success" />
                    {hideSentRenewals
                      ? "Nenhuma ação necessária (renovações enviadas ocultas)!"
                      : "Nenhuma ação necessária no momento!"}
                  </div>
                );
              }

              return filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => {
                    if (patient.telefone) {
                      navigate(`/checkins/evolution/${patient.telefone}`);
                    } else {
                      handlePatientClick(patient.id);
                    }
                  }}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/20 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-md hover:shadow-amber-500/10"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-amber-500/20 text-amber-400">
                        {patient.nome?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">{patient.nome || 'Nome não informado'}</p>
                      <p className="text-xs text-slate-400">
                        {patient.plano || 'Plano não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        patient.dias_para_vencer <= 0
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }
                    >
                      {patient.dias_para_vencer === 0
                        ? 'Vencido hoje'
                        : patient.dias_para_vencer < 0
                          ? `${Math.abs(patient.dias_para_vencer)}d atrasado`
                          : `${patient.dias_para_vencer}d restantes`
                      }
                    </Badge>
                    {sentRenewals.has(patient.id) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="bg-emerald-600/60 text-emerald-200 border-emerald-500 hover:bg-emerald-600/60 cursor-not-allowed font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enviado
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600/60 text-blue-200 border-blue-500 hover:bg-blue-600/80 hover:text-blue-100 font-semibold"
                          onClick={(e) => handleOpenRenewalModal(patient, e)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Renovação
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={(e) => handleMarkAsSent(patient.id, e)}
                              className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Marcar como enviado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </CardContent>
        </Card>

        {/* Últimos Checkins */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md border-slate-700/40 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-blue-400" />
              Últimos Checkins
            </CardTitle>
            <CardDescription className="text-slate-400">
              5 checkins mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkinsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 mx-auto mb-2 border-2 border-primary border-t-transparent rounded-full"></div>
                Carregando...
              </div>
            ) : recentCheckins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2" />
                Nenhum checkin encontrado
              </div>
            ) : (
              recentCheckins.slice(0, 5).map((checkin, index) => (
                <div
                  key={checkin.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-700/30 to-slate-800/30 rounded-xl hover:from-slate-600/40 hover:to-slate-700/40 transition-all duration-300 border border-slate-600/30 hover:border-blue-500/40 hover:scale-[1.02] hover:shadow-md hover:shadow-blue-500/10 cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-500/20 text-blue-400">
                        {checkin.patient?.nome?.charAt(0) || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-white">
                        {checkin.patient?.nome || 'Paciente não informado'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {checkin.data_preenchimento ? new Date(checkin.data_preenchimento).toLocaleDateString('pt-BR') :
                          checkin.data_checkin ? new Date(checkin.data_checkin).toLocaleDateString('pt-BR') : 'Data não informada'}
                        {checkin.peso && ` • Peso: ${checkin.peso}kg`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      {checkin.total_pontuacao ? `${checkin.total_pontuacao} pts` : 'N/A'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewCheckin(checkin)}
                      className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>


      </div>

      {/* Modal de Detalhes do Checkin */}
      <CheckinDetailsModal
        checkin={selectedCheckin}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCheckin(null);
        }}
      />

      {/* Modal de Renovação */}
      <Dialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Mensagem de Renovação - {selectedPatient?.nome || 'Paciente'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Escolha um template ou edite a mensagem antes de enviar via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Seletor de Templates */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Template de Mensagem
              </Label>
              <div className="flex gap-2">
                <Select
                  value={selectedTemplateId}
                  onValueChange={handleSelectTemplate}
                >
                  <SelectTrigger className="flex-1 bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione um template..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="new" className="text-white hover:bg-slate-700">
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nova mensagem
                      </span>
                    </SelectItem>
                    {renewalTemplates.map((template) => (
                      <SelectItem
                        key={template.id}
                        value={template.id}
                        className="text-white hover:bg-slate-700"
                      >
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId && selectedTemplateId !== "new" && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStartEditTemplate(selectedTemplateId)}
                      className="border-slate-500/50 text-slate-300 hover:bg-slate-700 hover:text-white"
                      title="Editar template"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      title="Excluir template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Área de Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="renewal-message" className="text-slate-300">
                Mensagem de Renovação
              </Label>
              <Textarea
                id="renewal-message"
                value={renewalMessage}
                onChange={(e) => setRenewalMessage(e.target.value)}
                className="min-h-[250px] bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                placeholder="Digite a mensagem de renovação..."
              />
            </div>

            {/* Seção de Editar Template (quando editingTemplateId está definido) */}
            {editingTemplateId ? (
              <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300 text-sm flex items-center gap-2">
                    <Pencil className="w-4 h-4" />
                    Editar template
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTemplateId(null);
                      setNewTemplateTitle("");
                    }}
                    className="text-slate-400 hover:text-slate-200 h-6 w-6 p-0"
                  >
                    ✕
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTemplateTitle}
                    onChange={(e) => setNewTemplateTitle(e.target.value)}
                    placeholder="Título do template"
                    className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleSaveEditTemplate}
                    disabled={!renewalMessage.trim() || !newTemplateTitle.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar alterações
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Seção de Salvar Template (colapsável) */}
                {!showSaveTemplate ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveTemplate(true)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 w-full justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Salvar como novo template
                  </Button>
                ) : (
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm">Salvar como Template</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowSaveTemplate(false);
                          setNewTemplateTitle("");
                        }}
                        className="text-slate-400 hover:text-slate-200 h-6 w-6 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTemplateTitle}
                        onChange={(e) => setNewTemplateTitle(e.target.value)}
                        placeholder="Título do template (ex: Renovação VIP)"
                        className="flex-1 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleSaveNewTemplate}
                        disabled={!renewalMessage.trim() || !newTemplateTitle.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Info do Paciente */}
            <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-700">
              <p><strong>Paciente:</strong> {selectedPatient?.nome || 'N/A'}</p>
              <p><strong>Telefone:</strong> {selectedPatient?.telefone || 'N/A'}</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRenewalModalOpen(false);
                setSelectedPatient(null);
                setRenewalMessage("");
                setSelectedTemplateId("");
                setShowSaveTemplate(false);
                setNewTemplateTitle("");
                setEditingTemplateId(null);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendRenewal}
              disabled={isSendingRenewal || !renewalMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSendingRenewal ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}