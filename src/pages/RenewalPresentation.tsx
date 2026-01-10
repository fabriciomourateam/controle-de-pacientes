import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useAuthContext } from '@/contexts/AuthContext';
import { RenewalSummary } from '@/components/renewal/RenewalSummary';
import { EditableMotivationalCard } from '@/components/renewal/EditableMotivationalCard';
import { EditableMetricsCard } from '@/components/renewal/EditableMetricsCard';
import { EvolutionAnalysis } from '@/components/renewal/EvolutionAnalysis';
import { NextCycleGoals } from '@/components/renewal/NextCycleGoals';
import { RenewalPhotoComparison } from '@/components/renewal/RenewalPhotoComparison';
import { ShareRenewalButton } from '@/components/renewal/ShareRenewalButton';
import { 
  ArrowLeft, 
  Download, 
  Calendar,
  TrendingUp,
  Target,
  Award,
  Heart,
  Camera
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateRenewalPNG } from '@/lib/renewal-png-generator';

// Cliente Supabase com service role para acesso público aos dados de renovação
const supabaseServiceRole = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

interface Patient {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  data_nascimento?: string;
  created_at: string;
}

interface CheckinData {
  id: string;
  telefone: string;
  data_checkin: string;
  peso: string;
  medida: string;
  foto_1?: string;
  foto_2?: string;
  foto_3?: string;
  foto_4?: string;
  created_at: string;
  data_preenchimento?: string;
}

export default function RenewalPresentation() {
  const { telefone } = useParams<{ telefone: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthContext();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPNG, setGeneratingPNG] = useState(false);
  
  // Detectar se é acesso público baseado na URL
  const isPublicAccess = window.location.pathname.includes('/public/');

  useEffect(() => {
    if (telefone) {
      loadPatientData();
    }
  }, [telefone]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando paciente com telefone:', telefone);
      console.log('🌐 Acesso público:', isPublicAccess);

      // Para acesso público, usar sempre service role
      let patientData = null;
      let patientError = null;

      if (isPublicAccess) {
        console.log('🌐 Acesso público - usando service role...');
        const { data, error } = await supabaseServiceRole
          .from('patients')
          .select('*')
          .eq('telefone', telefone)
          .single();
        
        patientData = data;
        patientError = error;
      } else {
        // Tentar primeiro com usuário autenticado
        if (user) {
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .eq('telefone', telefone)
            .single();
          
          patientData = data;
          patientError = error;
        }

        // Se não conseguir com usuário autenticado, usar service role
        if (!patientData && patientError) {
          console.log('🔄 Tentando com service role...');
          const { data: serviceData, error: serviceError } = await supabaseServiceRole
            .from('patients')
            .select('*')
            .eq('telefone', telefone)
            .single();
          
          patientData = serviceData;
          patientError = serviceError;
        }
      }

      if (patientError || !patientData) {
        console.error('❌ Erro ao buscar paciente:', patientError);
        throw new Error(`Paciente não encontrado para o telefone: ${telefone}`);
      }

      console.log('✅ Paciente encontrado:', patientData.nome);
      setPatient(patientData);

      // Buscar check-ins do paciente usando service role
      console.log('🔍 Buscando check-ins...');
      const { data: serviceRoleCheckins, error: checkinsError } = await supabaseServiceRole
        .from('checkin')
        .select('*')
        .eq('telefone', telefone)
        .order('data_checkin', { ascending: true });

      if (checkinsError) {
        console.error('❌ Erro ao buscar check-ins:', checkinsError);
        setCheckins([]);
      } else {
        console.log('✅ Check-ins encontrados:', serviceRoleCheckins?.length || 0);
        setCheckins(serviceRoleCheckins || []);
      }

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      setError(error.message || 'Erro ao carregar dados do paciente');
      if (!isPublicAccess) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao carregar dados do paciente',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getPatientJourneyTime = () => {
    if (!patient?.created_at) return 'Tempo não disponível';
    
    try {
      return formatDistanceToNow(new Date(patient.created_at), { 
        locale: ptBR,
        addSuffix: false 
      });
    } catch {
      return 'Tempo não disponível';
    }
  };

  const getFirstAndLastCheckin = () => {
    if (checkins.length === 0) return { first: null, last: null };
    
    const sortedCheckins = [...checkins].sort((a, b) => 
      new Date(a.data_checkin || a.created_at).getTime() - 
      new Date(b.data_checkin || b.created_at).getTime()
    );
    
    return {
      first: sortedCheckins[0],
      last: sortedCheckins[sortedCheckins.length - 1]
    };
  };

  if (loading) {
    // Layout diferente para acesso público vs autenticado
    const LoadingContent = (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-96 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );

    return isPublicAccess ? LoadingContent : (
      <DashboardLayout>
        {LoadingContent}
      </DashboardLayout>
    );
  }

  if (error || !patient) {
    const ErrorContent = (
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
              {error || 'Não foi possível carregar os dados do paciente'}
            </p>
            {!isPublicAccess && (
              <Button 
                onClick={() => navigate('/patients')}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Pacientes
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );

    return isPublicAccess ? ErrorContent : (
      <DashboardLayout>
        {ErrorContent}
      </DashboardLayout>
    );
  }

  const { first: firstCheckin, last: lastCheckin } = getFirstAndLastCheckin();
  const journeyTime = getPatientJourneyTime();

  const handleDownloadPNG = async () => {
    if (!patient) return;
    
    try {
      setGeneratingPNG(true);
      await generateRenewalPNG(patient.nome, {
        filename: `relatorio-evolucao-${patient.nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`
      });
    } catch (error) {
      console.error('Erro ao gerar PNG:', error);
      if (!isPublicAccess) {
        toast({
          title: 'Erro',
          description: 'Não foi possível gerar a imagem. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setGeneratingPNG(false);
    }
  };

  // Conteúdo principal da página
  const MainContent = (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header com branding */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-b border-yellow-500/20" data-png-hide>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isPublicAccess && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/checkins/evolution/${telefone}`)}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para Evolução
                  </Button>
                  <div className="h-8 w-px bg-slate-600" />
                </>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Relatório de Evolução
                </h1>
                <p className="text-slate-400 text-sm">
                  {isPublicAccess ? 'Sua evolução personalizada' : 'Apresentação personalizada por Fabricio Moura'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareRenewalButton 
                patient={patient}
                checkins={checkins}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPNG}
                disabled={generatingPNG}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                {generatingPNG ? 'Gerando Imagem...' : 'Baixar Imagem'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8" data-pdf-content>
        {/* Card do Paciente */}
        <Card className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600 mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {patient.nome}
                </h2>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Jornada de {journeyTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{checkins.length} check-ins realizados</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-2">
                  <Award className="w-3 h-3 mr-1" />
                  Evolução 2025
                </Badge>
                <p className="text-sm text-slate-400">
                  Relatório gerado em {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <div className="space-y-8">
          {/* 1. Resumo Geral de Evolução */}
          <RenewalSummary 
            patient={patient}
            checkins={checkins}
            firstCheckin={firstCheckin}
            lastCheckin={lastCheckin}
            journeyTime={journeyTime}
            isPublicAccess={isPublicAccess}
          />

          {/* 2. Layout com Fotos (2/3) + Métricas (1/3) */}
          {checkins.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Fotos - 2/3 da largura */}
                <div className="xl:col-span-2">
                  <RenewalPhotoComparison 
                    firstCheckin={firstCheckin}
                    lastCheckin={lastCheckin}
                    patient={patient}
                    checkins={checkins}
                  />
                </div>
                
                {/* Métricas - 1/3 da largura (cards verticais) */}
                <div className="xl:col-span-1">
                  <EditableMetricsCard 
                    firstCheckin={firstCheckin}
                    lastCheckin={lastCheckin}
                    allCheckins={checkins}
                    isVerticalLayout={true}
                    patient={patient}
                    isPublicAccess={isPublicAccess}
                  />
                </div>
              </div>
              
              {/* Mensagem motivacional abaixo dos cards */}
              <EditableMotivationalCard 
                patient={patient}
                isPublicAccess={isPublicAccess}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Placeholder para fotos */}
              <div className="xl:col-span-2">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600">
                  <CardContent className="pt-6">
                    <div className="text-center py-16">
                      <Camera className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Evolução Fotográfica
                      </h3>
                      <p className="text-slate-400">
                        As fotos de evolução serão exibidas aqui conforme forem sendo registradas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Placeholder para métricas */}
              <div className="xl:col-span-1">
                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <TrendingUp className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Dados de Evolução
                      </h3>
                      <p className="text-slate-400">
                        As métricas de evolução serão exibidas aqui conforme forem sendo registradas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 4. Três Blocos de Análise */}
          {checkins.length > 0 ? (
            <EvolutionAnalysis 
              patient={patient}
              checkins={checkins}
              firstCheckin={firstCheckin}
              lastCheckin={lastCheckin}
              isPublicAccess={isPublicAccess}
            />
          ) : (
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Award className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Análise de Evolução
                  </h3>
                  <p className="text-slate-400">
                    A análise detalhada da evolução será gerada automaticamente com base nos check-ins registrados.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Metas para o Próximo Ciclo */}
          <NextCycleGoals 
            patient={patient}
            checkins={checkins}
            lastCheckin={lastCheckin}
            isPublicAccess={isPublicAccess}
          />
        </div>

        {/* Footer com CTA */}
        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Pronto para o próximo nível? 🚀
                </h3>
                <p className="text-slate-300 mb-6">
                  Sua evolução até aqui foi incrível, mas sei que você tem muito mais potencial. 
                  Vamos juntos conquistar seus próximos objetivos!
                </p>
                <div className="flex items-center justify-center">
                  <Button 
                    size="lg"
                    onClick={() => {
                      const message = encodeURIComponent("Oi Fabricio!!! Quero renovar o acompanhamento!");
                      const whatsappUrl = `https://wa.me/5511914880872?text=${message}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-lg px-8 py-4"
                  >
                    <Target className="w-6 h-6 mr-3" />
                    Renovar Acompanhamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Renderizar com ou sem DashboardLayout baseado no tipo de acesso
  return isPublicAccess ? MainContent : (
    <DashboardLayout>
      {MainContent}
    </DashboardLayout>
  );
}