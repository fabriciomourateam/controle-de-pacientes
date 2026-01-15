import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  TrendingUp, 
  Copy, 
  ExternalLink, 
  Plus, 
  Download,
  Activity,
  Scale,
  Calendar,
  User,
  Ruler,
  Weight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BioimpedanciaInput } from '../evolution/BioimpedanciaInput';
import { EvolutionExporter } from '../evolution/EvolutionExporter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BioimpedanciaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telefone: string;
  patientName: string;
}

interface PatientData {
  nome: string;
  idade: number | null;
  altura_inicial: number | null;
  peso_inicial: number | null;
  sexo: string | null;
  created_at: string;
}

interface CheckinData {
  id: string;
  data_checkin: string;
  peso: string | null;
  data_preenchimento: string | null;
}

interface BioimpedanciaData {
  id: string;
  data_avaliacao: string;
  percentual_gordura: number;
  peso: number;
  massa_gorda: number;
  massa_magra: number;
  imc: number;
  tmb: number;
  classificacao: string | null;
}

export function BioimpedanciaModal({ 
  open, 
  onOpenChange, 
  telefone, 
  patientName 
}: BioimpedanciaModalProps) {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [lastBioimpedancia, setLastBioimpedancia] = useState<BioimpedanciaData | null>(null);
  const [showAddBio, setShowAddBio] = useState(false);

  // Calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento: string | null): number | null => {
    // Por enquanto retornar null já que não temos data_nascimento
    return null;
  };

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && telefone) {
      loadPatientData();
    }
  }, [open, telefone]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Buscar dados do paciente
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select(`
          nome,
          created_at
        `)
        .eq('telefone', telefone)
        .single();

      if (patientError) throw patientError;

      const idade = null; // calcularIdade(patient.data_nascimento);
      setPatientData({ 
        nome: patient.nome,
        created_at: patient.created_at,
        idade, 
        altura_inicial: null, 
        peso_inicial: null,
        sexo: null
      });

      // Buscar check-ins do paciente
      const { data: checkinsData, error: checkinsError } = await supabase
        .from('checkin')
        .select('id, data_checkin, peso, data_preenchimento')
        .eq('telefone', telefone)
        .order('data_checkin', { ascending: false });

      if (checkinsError) throw checkinsError;
      setCheckins(checkinsData || []);

      // Buscar última bioimpedância
      const { data: bioData, error: bioError } = await supabase
        .from('body_composition' as any)
        .select('*')
        .eq('telefone', telefone)
        .order('data_avaliacao', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bioError && bioError.code !== 'PGRST116') {
        console.error('Erro ao buscar bioimpedância:', bioError);
      } else if (bioData) {
        setLastBioimpedancia(bioData as any);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do paciente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar texto para copiar para o InShape GPT
  const generateInShapeText = () => {
    if (!patientData || !checkins.length) return '';

    const pesoInicial = checkins.length > 0 ? parseFloat(checkins[checkins.length - 1].peso || '0') : 0;
    const pesoAtual = checkins.length > 0 ? parseFloat(checkins[0].peso || '0') : 0;
    const variacao = pesoAtual - pesoInicial;
    const variacaoTexto = variacao > 0 ? `+${variacao.toFixed(1)}kg Ganho de peso` : `${variacao.toFixed(1)}kg Perda de peso`;

    // Data do peso inicial
    const dataInicial = format(new Date(patientData.created_at), 'dd \'de\' MMM', { locale: ptBR });

    // Data do peso atual
    const dataAtual = checkins.length > 0 
      ? format(new Date(checkins[0].data_checkin), 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })
      : 'Hoje';

    const texto = `Dados do paciente:
Check-ins Realizados: ${checkins.length}
Idade: Não informado
Altura: Não informado
Peso Inicial: ${pesoInicial.toFixed(1)}kg ${dataInicial}
Peso Atual: ${pesoAtual.toFixed(1)}kg ${dataAtual}
Variação: ${variacaoTexto}`;

    return texto;
  };

  // Gerar texto da bioimpedância para copiar
  const generateBioimpedanciaText = () => {
    if (!lastBioimpedancia) return '';

    const dataAvaliacao = format(new Date(lastBioimpedancia.data_avaliacao), 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR });

    const texto = `Dados da última bioimpedância:
Composição Corporal Atual
Última avaliação: ${dataAvaliacao}
${lastBioimpedancia.percentual_gordura}% % Gordura ${lastBioimpedancia.classificacao || 'Percentual de gordura mediano'}
${lastBioimpedancia.peso} kg Peso Total
${lastBioimpedancia.massa_gorda.toFixed(2)} kg Massa Gorda
${lastBioimpedancia.massa_magra.toFixed(2)} kg Massa Magra
${lastBioimpedancia.imc.toFixed(2)} IMC Peso normal
${lastBioimpedancia.tmb} TMB (kcal/dia)`;

    return texto;
  };

  const handleCopyPatientData = async () => {
    const texto = generateInShapeText();
    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: 'Dados copiados! 📋',
        description: 'Dados do paciente copiados para área de transferência'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar os dados',
        variant: 'destructive'
      });
    }
  };

  const handleCopyBioimpedanciaData = async () => {
    const texto = generateBioimpedanciaText();
    try {
      await navigator.clipboard.writeText(texto);
      toast({
        title: 'Bioimpedância copiada! 📋',
        description: 'Dados da bioimpedância copiados para área de transferência'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar os dados',
        variant: 'destructive'
      });
    }
  };

  const handleCopyAllData = async () => {
    const textoPatient = generateInShapeText();
    const textoBio = generateBioimpedanciaText();
    const textoCompleto = `${textoPatient}\n\n${textoBio}`;
    
    try {
      await navigator.clipboard.writeText(textoCompleto);
      toast({
        title: 'Todos os dados copiados! 📋',
        description: 'Dados completos copiados para área de transferência'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar os dados',
        variant: 'destructive'
      });
    }
  };

  const handleOpenInShape = () => {
    window.open('https://chatgpt.com/g/g-685e0c8b2d8c8191b896dd996cab7537-inshape', '_blank');
  };

  const handleBioimpedanciaSuccess = () => {
    setShowAddBio(false);
    loadPatientData(); // Recarregar dados
  };

  if (!patientData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Bioimpedância - {patientName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto mb-4"></div>
              <p className="text-slate-400">Carregando dados do paciente...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Bioimpedância - {patientName}
          </DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="space-y-6">
          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              onClick={handleOpenInShape}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir InShape GPT
            </Button>

            <Button
              onClick={handleCopyAllData}
              variant="outline"
              className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Copy className="w-4 h-4" />
              Copiar Todos os Dados
            </Button>

            <Button
              onClick={() => setShowAddBio(true)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Adicionar Bioimpedância
            </Button>

            <EvolutionExporter
              containerRef={containerRef}
              patientName={patientName}
            />
          </div>

          {/* Dados do Paciente */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  Dados do Paciente
                </CardTitle>
                <Button
                  onClick={handleCopyPatientData}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-slate-600 text-slate-300"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Check-ins Realizados */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-300">Check-ins</span>
                  </div>
                  <p className="text-lg font-bold text-white">{checkins.length}</p>
                  <p className="text-xs text-slate-400">Realizados</p>
                </div>

                {/* Idade */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-300">Idade</span>
                  </div>
                  <p className="text-lg font-bold text-white">{patientData.idade || 'N/A'}</p>
                  <p className="text-xs text-slate-400">anos</p>
                </div>

                {/* Altura */}
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Ruler className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-300">Altura</span>
                  </div>
                  <p className="text-lg font-bold text-white">N/A</p>
                </div>

                {/* Peso Inicial */}
                {checkins.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Weight className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-300">Peso Inicial</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {parseFloat(checkins[checkins.length - 1].peso || '0').toFixed(1)}kg
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(patientData.created_at), 'dd \'de\' MMM', { locale: ptBR })}
                    </p>
                  </div>
                )}

                {/* Peso Atual */}
                {checkins.length > 0 && checkins[0].peso && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs text-indigo-300">Peso Atual</span>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {parseFloat(checkins[0].peso).toFixed(1)}kg
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(checkins[0].data_checkin), 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}

                {/* Variação */}
                {checkins.length > 1 && checkins[0].peso && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-300">Variação</span>
                    </div>
                    {(() => {
                      const pesoInicial = parseFloat(checkins[checkins.length - 1].peso || '0');
                      const pesoAtual = parseFloat(checkins[0].peso);
                      const variacao = pesoAtual - pesoInicial;
                      const isPositive = variacao > 0;
                      
                      return (
                        <>
                          <p className={`text-lg font-bold ${isPositive ? 'text-red-400' : 'text-emerald-400'}`}>
                            {isPositive ? '+' : ''}{variacao.toFixed(1)}kg
                          </p>
                          <p className="text-xs text-slate-400">
                            {isPositive ? 'Ganho' : 'Perda'} de peso
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dados da Bioimpedância */}
          {lastBioimpedancia && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Composição Corporal Atual
                  </CardTitle>
                  <Button
                    onClick={handleCopyBioimpedanciaData}
                    size="sm"
                    variant="outline"
                    className="gap-2 border-slate-600 text-slate-300"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                </div>
                <p className="text-sm text-slate-400">
                  Última avaliação: {format(new Date(lastBioimpedancia.data_avaliacao), 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* % Gordura */}
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-red-400">{lastBioimpedancia.percentual_gordura}%</p>
                    <p className="text-xs text-red-300">% Gordura</p>
                    <p className="text-xs text-slate-400">{lastBioimpedancia.classificacao || 'Percentual de gordura mediano'}</p>
                  </div>

                  {/* Peso Total */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-400">{lastBioimpedancia.peso} kg</p>
                    <p className="text-xs text-blue-300">Peso Total</p>
                  </div>

                  {/* Massa Gorda */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-orange-400">{lastBioimpedancia.massa_gorda.toFixed(2)} kg</p>
                    <p className="text-xs text-orange-300">Massa Gorda</p>
                  </div>

                  {/* Massa Magra */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-emerald-400">{lastBioimpedancia.massa_magra.toFixed(2)} kg</p>
                    <p className="text-xs text-emerald-300">Massa Magra</p>
                  </div>

                  {/* IMC */}
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-yellow-400">{lastBioimpedancia.imc.toFixed(2)}</p>
                    <p className="text-xs text-yellow-300">IMC</p>
                    <p className="text-xs text-slate-400">Peso normal</p>
                  </div>

                  {/* TMB */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <p className="text-2xl font-bold text-cyan-400">{lastBioimpedancia.tmb}</p>
                    <p className="text-xs text-cyan-300">TMB (kcal/dia)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!lastBioimpedancia && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="py-8">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-4">Nenhuma bioimpedância registrada ainda</p>
                  <Button
                    onClick={() => setShowAddBio(true)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeira Bioimpedância
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Adicionar Bioimpedância */}
        {showAddBio && (
          <div className="fixed inset-0 z-50">
            <BioimpedanciaInput
              telefone={telefone}
              nome={patientName}
              idade={patientData.idade}
              altura={patientData.altura_inicial}
              pesoInicial={patientData.peso_inicial}
              sexo={patientData.sexo}
              onSuccess={handleBioimpedanciaSuccess}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}