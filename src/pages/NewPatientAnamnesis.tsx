import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnamnesisForm } from '@/components/anamnesis/AnamnesisForm';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { processPhotoFile } from '@/lib/heic-converter';
import { CheckCircle2, Loader2 } from 'lucide-react';

// Cliente com service role para acesso público (mesmo padrão do PublicPortal)
const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default function NewPatientAnamnesis() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [nutriName, setNutriName] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);

  // Validar token e buscar dados do nutricionista
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setInvalidToken(true);
        setValidating(false);
        return;
      }

      try {
        // O token é o user_id do nutricionista
        const { data: profile, error } = await supabasePublic
          .from('profiles')
          .select('id, full_name')
          .eq('id', token)
          .maybeSingle();

        if (error || !profile) {
          setInvalidToken(true);
        } else {
          setUserId(profile.id);
          setNutriName(profile.full_name || 'Nutricionista');
        }
      } catch {
        setInvalidToken(true);
      } finally {
        setValidating(false);
      }
    }
    validateToken();
  }, [token]);

  const uploadPhoto = async (file: File, telefone: string, type: string): Promise<string | null> => {
    try {
      const processedFile = await processPhotoFile(file);
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${telefone}_inicial_${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabasePublic.storage
        .from('patient-photos')
        .upload(fileName, processedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabasePublic.storage
        .from('patient-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      return null;
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!userId) return;
    setLoading(true);

    try {
      const cleanTelefone = formData.telefone.trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');

      // 1. Upload das fotos
      let fotoFrenteUrl: string | null = null;
      let fotoLadoUrl: string | null = null;
      let fotoLado2Url: string | null = null;
      let fotoCostasUrl: string | null = null;

      if (formData.foto_frente) fotoFrenteUrl = await uploadPhoto(formData.foto_frente, cleanTelefone, 'frente');
      if (formData.foto_lado) fotoLadoUrl = await uploadPhoto(formData.foto_lado, cleanTelefone, 'lado');
      if (formData.foto_lado2) fotoLado2Url = await uploadPhoto(formData.foto_lado2, cleanTelefone, 'lado_2');
      if (formData.foto_costas) fotoCostasUrl = await uploadPhoto(formData.foto_costas, cleanTelefone, 'costas');

      // 2. Criar paciente na tabela patients
      const patientData: any = {
        nome: formData.nome,
        telefone: cleanTelefone,
        cpf: formData.cpf || null,
        email: formData.email || null,
        genero: formData.genero || null,
        data_nascimento: formData.data_nascimento || null,
        observacao: formData.observacao || null,
        user_id: userId,
      };

      if (formData.peso) patientData.peso_inicial = parseFloat(formData.peso);
      if (formData.altura) patientData.altura_inicial = parseFloat(formData.altura);
      if (formData.cintura) patientData.medida_cintura_inicial = parseFloat(formData.cintura);
      if (formData.quadril) patientData.medida_quadril_inicial = parseFloat(formData.quadril);
      if (fotoFrenteUrl) patientData.foto_inicial_frente = fotoFrenteUrl;
      if (fotoLadoUrl) patientData.foto_inicial_lado = fotoLadoUrl;
      if (fotoLado2Url) patientData.foto_inicial_lado_2 = fotoLado2Url;
      if (fotoCostasUrl) patientData.foto_inicial_costas = fotoCostasUrl;

      const dataFotos = new Date().toISOString().split('T')[0];
      if (fotoFrenteUrl || fotoLadoUrl || fotoLado2Url || fotoCostasUrl) {
        patientData.data_fotos_iniciais = dataFotos;
      }

      console.log('Dados do paciente a serem enviados:', patientData);

      const { data: newPatient, error: patientError } = await supabasePublic
        .from('patients')
        .insert(patientData)
        .select('*')
        .single();

      if (patientError) {
        console.error('Erro ao criar paciente:', patientError);
        throw patientError;
      }

      console.log('Paciente criado:', newPatient);

      // 3. Criar checkin inicial
      if (formData.peso || formData.cintura || formData.quadril || fotoFrenteUrl) {
        const checkinData: any = {
          telefone: cleanTelefone,
          data_checkin: dataFotos,
          data_preenchimento: new Date().toISOString(),
          tipo_checkin: 'inicial',
          peso: formData.peso ? parseFloat(formData.peso.replace(',', '.')) : null,
          foto_1: fotoFrenteUrl || null,
          foto_2: fotoLadoUrl || null,
          foto_3: fotoLado2Url || null,
          foto_4: fotoCostasUrl || null,
        };

        console.log('Criando checkin inicial:', checkinData);

        if (formData.cintura || formData.quadril) {
          const medidas: string[] = [];
          if (formData.cintura) medidas.push(`Cintura: ${formData.cintura}cm`);
          if (formData.quadril) medidas.push(`Quadril: ${formData.quadril}cm`);
          checkinData.medida = medidas.join(' ');
        }

        const { error: checkinError } = await supabasePublic.from('checkin').insert(checkinData);
        if (checkinError) console.error('Erro ao criar checkin:', checkinError);
      }

      // 4. Salvar anamnese
      const anamneseData: any = { ...formData.anamnese };
      if (formData.objetivo) anamneseData.objetivo = formData.objetivo;

      if (formData.data_nascimento) {
        const birthDate = new Date(formData.data_nascimento);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
        anamneseData.idade = age.toString();
      }

      console.log('Salvando anamnese:', anamneseData);

      const { error: anamneseError } = await supabasePublic
        .from('patient_anamnesis')
        .insert({
          patient_id: newPatient.id,
          telefone: cleanTelefone,
          user_id: userId,
          data: anamneseData,
        });

      if (anamneseError) {
        console.error('Erro ao salvar anamnese:', anamneseError);
        throw anamneseError;
      }

      console.log('Anamnese salva com sucesso');

      // 5. Enviar Webhook
      try {
        await fetch('https://n8n.shapepro.shop/webhook/anamnese-myshape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient: newPatient,
            anamnese: anamneseData,
            images: {
              frente: fotoFrenteUrl,
              lado: fotoLadoUrl,
              lado2: fotoLado2Url,
              costas: fotoCostasUrl
            },
            submitted_at: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Erro ao enviar webhook:', webhookError);
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Erro detalhado ao cadastrar:', JSON.stringify(error, null, 2));
      toast({
        title: 'Erro ao enviar',
        description: error.message || 'Verifique o console para mais detalhes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading de validação
  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  // Token inválido
  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link inválido</h1>
          <p className="text-slate-400">
            Este link de anamnese não é válido ou expirou. Solicite um novo link ao seu nutricionista.
          </p>
        </div>
      </div>
    );
  }

  // Sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Anamnese enviada!</h1>
          <p className="text-slate-300 text-lg mb-2">
            Seus dados foram enviados com sucesso. <br />
            Em até <strong className="text-emerald-400 font-bold">72 horas úteis</strong> seu planejamento será entregue!
          </p>
          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-slate-500/80 text-sm">
              Tenho certeza que você terá ótimos resultados! 🎯
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Formulário
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">Anamnese Nutricional</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Bem-vindo(a) ao seu<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Acompanhamento
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Preencha os dados abaixo com o máximo de detalhes, para que possamos elaborar o planejamento de acordo com a sua realidade.
          </p>
        </div>

        {/* Formulário */}
        <AnamnesisForm onSubmit={handleSubmit} loading={loading} isPublic />

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-slate-600 text-xs">
            Seus dados estão seguros e serão utilizados exclusivamente para seu acompanhamento.
          </p>
        </div>
      </div>
    </div>
  );
}
