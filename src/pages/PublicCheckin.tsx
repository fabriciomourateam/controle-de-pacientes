import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { processPhotoFile } from '@/lib/heic-converter';
import { DEFAULT_CHECKIN_FLOW, FlowStep } from '@/lib/checkin-flow-default';
import { CheckinFlowTheme, DEFAULT_THEME } from '@/lib/checkin-flow-service';
import { calculateCheckinScore } from '@/lib/checkin-scoring';
import { ChatCheckinEngine } from '@/components/checkin-public/ChatCheckinEngine';
import { Loader2, CheckCircle2, Phone, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Cliente com service role para acesso público
const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default function PublicCheckin() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  // Estados de validação
  const [validating, setValidating] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [nutriName, setNutriName] = useState('');

  // Estados do fluxo de telefone
  const [telefone, setTelefone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientFound, setPatientFound] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Estados do check-in
  const [flow, setFlow] = useState<FlowStep[]>(DEFAULT_CHECKIN_FLOW);
  const [theme, setTheme] = useState<CheckinFlowTheme>(DEFAULT_THEME);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validar token
  useEffect(() => {
    async function validate() {
      if (!token) { setInvalidToken(true); setValidating(false); return; }
      try {
        const { data: profile } = await supabasePublic
          .from('profiles')
          .select('id, full_name')
          .eq('id', token)
          .maybeSingle();
        if (!profile) { setInvalidToken(true); }
        else { setUserId(profile.id); setNutriName(profile.full_name || 'Nutricionista'); }
      } catch { setInvalidToken(true); }
      finally { setValidating(false); }
    }
    validate();
  }, [token]);

  // Carregar fluxo customizado (se existir)
  useEffect(() => {
    async function loadFlow() {
      if (!userId) return;
      try {
        const { data } = await supabasePublic
          .from('checkin_flow_config')
          .select('flow, theme, header_image_url')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();
        if (data?.flow && Array.isArray(data.flow) && data.flow.length > 0) {
          // MIGRATION: Force update "medida" step to new multi-input format
          // This ensures existing users with saved flows get the new UI
          // while preserving their custom images/questions
          const patchedFlow = data.flow.map((step: any) => {
            if (step.id === 'medida' && step.type === 'text') {
              const newStep = DEFAULT_CHECKIN_FLOW.find(s => s.id === 'medidas');
              if (newStep) {
                return {
                  ...newStep,
                  imageUrl: step.imageUrl || newStep.imageUrl,
                  imagePosition: step.imagePosition || newStep.imagePosition,
                  question: step.question || newStep.question
                };
              }
            }
            return step;
          });
          setFlow(patchedFlow);
        }
        if (data?.theme) {
          setTheme({ ...DEFAULT_THEME, ...(data.theme as any) });
        }
        if ((data as any)?.header_image_url) {
          setHeaderImage((data as any).header_image_url);
        }
      } catch {
        // Usa fluxo default
      }
    }
    loadFlow();
  }, [userId]);

  /**
   * Gera variações do telefone para normalizar a busca.
   * Ex: 5511991418266 -> tenta: original, sem 55, com 55, com/sem 9 após DDD
   */
  const generatePhoneVariations = (phone: string): string[] => {
    const clean = phone.replace(/[^0-9]/g, '');
    const variations = new Set<string>();

    // Original limpo
    variations.add(clean);

    // Com prefixo 55
    if (!clean.startsWith('55')) {
      variations.add('55' + clean);
    }

    // Sem prefixo 55
    if (clean.startsWith('55')) {
      variations.add(clean.substring(2));
    }

    // Variações com/sem o 9 após DDD
    // Se tem 55 + DDD(2) + 9 + 8 dígitos = 13 dígitos -> tentar sem o 9
    if (clean.startsWith('55') && clean.length === 13) {
      const ddd = clean.substring(2, 4);
      const nineAndNumber = clean.substring(4);
      if (nineAndNumber.startsWith('9') && nineAndNumber.length === 9) {
        // Remover o 9: 55 + DDD + 8 dígitos
        variations.add('55' + ddd + nineAndNumber.substring(1));
        // Sem 55: DDD + 9 + número
        variations.add(ddd + nineAndNumber);
        // Sem 55 sem 9: DDD + 8 dígitos
        variations.add(ddd + nineAndNumber.substring(1));
      }
    }

    // Se tem 55 + DDD(2) + 8 dígitos = 12 dígitos -> tentar com o 9
    if (clean.startsWith('55') && clean.length === 12) {
      const ddd = clean.substring(2, 4);
      const number = clean.substring(4);
      if (number.length === 8) {
        // Adicionar o 9: 55 + DDD + 9 + número
        variations.add('55' + ddd + '9' + number);
        // Sem 55: DDD + 9 + número
        variations.add(ddd + '9' + number);
        // Sem 55 sem 9
        variations.add(ddd + number);
      }
    }

    // Se NÃO tem 55 e tem DDD(2) + 9 + 8 dígitos = 11 dígitos
    if (!clean.startsWith('55') && clean.length === 11) {
      const ddd = clean.substring(0, 2);
      const nineAndNumber = clean.substring(2);
      if (nineAndNumber.startsWith('9')) {
        // Com 55
        variations.add('55' + clean);
        // Sem 9
        variations.add(ddd + nineAndNumber.substring(1));
        variations.add('55' + ddd + nineAndNumber.substring(1));
      }
    }

    // Se NÃO tem 55 e tem DDD(2) + 8 dígitos = 10 dígitos
    if (!clean.startsWith('55') && clean.length === 10) {
      const ddd = clean.substring(0, 2);
      const number = clean.substring(2);
      // Com 9
      variations.add(ddd + '9' + number);
      variations.add('55' + ddd + '9' + number);
      variations.add('55' + clean);
    }

    return Array.from(variations);
  };

  // Buscar paciente pelo telefone (com normalização)
  const handleSearchPatient = async () => {
    if (!telefone.trim()) return;
    setSearchingPatient(true);
    setPhoneError('');

    const cleanPhone = telefone.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    const variations = generatePhoneVariations(cleanPhone);

    try {
      // Buscar paciente tentando todas as variações
      const orFilter = variations.map(v => `telefone.eq.${v}`).join(',')
        + ',' + variations.map(v => `telefone_filtro.eq.${v}`).join(',');

      const { data: patients, error } = await supabasePublic
        .from('patients')
        .select('id, nome, telefone')
        .or(orFilter)
        .limit(1);

      if (error) throw error;

      const patient = patients?.[0];
      if (patient) {
        setPatientName(patient.nome || 'Paciente');
        setPatientFound(true);
        setTelefone(patient.telefone); // Usa o telefone real do banco
      } else {
        setPhoneError('Telefone não encontrado. Verifique o número e tente novamente.');
      }
    } catch (error: any) {
      setPhoneError('Erro ao buscar. Tente novamente.');
      console.error(error);
    } finally {
      setSearchingPatient(false);
    }
  };

  // Upload de foto
  const uploadPhoto = async (file: File, tel: string, index: number): Promise<string | null> => {
    try {
      const processedFile = await processPhotoFile(file);
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${tel}_checkin_${index}_${Date.now()}.${fileExt}`;
      const { error } = await supabasePublic.storage.from('patient-photos').upload(fileName, processedFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabasePublic.storage.from('patient-photos').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error('Erro upload foto:', error);
      return null;
    }
  };

  // Salvar check-in
  const handleComplete = async (data: Record<string, string>, photos: File[]) => {
    if (!userId) return;
    setLoading(true);

    try {
      const cleanPhone = telefone.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');

      // Upload fotos
      let fotoUrls: (string | null)[] = [null, null, null, null];
      for (let i = 0; i < Math.min(photos.length, 4); i++) {
        fotoUrls[i] = await uploadPhoto(photos[i], cleanPhone, i + 1);
      }

      // Calcular pontuação
      const scores = calculateCheckinScore(data);

      // Montar dados do checkin
      const now = new Date();
      const checkinData: any = {
        telefone: cleanPhone,
        data_checkin: now.toISOString().split('T')[0],
        // mes_ano removido para evitar erro 400
        data_preenchimento: now.toISOString(),
        peso: data.peso || null,
        medida: data.medida || null,
        treino: data.treino || null,
        tempo: data.tempo || null,
        descanso: data.descanso || null,
        cardio: data.cardio || null,
        tempo_cardio: data.tempo_cardio || null,
        ref_livre: data.ref_livre || null,
        oq_comeu_ref_livre: data.oq_comeu_ref_livre || null,
        beliscos: data.beliscos || null,
        oq_beliscou: data.oq_beliscou || null,
        comeu_menos: data.comeu_menos || null,
        fome_algum_horario: data.fome_algum_horario || null,
        alimento_para_incluir: data.alimento_para_incluir || null,
        agua: data.agua || null,
        sono: data.sono || null,
        stress: data.stress || null,
        libido: data.libido || null,
        melhora_visual: data.melhora_visual || null,
        quais_pontos: data.quais_pontos || null,
        objetivo: data.objetivo || null,
        dificuldades: data.dificuldades || null,
        foto_1: fotoUrls[0],
        foto_2: fotoUrls[1],
        foto_3: fotoUrls[2],
        foto_4: fotoUrls[3],
        // Pontuação
        ...scores,
      };

      const { error } = await supabasePublic.from('checkin').insert(checkinData);
      if (error) throw error;

      // Enviar para Webhook (n8n)
      try {
        await fetch('https://n8n.shapepro.shop/webhook/checkin-myshape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...checkinData,
            nome: patientName
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar para webhook:', webhookError);
        // Não impede o sucesso do check-in local
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // === RENDERS ===

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link inválido</h1>
          <p className="text-slate-400">Este link de check-in não é válido. Solicite um novo ao seu nutricionista.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Check-in Enviado! ✅</h1>
          <p className="text-emerald-300/90 font-medium mb-2">Seus dados foram salvos com sucesso.</p>
          <p className="text-slate-300 text-lg mb-2">Muito obrigado por preencher, {patientName}!</p>
          <p className="text-slate-400">
            Em até <strong className="text-white">48 horas úteis</strong> você receberá o feedback sobre o seu Check-in! 🎯
          </p>
        </div>
      </div>
    );
  }

  // Tela de identificação por telefone
  if (!patientFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">Check-In de Avaliação</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Hora do <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Check-In!</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Para começar, confirme seu número de telefone cadastrado.
              </p>
            </div>

            {/* Form de telefone */}
            <div className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Seu telefone (com código do país)
                </label>
                <Input
                  type="tel"
                  value={telefone}
                  onChange={(e) => {
                    setTelefone(e.target.value.replace(/[^0-9+]/g, ''));
                    setPhoneError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPatient()}
                  placeholder="5511991418266"
                  className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-12 text-lg font-mono tracking-wider placeholder:text-slate-600"
                />
                <p className="text-slate-600 text-[10px]">Formato: código do país + DDD + número</p>
              </div>

              {phoneError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{phoneError}</p>
                </div>
              )}

              <Button
                onClick={handleSearchPatient}
                disabled={!telefone.trim() || searchingPatient}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12 text-base"
              >
                {searchingPatient ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-center text-slate-600 text-xs mt-6">
              Seus dados estão seguros e serão utilizados exclusivamente para seu acompanhamento.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chat do check-in
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(135deg, ${theme.bg_gradient_from}, ${theme.bg_gradient_via}, ${theme.bg_gradient_to})` }}>
      {/* Header do Chat */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 backdrop-blur-md border-b border-white/5 shadow-sm transition-all"
        style={{ background: theme.header_bg ? `${theme.header_bg}cc` : 'rgba(15, 23, 42, 0.6)' }}>
        {headerImage ? (
          <img src={headerImage} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shadow-md" />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-white/10 shadow-md backdrop-blur-sm"
            style={{ background: theme.accent_color ? `${theme.accent_color}40` : 'rgba(59, 130, 246, 0.3)' }}>
            <span className="text-xl">💪</span>
          </div>
        )}
        <div className="flex flex-col justify-center">
          <h2 className="font-semibold text-sm tracking-wide" style={{ color: theme.header_text }}>Check-In de Avaliação</h2>
          <p className="text-[10px] uppercase tracking-wider opacity-60 font-medium" style={{ color: theme.header_text }}>
            {patientName}
          </p>
        </div>
      </div>

      {/* Chat Engine */}
      <div className="flex-1 pt-16 flex justify-center relative z-10">
        <div className="w-full max-w-2xl h-full overflow-hidden">
          <ChatCheckinEngine
            flow={flow}
            patientName={patientName}
            onComplete={handleComplete}
            loading={loading}
            theme={theme}
            storageKey={`checkin_backup_${telefone.replace(/\D/g, '')}`}
          />
        </div>
      </div>

      {/* Background Ambient Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] opacity-40 animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] opacity-30" />
      </div>
    </div>
  );
}
