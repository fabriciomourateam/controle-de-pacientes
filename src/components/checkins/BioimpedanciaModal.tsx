import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
import { EvolutionExportPage } from '../evolution/EvolutionExportPage';
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
  data_fotos_iniciais: string | null;
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
  const [bioFormData, setBioFormData] = useState({
    peso: '',
    altura: '',
    idade: '',
    sexo: '',
    textoGPT: ''
  });
  const [savingBio, setSavingBio] = useState(false);
  
  // Estados para exportação (mesmos da PatientEvolution)
  const [showEvolutionExport, setShowEvolutionExport] = useState(false);
  const [evolutionExportMode, setEvolutionExportMode] = useState<'png' | 'pdf' | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [bodyCompositions, setBodyCompositions] = useState<any[]>([]);
  
  // Ref para evitar múltiplas execuções do download
  const isExportingRef = useRef(false);

  // Calcular idade a partir da data de nascimento
  const calcularIdade = (dataNascimento: string | null): number | null => {
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

  // Pré-preencher formulário quando abrir o modal de adicionar bio
  useEffect(() => {
    if (showAddBio && patientData) {
      setBioFormData({
        peso: checkins.length > 0 && checkins[0]?.peso ? checkins[0].peso : (patientData.peso_inicial?.toString() || ''),
        altura: patientData.altura_inicial?.toString() || '',
        idade: patientData.idade?.toString() || '',
        sexo: patientData.sexo || '',
        textoGPT: ''
      });
    }
  }, [showAddBio, patientData, checkins]);

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && telefone) {
      loadPatientData();
    }
  }, [open, telefone]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // Usar a mesma query da página de evolução para obter todos os dados
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', telefone)
        .single();

      if (patientError) throw patientError;

      // Calcular idade a partir da data de nascimento se disponível
      const idade = patient.data_nascimento ? calcularIdade(patient.data_nascimento) : null;
      
      setPatientData({ 
        nome: patient.nome,
        created_at: patient.created_at,
        idade, 
        altura_inicial: (patient as any).altura_inicial || null,
        peso_inicial: (patient as any).peso_inicial || null,
        sexo: patient.genero || null,
        data_fotos_iniciais: (patient as any).data_fotos_iniciais || null
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

      // Buscar todas as bioimpedâncias para exportação
      const { data: allBioData, error: allBioError } = await supabase
        .from('body_composition' as any)
        .select('*')
        .eq('telefone', telefone)
        .order('data_avaliacao', { ascending: false });

      if (allBioError && allBioError.code !== 'PGRST116') {
        console.error('Erro ao buscar todas bioimpedâncias:', allBioError);
      } else if (allBioData) {
        setBodyCompositions(allBioData as any);
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
    if (!patientData) return '';

    // Usar peso_inicial do paciente primeiro, depois peso do primeiro check-in como fallback
    const pesoInicial = patientData.peso_inicial 
      ? parseFloat(patientData.peso_inicial.toString())
      : (checkins.length > 0 && checkins[checkins.length - 1]?.peso 
          ? parseFloat(checkins[checkins.length - 1].peso) 
          : 0);
    
    const pesoAtual = checkins.length > 0 && checkins[0]?.peso ? parseFloat(checkins[0].peso) : 0;
    const variacao = pesoAtual - pesoInicial;
    const variacaoTexto = variacao > 0 ? `+${variacao.toFixed(1)}kg Ganho de peso` : `${variacao.toFixed(1)}kg Perda de peso`;

    // Data do peso inicial (usar data_fotos_iniciais se peso_inicial existe, senão data do primeiro check-in)
    const dataInicial = patientData.peso_inicial 
      ? (patientData.data_fotos_iniciais 
          ? format(new Date(patientData.data_fotos_iniciais), 'dd \'de\' MMM', { locale: ptBR })
          : format(new Date(patientData.created_at), 'dd \'de\' MMM', { locale: ptBR }))
      : (checkins.length > 0 && checkins[checkins.length - 1]?.peso 
          ? format(new Date(checkins[checkins.length - 1].data_checkin), 'dd \'de\' MMM', { locale: ptBR })
          : 'Data não disponível');

    // Data do peso atual
    const dataAtual = checkins.length > 0 && checkins[0]?.data_checkin
      ? format(new Date(checkins[0].data_checkin), 'dd \'de\' MMM \'de\' yyyy', { locale: ptBR })
      : 'Hoje';

    const texto = `Dados do paciente:
Check-ins Realizados: ${checkins.length}
Idade: ${patientData.idade || 'Não informado'}
Altura: ${patientData.altura_inicial ? `${patientData.altura_inicial}m` : 'Não informado'}
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

  const handleSaveBioimpedancia = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bioFormData.peso || !bioFormData.altura || !bioFormData.idade || !bioFormData.sexo || !bioFormData.textoGPT) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Todos os campos são necessários para salvar a bioimpedância',
        variant: 'destructive'
      });
      return;
    }

    setSavingBio(true);
    try {
      // Parse do texto do GPT (implementação simplificada)
      const percentualGorduraMatch = bioFormData.textoGPT.match(/(\d+[,.]?\d*)%/);
      const classificacaoMatch = bioFormData.textoGPT.match(/Classificação.*?:\s*(.+?)(?:\n|$)/i);
      
      if (!percentualGorduraMatch) {
        throw new Error('Formato inválido: % de Gordura não encontrado no texto');
      }

      const percentualGordura = parseFloat(percentualGorduraMatch[1].replace(',', '.'));
      const classificacao = classificacaoMatch ? classificacaoMatch[1].trim() : null;
      const peso = parseFloat(bioFormData.peso);
      const alturaNum = parseFloat(bioFormData.altura);
      const idadeNum = parseInt(bioFormData.idade);

      // Cálculos básicos (você pode importar as funções de cálculo se necessário)
      const imc = peso / (alturaNum * alturaNum);
      const massaGorda = (peso * percentualGordura) / 100;
      const massaMagra = peso - massaGorda;
      
      // TMB simplificado
      const tmb = bioFormData.sexo === 'M' 
        ? Math.round(10 * peso + 6.25 * (alturaNum * 100) - 5 * idadeNum + 5)
        : Math.round(10 * peso + 6.25 * (alturaNum * 100) - 5 * idadeNum - 161);

      // Salvar no banco
      const { error } = await supabase
        .from('body_composition' as any)
        .insert({
          telefone,
          data_avaliacao: new Date().toISOString().split('T')[0],
          percentual_gordura: percentualGordura,
          peso,
          massa_gorda: massaGorda,
          massa_magra: massaMagra,
          imc: parseFloat(imc.toFixed(2)),
          tmb,
          classificacao,
          observacoes: bioFormData.textoGPT
        });

      if (error) throw error;

      toast({
        title: 'Bioimpedância salva! ✅',
        description: `${percentualGordura}% BF | IMC: ${imc.toFixed(2)} | TMB: ${tmb} kcal`,
      });

      setShowAddBio(false);
      setBioFormData({
        peso: '',
        altura: '',
        idade: '',
        sexo: '',
        textoGPT: ''
      });
      
      // Recarregar dados
      loadPatientData();
      
    } catch (error: any) {
      console.error('Erro ao salvar bioimpedância:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Verifique o formato dos dados',
        variant: 'destructive'
      });
    } finally {
      setSavingBio(false);
    }
  };

  const handleBioimpedanciaSuccess = () => {
    setShowAddBio(false);
    loadPatientData(); // Recarregar dados
  };

  // Função de exportação (mesma da PatientEvolution)
  const handleExport = async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!patientData) return;
    
    // Usar o mesmo componente de exportação do portal
    setEvolutionExportMode(format === 'jpeg' ? 'png' : format);
    setShowEvolutionExport(true);
  };

  // Callback quando a exportação direta é concluída (mesma da PatientEvolution)
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

      const html2canvas = (await import('html2canvas')).default;
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
        link.download = `evolucao-${patientName?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.png`;
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
        pdf.save(`evolucao-${patientName?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
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

            <Button
              onClick={() => handleExport('png')}
              disabled={generatingPDF}
              className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
            >
              <Download className="w-4 h-4" />
              {generatingPDF ? 'Gerando...' : 'Baixar Evolução'}
            </Button>
          </div>

          {/* Formulário de Bioimpedância Integrado */}
          {showAddBio && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Adicionar Análise de Bioimpedância
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 mb-4">
                  <p className="text-sm text-slate-300 mb-2">
                    📋 <strong>Paciente:</strong> {patientName}
                  </p>
                  <p className="text-xs text-slate-400">
                    💡 Use o botão "Abrir InShape GPT" para obter a análise e cole a resposta abaixo
                  </p>
                </div>

                <form onSubmit={handleSaveBioimpedancia} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-300 text-sm font-medium">
                        Peso (kg) *
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="75.5"
                        value={bioFormData.peso}
                        onChange={(e) => setBioFormData({...bioFormData, peso: e.target.value})}
                        required
                        className="bg-slate-800 border-slate-600 text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-300 text-sm font-medium">
                        Altura (m) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.75"
                        value={bioFormData.altura}
                        onChange={(e) => setBioFormData({...bioFormData, altura: e.target.value})}
                        required
                        className="bg-slate-800 border-slate-600 text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-slate-300 text-sm font-medium">
                        Idade (anos) *
                      </label>
                      <Input
                        type="number"
                        placeholder="25"
                        value={bioFormData.idade}
                        onChange={(e) => setBioFormData({...bioFormData, idade: e.target.value})}
                        required
                        className="bg-slate-800 border-slate-600 text-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-slate-300 text-sm font-medium">
                        Sexo *
                      </label>
                      <select
                        value={bioFormData.sexo}
                        onChange={(e) => setBioFormData({...bioFormData, sexo: e.target.value})}
                        required
                        className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-medium">
                      Resposta do GPT InShape *
                    </label>
                    <Textarea
                      placeholder="📆 Data: 21/10/2025
🧍 Percentual de Gordura Estimado: 18,5%
🏅 Classificação do Shape: Percentual de gordura mediano"
                      rows={6}
                      value={bioFormData.textoGPT}
                      onChange={(e) => setBioFormData({...bioFormData, textoGPT: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-600 text-slate-200 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Cole aqui o texto completo retornado pelo GPT InShape
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddBio(false)}
                      className="border-slate-600 text-slate-300"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingBio}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {savingBio ? 'Salvando...' : 'Salvar Bioimpedância'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Dados do Paciente */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Dados do Paciente
              </CardTitle>
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
                  <p className="text-lg font-bold text-white">
                    {patientData.altura_inicial ? `${patientData.altura_inicial}m` : 'N/A'}
                  </p>
                </div>

                {/* Peso Inicial */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Weight className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300">Peso Inicial</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {patientData.peso_inicial 
                      ? `${parseFloat(patientData.peso_inicial.toString()).toFixed(1)}kg`
                      : (checkins.length > 0 && checkins[checkins.length - 1]?.peso 
                          ? `${parseFloat(checkins[checkins.length - 1].peso).toFixed(1)}kg`
                          : 'N/A')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {patientData.peso_inicial 
                      ? (patientData.data_fotos_iniciais 
                          ? format(new Date(patientData.data_fotos_iniciais), 'dd \'de\' MMM', { locale: ptBR })
                          : format(new Date(patientData.created_at), 'dd \'de\' MMM', { locale: ptBR }))
                      : (checkins.length > 0 && checkins[checkins.length - 1]?.peso 
                          ? format(new Date(checkins[checkins.length - 1].data_checkin), 'dd \'de\' MMM', { locale: ptBR })
                          : 'Data não disponível')}
                  </p>
                </div>

                {/* Peso Atual */}
                {checkins.length > 0 && checkins[0]?.peso && (
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
                {checkins.length > 0 && checkins[0]?.peso && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-300">Variação</span>
                    </div>
                    {(() => {
                      // Usar peso_inicial do paciente primeiro, depois peso do último check-in como fallback
                      const pesoInicial = patientData.peso_inicial 
                        ? parseFloat(patientData.peso_inicial.toString())
                        : (checkins.length > 1 && checkins[checkins.length - 1]?.peso 
                            ? parseFloat(checkins[checkins.length - 1].peso)
                            : parseFloat(checkins[0].peso));
                      
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
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Composição Corporal Atual
                </CardTitle>
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

        {/* Modal de Exportação da Evolução (mesmo da PatientEvolution) */}
        {showEvolutionExport && patientData && (
          <EvolutionExportPage
            patient={{
              ...patientData,
              telefone,
              id: telefone, // usar telefone como ID temporário
              apelido: patientName,
              plano: null,
              objetivo: null,
              genero: patientData.sexo,
              data_nascimento: null,
              inicio_acompanhamento: patientData.created_at,
              vencimento: null,
              dias_para_vencer: null,
              valor: null,
              ticket_medio: null,
              rescisao_30_percent: null,
              pagamento: null,
              observacao: null,
              indicacoes: null,
              lembrete: null,
              telefone_filtro: null,
              antes_depois: null,
              janeiro: null,
              fevereiro: null,
              marco: null,
              abril: null,
              maio: null,
              junho: null,
              julho: null,
              agosto: null,
              setembro: null,
              outubro: null,
              novembro: null,
              dezembro: null,
              updated_at: null,
              cpf: null,
              email: null,
              tempo_acompanhamento: null
            } as any}
            checkins={checkins.map(c => ({
              ...c,
              telefone,
              data_preenchimento: c.data_preenchimento || c.data_checkin,
              total_pontuacao: '0',
              aproveitamento: null,
              treinos_semana: null,
              tempo_treino: null,
              cardio_semana: null,
              tempo_cardio: null,
              descanso_series: null,
              agua_copos: null,
              sono_horas: null,
              refeicoes_livres: null,
              beliscos: null,
              observacoes: null,
              foto_1: null,
              foto_2: null,
              foto_3: null,
              foto_4: null,
              created_at: c.data_checkin,
              updated_at: null,
              user_id: null
            } as any))}
            bodyCompositions={bodyCompositions}
            onClose={() => { 
              setShowEvolutionExport(false); 
              setEvolutionExportMode(null); 
            }}
            directExportMode={evolutionExportMode || undefined}
            onDirectExport={handleDirectEvolutionExport}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}