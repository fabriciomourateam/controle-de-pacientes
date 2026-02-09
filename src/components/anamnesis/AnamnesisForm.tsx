import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePlans } from '@/hooks/use-supabase-data';
import { 
  User, Phone, MapPin, Ruler, Target, Heart, 
  Utensils, Clock, Dumbbell, MessageSquare, ChevronLeft, ChevronRight, 
  Save, Loader2, CheckCircle2, Upload, X, Camera
} from 'lucide-react';
import { AnamnesisData } from '@/lib/anamnesis-service';

interface FormData {
  nome: string;
  data_nascimento: string;
  genero: string;
  cpf: string;
  telefone: string;
  email: string;
  plano: string;
  tempo_acompanhamento: number;
  vencimento: string;
  objetivo: string;
  observacao: string;
  peso: string;
  altura: string;
  cintura: string;
  quadril: string;
  foto_frente: File | null;
  foto_lado: File | null;
  foto_lado2: File | null;
  foto_costas: File | null;
  anamnese: AnamnesisData;
}

interface AnamnesisFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  loading: boolean;
  isPublic?: boolean; // Quando true: sem plano, layout público
}

const STEPS = [
  { id: 1, title: 'Dados Pessoais', icon: User, emoji: '👤' },
  { id: 2, title: 'Endereço', icon: MapPin, emoji: '📍' },
  { id: 3, title: 'Medidas e Fotos', icon: Ruler, emoji: '📏' },
  { id: 4, title: 'Objetivos', icon: Target, emoji: '🎯' },
  { id: 5, title: 'Saúde', icon: Heart, emoji: '❤️' },
  { id: 6, title: 'Alimentação', icon: Utensils, emoji: '🍽️' },
  { id: 7, title: 'Rotina', icon: Clock, emoji: '⏰' },
  { id: 8, title: 'Refeições', icon: Utensils, emoji: '🥗' },
  { id: 9, title: 'Treinos', icon: Dumbbell, emoji: '💪' },
  { id: 10, title: 'Finalizar', icon: MessageSquare, emoji: '✅' },
];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

// ===== COMPONENTES AUXILIARES =====

function PhotoUploadField({ label, preview, onFileChange, onRemove }: { 
  label: string; preview: string; onFileChange: (f: File) => void; onRemove: () => void; 
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</Label>
      {preview ? (
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-800/50 shadow-lg group">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button type="button" onClick={onRemove} className="bg-red-500 hover:bg-red-600 rounded-full p-2.5 transition-colors shadow-lg">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Adicionada
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-700/50 hover:border-blue-500/50 bg-slate-800/30 hover:bg-slate-800/50 flex flex-col items-center justify-center gap-3 transition-all duration-300 group"
        >
          <div className="w-12 h-12 bg-slate-700/50 group-hover:bg-blue-500/20 rounded-full flex items-center justify-center transition-colors">
            <Camera className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors" />
          </div>
          <span className="text-slate-500 group-hover:text-slate-300 text-xs text-center px-4 transition-colors">Toque para adicionar</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f); }} />
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text', required = false, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; icon?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-400 text-xs font-medium tracking-wide flex items-center gap-1.5">
        {icon && <span className="text-sm">{icon}</span>}
        {label}{required && <span className="text-blue-400">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-400 text-xs font-medium tracking-wide">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl resize-none focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====

export function AnamnesisForm({ onSubmit, loading, isPublic = false }: AnamnesisFormProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  // Planos só usados no modo interno
  let activePlans: any[] = [];
  if (!isPublic) {
    try {
      const { plans, loading: plansLoading } = usePlans();
      activePlans = plans.filter((p: any) => p.active);
    } catch {}
  }

  const [form, setForm] = useState<FormData>({
    nome: '', data_nascimento: '', genero: '', cpf: '', telefone: '', email: '',
    plano: '', tempo_acompanhamento: 3, vencimento: '', objetivo: '', observacao: '',
    peso: '', altura: '', cintura: '', quadril: '',
    foto_frente: null, foto_lado: null, foto_lado2: null, foto_costas: null,
    anamnese: {},
  });

  const [previews, setPreviews] = useState({ frente: '', lado: '', lado2: '', costas: '' });

  const updateField = (key: keyof FormData, value: any) => setForm(prev => ({ ...prev, [key]: value }));
  const updateAnamnese = (key: keyof AnamnesisData, value: string) => setForm(prev => ({ ...prev, anamnese: { ...prev.anamnese, [key]: value } }));

  const handlePhotoChange = (key: 'foto_frente' | 'foto_lado' | 'foto_lado2' | 'foto_costas', file: File) => {
    updateField(key, file);
    const previewKey = key.replace('foto_', '') as 'frente' | 'lado' | 'lado2' | 'costas';
    setPreviews(prev => ({ ...prev, [previewKey]: URL.createObjectURL(file) }));
  };

  const removePhoto = (key: 'foto_frente' | 'foto_lado' | 'foto_lado2' | 'foto_costas') => {
    updateField(key, null);
    const previewKey = key.replace('foto_', '') as 'frente' | 'lado' | 'lado2' | 'costas';
    setPreviews(prev => ({ ...prev, [previewKey]: '' }));
  };

  const goToStep = (s: number) => {
    if (s >= 1 && s <= STEPS.length) {
      setStep(s);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1) {
      if (!form.nome.trim()) {
        toast({ title: 'Campo obrigatório', description: 'Nome completo é obrigatório.', variant: 'destructive' });
        return false;
      }
      if (!form.telefone.trim()) {
        toast({ title: 'Campo obrigatório', description: 'Telefone é obrigatório.', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateCurrentStep()) goToStep(step + 1); };

  const handleSubmit = async () => {
    if (!form.nome.trim() || !form.telefone.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Nome e telefone são obrigatórios.', variant: 'destructive' });
      setStep(1);
      return;
    }
    await onSubmit(form);
  };

  const handleDuracaoChange = (meses: number) => {
    updateField('tempo_acompanhamento', meses);
    const d = new Date(); d.setMonth(d.getMonth() + meses);
    updateField('vencimento', d.toISOString().split('T')[0]);
  };

  // ===== SEÇÕES =====

  const renderDadosPessoais = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput icon="👤" label="Nome Completo" value={form.nome} onChange={v => updateField('nome', v)} placeholder="Seu nome completo" required />
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs font-medium tracking-wide flex items-center gap-1.5">
            <span className="text-sm">📱</span> Telefone (com código do país) <span className="text-blue-400">*</span>
          </Label>
          <Input
            type="tel"
            value={form.telefone}
            onChange={(e) => updateField('telefone', e.target.value.replace(/[^0-9+]/g, ''))}
            placeholder="5511991418266"
            className="bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 font-mono tracking-wider"
          />
          <p className="text-slate-600 text-[10px]">Formato: código do país + DDD + número (ex: 5511991418266)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput icon="📅" label="Data de Nascimento" value={form.data_nascimento} onChange={v => updateField('data_nascimento', v)} type="date" />
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs font-medium tracking-wide">Sexo</Label>
          <Select value={form.genero} onValueChange={v => updateField('genero', v)}>
            <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Masculino">Masculino</SelectItem>
              <SelectItem value="Feminino">Feminino</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput icon="🪪" label="CPF" value={form.cpf} onChange={v => updateField('cpf', v)} placeholder="000.000.000-00" />
        <FieldInput icon="✉️" label="Email" value={form.email} onChange={v => updateField('email', v)} placeholder="email@exemplo.com" type="email" />
      </div>
      <FieldInput icon="📷" label="Rede Social (Instagram)" value={form.anamnese.instagram || ''} onChange={v => updateAnamnese('instagram', v)} placeholder="@seuusuario" />

      {/* Plano - apenas no modo interno */}
      {!isPublic && (
        <div className="border-t border-slate-700/30 pt-5 mt-5">
          <h3 className="text-white font-semibold mb-3 text-sm">Plano de Acompanhamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Plano</Label>
              <Select value={form.plano} onValueChange={v => updateField('plano', v)}>
                <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((p: any) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} - {p.period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Duração (meses)</Label>
              <Input type="number" min={1} max={24} value={form.tempo_acompanhamento} onChange={e => handleDuracaoChange(parseInt(e.target.value) || 3)} className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11" />
            </div>
            <FieldInput label="Vencimento" value={form.vencimento} onChange={v => updateField('vencimento', v)} type="date" />
          </div>
        </div>
      )}
    </div>
  );

  const renderEndereco = () => (
    <div className="space-y-4">
      <FieldInput icon="🏠" label="Rua/Avenida" value={form.anamnese.rua || ''} onChange={v => updateAnamnese('rua', v)} placeholder="Nome da rua ou avenida" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldInput label="Número" value={form.anamnese.numero || ''} onChange={v => updateAnamnese('numero', v)} placeholder="123" />
        <FieldInput label="Bairro" value={form.anamnese.bairro || ''} onChange={v => updateAnamnese('bairro', v)} placeholder="Bairro" />
        <FieldInput label="Cidade" value={form.anamnese.cidade || ''} onChange={v => updateAnamnese('cidade', v)} placeholder="Cidade" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-400 text-xs font-medium tracking-wide">Estado</Label>
          <Select value={form.anamnese.estado || ''} onValueChange={v => updateAnamnese('estado', v)}>
            <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>{ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <FieldInput label="CEP" value={form.anamnese.cep || ''} onChange={v => updateAnamnese('cep', v)} placeholder="00000-000" />
      </div>
    </div>
  );

  const renderMedidasFotos = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
          <span className="text-lg">📐</span> Medidas Corporais
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FieldInput label="Peso (kg)" value={form.peso} onChange={v => updateField('peso', v)} placeholder="70.5" type="number" />
          <FieldInput label="Altura (cm)" value={form.altura} onChange={v => updateField('altura', v)} placeholder="175" type="number" />
          <FieldInput label="Cintura (cm)" value={form.cintura} onChange={v => updateField('cintura', v)} placeholder="80" type="number" />
          <FieldInput label="Quadril (cm)" value={form.quadril} onChange={v => updateField('quadril', v)} placeholder="95" type="number" />
        </div>
        <p className="text-slate-600 text-[10px] mt-2">Cintura: menor circunferência. Quadril: maior circunferência do glúteo.</p>
      </div>
      <div>
        <h3 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
          <span className="text-lg">📸</span> Fotos Corporais
        </h3>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-5">
          <p className="text-blue-300/80 text-xs leading-relaxed">
            <strong className="text-blue-300">Instruções:</strong> Local bem iluminado. Enquadre o corpo inteiro (inclusive pernas). 
            Câmera na altura do estômago. De preferência em jejum e descalço. Cabelo comprido preso. 
            Homens: cueca/sunga/short curto. Mulheres: biquíni ou short curto e top.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PhotoUploadField label="Frente" preview={previews.frente} onFileChange={f => handlePhotoChange('foto_frente', f)} onRemove={() => removePhoto('foto_frente')} />
          <PhotoUploadField label="Perfil (Lado)" preview={previews.lado} onFileChange={f => handlePhotoChange('foto_lado', f)} onRemove={() => removePhoto('foto_lado')} />
          <PhotoUploadField label="Perfil (Lado 2)" preview={previews.lado2} onFileChange={f => handlePhotoChange('foto_lado2', f)} onRemove={() => removePhoto('foto_lado2')} />
          <PhotoUploadField label="Costas" preview={previews.costas} onFileChange={f => handlePhotoChange('foto_costas', f)} onRemove={() => removePhoto('foto_costas')} />
        </div>
      </div>
    </div>
  );

  const renderObjetivos = () => (
    <div className="space-y-4">
      <FieldInput label="Onde conheceu meu trabalho?" value={form.anamnese.onde_conheceu || ''} onChange={v => updateAnamnese('onde_conheceu', v)} placeholder="Instagram, indicação, Google..." />
      <FieldTextarea label="Objetivo (descreva detalhadamente)" value={form.objetivo} onChange={v => updateField('objetivo', v)} placeholder="Descreva seus objetivos de saúde e forma física..." rows={4} />
      <FieldTextarea label="Relate sobre o objetivo" value={form.anamnese.relato_objetivo || ''} onChange={v => updateAnamnese('relato_objetivo', v)} placeholder="O que te motivou a buscar esse objetivo..." />
      <FieldTextarea label="Já foi em algum nutricionista antes?" value={form.anamnese.ja_foi_nutricionista || ''} onChange={v => updateAnamnese('ja_foi_nutricionista', v)} />
      <FieldTextarea label="Se sim, o que funcionou pra você?" value={form.anamnese.o_que_funcionou || ''} onChange={v => updateAnamnese('o_que_funcionou', v)} />
      <FieldTextarea label="Qual a sua maior dificuldade relacionada ao objetivo?" value={form.anamnese.maior_dificuldade || ''} onChange={v => updateAnamnese('maior_dificuldade', v)} />
    </div>
  );

  const renderSaude = () => (
    <div className="space-y-4">
      <FieldTextarea label="Possui alguma restrição alimentar? (vegetariano/vegano)" value={form.anamnese.restricao_alimentar || ''} onChange={v => updateAnamnese('restricao_alimentar', v)} />
      <FieldTextarea label="Possui alergia ou intolerância alimentar?" value={form.anamnese.alergia_intolerancia || ''} onChange={v => updateAnamnese('alergia_intolerancia', v)} />
      <FieldInput label="Fuma? Quantos cigarros por dia?" value={form.anamnese.fuma || ''} onChange={v => updateAnamnese('fuma', v)} />
      <FieldInput label="Ingere bebida alcoólica? Frequência/tipo" value={form.anamnese.bebida_alcoolica || ''} onChange={v => updateAnamnese('bebida_alcoolica', v)} />
      <FieldTextarea label="Você tem algum problema de saúde? Se sim, qual?" value={form.anamnese.problema_saude || ''} onChange={v => updateAnamnese('problema_saude', v)} />
      <FieldTextarea label="Faz ou já fez uso de algum medicamento contínuo?" value={form.anamnese.medicamento_continuo || ''} onChange={v => updateAnamnese('medicamento_continuo', v)} />
      <FieldTextarea label="Faz ou já fez uso hormonal? Dosagem e tempo?" value={form.anamnese.uso_hormonal || ''} onChange={v => updateAnamnese('uso_hormonal', v)} />
      <FieldTextarea label="Protocolo hormonal atual? (dosagem e tempo)" value={form.anamnese.protocolo_hormonal || ''} onChange={v => updateAnamnese('protocolo_hormonal', v)} />
      <FieldTextarea label="Tem interesse em uso hormonal? Sabe dos riscos?" value={form.anamnese.interesse_hormonal || ''} onChange={v => updateAnamnese('interesse_hormonal', v)} />
      {form.genero === 'Feminino' && (
        <div className="border-t border-slate-700/30 pt-4 space-y-4">
          <h3 className="text-white font-semibold text-sm">Saúde Feminina</h3>
          <FieldTextarea label="Como é seu ciclo menstrual? Última menstruação" value={form.anamnese.ciclo_menstrual || ''} onChange={v => updateAnamnese('ciclo_menstrual', v)} />
          <FieldInput label="Como você considera sua TPM?" value={form.anamnese.tpm || ''} onChange={v => updateAnamnese('tpm', v)} />
          <FieldInput label="Faz uso de método contraceptivo?" value={form.anamnese.metodo_contraceptivo || ''} onChange={v => updateAnamnese('metodo_contraceptivo', v)} />
        </div>
      )}
    </div>
  );

  const renderAlimentacao = () => (
    <div className="space-y-4">
      <FieldInput label="Mora com quantas pessoas? Quem faz as compras?" value={form.anamnese.mora_com_quantas_pessoas || ''} onChange={v => updateAnamnese('mora_com_quantas_pessoas', v)} />
      <FieldInput label="Tem o hábito de cozinhar?" value={form.anamnese.habito_cozinhar || ''} onChange={v => updateAnamnese('habito_cozinhar', v)} />
      <FieldTextarea label="Que alimentos você não gosta ou não te fazem bem?" value={form.anamnese.alimentos_nao_gosta || ''} onChange={v => updateAnamnese('alimentos_nao_gosta', v)} />
      <FieldTextarea label="Tem problema com: arroz, macarrão, batata, pão, aveia, frango, carne, peixe, legumes, saladas, queijos, frutas, whey?" value={form.anamnese.problema_alimentos_especificos || ''} onChange={v => updateAnamnese('problema_alimentos_especificos', v)} />
      <FieldTextarea label="Quais carboidratos prefere? (arroz, macarrão, pães, batatas, aveia, tapioca...)" value={form.anamnese.preferencia_carboidratos || ''} onChange={v => updateAnamnese('preferencia_carboidratos', v)} />
      <FieldTextarea label="Quais proteínas prefere? (frango, peixe, ovos, carne, whey...)" value={form.anamnese.preferencia_proteinas || ''} onChange={v => updateAnamnese('preferencia_proteinas', v)} />
      <FieldTextarea label="Quais frutas prefere?" value={form.anamnese.preferencia_frutas || ''} onChange={v => updateAnamnese('preferencia_frutas', v)} />
      <FieldInput label="Que horas do dia sente mais fome?" value={form.anamnese.hora_mais_fome || ''} onChange={v => updateAnamnese('hora_mais_fome', v)} />
      <FieldInput label="Como está seu apetite?" value={form.anamnese.apetite || ''} onChange={v => updateAnamnese('apetite', v)} />
      <FieldInput label="Como é sua mastigação?" value={form.anamnese.mastigacao || ''} onChange={v => updateAnamnese('mastigacao', v)} />
      <FieldTextarea label="Alimentos que faz questão que tenha na dieta" value={form.anamnese.alimentos_faz_questao || ''} onChange={v => updateAnamnese('alimentos_faz_questao', v)} />
      <FieldInput label="Hábito intestinal" value={form.anamnese.habito_intestinal || ''} onChange={v => updateAnamnese('habito_intestinal', v)} />
      <FieldInput label="Hábito urinário" value={form.anamnese.habito_urinario || ''} onChange={v => updateAnamnese('habito_urinario', v)} />
      <FieldInput label="Suplementos em uso" value={form.anamnese.suplementos || ''} onChange={v => updateAnamnese('suplementos', v)} />
      <FieldInput label="Quantos litros de água por dia?" value={form.anamnese.litros_agua || ''} onChange={v => updateAnamnese('litros_agua', v)} />
    </div>
  );

  const renderRotina = () => (
    <div className="space-y-4">
      <FieldInput label="Horário de estudo" value={form.anamnese.horario_estudo || ''} onChange={v => updateAnamnese('horario_estudo', v)} placeholder="Não estudo / Manhã / Tarde / Noite" />
      <FieldInput label="Horário de trabalho" value={form.anamnese.horario_trabalho || ''} onChange={v => updateAnamnese('horario_trabalho', v)} placeholder="Ex: 08h às 18h" />
      <FieldInput label="Trabalha em pé ou sentado?" value={form.anamnese.trabalha_pe_sentado || ''} onChange={v => updateAnamnese('trabalha_pe_sentado', v)} />
      <FieldInput label="Quanto tempo do dia fica em pé?" value={form.anamnese.tempo_em_pe || ''} onChange={v => updateAnamnese('tempo_em_pe', v)} />
      <FieldInput label="Horário de treino (ou pretende treinar)" value={form.anamnese.horario_treino || ''} onChange={v => updateAnamnese('horario_treino', v)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Acorda que horas?" value={form.anamnese.horario_acordar || ''} onChange={v => updateAnamnese('horario_acordar', v)} type="time" />
        <FieldInput label="Dorme que horas?" value={form.anamnese.horario_dormir || ''} onChange={v => updateAnamnese('horario_dormir', v)} type="time" />
      </div>
      <FieldInput label="Quantas horas dorme por noite?" value={form.anamnese.horas_sono || ''} onChange={v => updateAnamnese('horas_sono', v)} />
      <FieldTextarea label="Como é seu sono? Usa remédio para dormir?" value={form.anamnese.qualidade_sono || ''} onChange={v => updateAnamnese('qualidade_sono', v)} />
      <FieldInput label="Hábito de café? Com açúcar? Quanto?" value={form.anamnese.habito_cafe || ''} onChange={v => updateAnamnese('habito_cafe', v)} />
      <FieldInput label="Consegue tomar sem açúcar ou com adoçante?" value={form.anamnese.cafe_sem_acucar || ''} onChange={v => updateAnamnese('cafe_sem_acucar', v)} />
      <FieldInput label="Alimentação nos finais de semana" value={form.anamnese.alimentacao_fim_semana || ''} onChange={v => updateAnamnese('alimentacao_fim_semana', v)} />
      <FieldInput label="Condições de levar refeições ao trabalho?" value={form.anamnese.levar_refeicoes_trabalho || ''} onChange={v => updateAnamnese('levar_refeicoes_trabalho', v)} />
      <FieldInput label="Consegue pesar as refeições?" value={form.anamnese.pesar_refeicoes || ''} onChange={v => updateAnamnese('pesar_refeicoes', v)} />
    </div>
  );

  const renderRefeicoes = () => {
    const refeicoes = [
      { num: '01', refKey: 'refeicao_01' as const, horKey: 'horario_refeicao_01' as const, ex: 'Ex: Pão com ovo (gostaria de tapioca)' },
      { num: '02', refKey: 'refeicao_02' as const, horKey: 'horario_refeicao_02' as const, ex: 'Ex: Arroz, feijão, carne, salada' },
      { num: '03', refKey: 'refeicao_03' as const, horKey: 'horario_refeicao_03' as const, ex: '' },
      { num: '04', refKey: 'refeicao_04' as const, horKey: 'horario_refeicao_04' as const, ex: '' },
      { num: '05', refKey: 'refeicao_05' as const, horKey: 'horario_refeicao_05' as const, ex: '' },
      { num: '06', refKey: 'refeicao_06' as const, horKey: 'horario_refeicao_06' as const, ex: '' },
    ];
    return (
      <div className="space-y-4">
        <p className="text-slate-400 text-sm">Descreva o que come e o que gostaria de comer em cada refeição:</p>
        {refeicoes.map(r => (
          <div key={r.num} className="bg-slate-800/20 rounded-2xl p-4 space-y-3 border border-slate-700/20">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-white font-medium text-sm">Refeição {r.num}</h4>
              <div className="space-y-1">
                <Label className="text-slate-500 text-[10px] font-medium">Horário em que costuma fazer essa refeição</Label>
                <Input
                  type="time"
                  value={(form.anamnese as any)[r.horKey] || ''}
                  onChange={e => updateAnamnese(r.horKey, e.target.value)}
                  className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-9 text-sm w-32"
                />
              </div>
            </div>
            <FieldTextarea label="O que come e gostaria de comer" value={(form.anamnese as any)[r.refKey] || ''} onChange={v => updateAnamnese(r.refKey, v)} placeholder={r.ex || 'Descreva...'} rows={2} />
          </div>
        ))}
      </div>
    );
  };

  const renderTreinos = () => (
    <div className="space-y-4">
      <FieldTextarea label="Atividades físicas que pratica atualmente" value={form.anamnese.atividades_fisicas || ''} onChange={v => updateAnamnese('atividades_fisicas', v)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Horas de treino por dia" value={form.anamnese.horas_treino_dia || ''} onChange={v => updateAnamnese('horas_treino_dia', v)} />
        <FieldInput label="Treina há quanto tempo?" value={form.anamnese.tempo_treinando || ''} onChange={v => updateAnamnese('tempo_treinando', v)} />
      </div>
      <FieldInput label="Treina em jejum?" value={form.anamnese.treina_jejum || ''} onChange={v => updateAnamnese('treina_jejum', v)} />
      <FieldTextarea label="Já treinou em jejum? Como foi?" value={form.anamnese.ja_treinou_jejum || ''} onChange={v => updateAnamnese('ja_treinou_jejum', v)} />
      <FieldInput label="Musculação quantas vezes por semana?" value={form.anamnese.frequencia_musculacao || ''} onChange={v => updateAnamnese('frequencia_musculacao', v)} />
      <FieldInput label="Recuperação pós-treino" value={form.anamnese.recuperacao_pos_treino || ''} onChange={v => updateAnamnese('recuperacao_pos_treino', v)} />
      <FieldInput label="Disponibilidade para musculação (dias/semana)" value={form.anamnese.disponibilidade_musculacao || ''} onChange={v => updateAnamnese('disponibilidade_musculacao', v)} />
      <FieldTextarea label="Divisão de treino atual" value={form.anamnese.divisao_treino || ''} onChange={v => updateAnamnese('divisao_treino', v)} placeholder="Ex: Peito/Tríceps/Ombro, Costas/Bíceps, Perna..." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldInput label="Exercícios/grupo muscular" value={form.anamnese.exercicios_por_grupo || ''} onChange={v => updateAnamnese('exercicios_por_grupo', v)} />
        <FieldInput label="Séries/exercício" value={form.anamnese.series_por_exercicio || ''} onChange={v => updateAnamnese('series_por_exercicio', v)} />
        <FieldInput label="Repetições/série" value={form.anamnese.repeticoes_por_serie || ''} onChange={v => updateAnamnese('repeticoes_por_serie', v)} />
      </div>
      <FieldTextarea label="Grupo muscular com mais prioridade" value={form.anamnese.prioridade_muscular || ''} onChange={v => updateAnamnese('prioridade_muscular', v)} />
      <FieldTextarea label="Já teve alguma lesão? Detalhe" value={form.anamnese.lesoes || ''} onChange={v => updateAnamnese('lesoes', v)} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldInput label="Aeróbico (dias/semana)" value={form.anamnese.aerobico_dias_semana || ''} onChange={v => updateAnamnese('aerobico_dias_semana', v)} />
        <FieldInput label="Tempo de aeróbico" value={form.anamnese.tempo_aerobico || ''} onChange={v => updateAnamnese('tempo_aerobico', v)} />
        <FieldInput label="Aeróbico preferido" value={form.anamnese.aerobico_preferido || ''} onChange={v => updateAnamnese('aerobico_preferido', v)} />
      </div>
    </div>
  );

  const renderObservacoes = () => (
    <div className="space-y-5">
      <FieldTextarea label="Observações para a prescrição alimentar" value={form.anamnese.observacao_alimentar || ''} onChange={v => updateAnamnese('observacao_alimentar', v)} rows={4} />
      <FieldTextarea label="Observações para a prescrição de treinos" value={form.anamnese.observacao_treinos || ''} onChange={v => updateAnamnese('observacao_treinos', v)} rows={4} />
      <FieldTextarea label="Observações gerais" value={form.observacao} onChange={v => updateField('observacao', v)} rows={3} />
      <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-2 text-sm flex items-center gap-2">
          <span>🤝</span> Indicações
        </h3>
        <p className="text-slate-500 text-xs mb-3">
          Teria 2 ou 3 amigos/familiares para indicar que gostariam de ter um acompanhamento como o nosso? (nome e telefone)
        </p>
        <FieldTextarea label="" value={form.anamnese.indicacoes_amigos || ''} onChange={v => updateAnamnese('indicacoes_amigos', v)} placeholder="Nome - Telefone" rows={3} />
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderDadosPessoais();
      case 2: return renderEndereco();
      case 3: return renderMedidasFotos();
      case 4: return renderObjetivos();
      case 5: return renderSaude();
      case 6: return renderAlimentacao();
      case 7: return renderRotina();
      case 8: return renderRefeicoes();
      case 9: return renderTreinos();
      case 10: return renderObservacoes();
      default: return null;
    }
  };

  const currentStep = STEPS[step - 1];

  return (
    <div className="space-y-6">
      {/* Navbar de navegação sticky */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2">
        {/* Progress Bar */}
        <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden mb-3">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Steps Navigation - scroll visível */}
        <nav 
          className="flex items-center gap-1.5 overflow-x-auto pb-2"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                step === s.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                  : step > s.id
                  ? 'bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20'
                  : 'bg-slate-800/30 text-slate-500 border border-slate-700/30 hover:bg-slate-800/50 hover:text-slate-300'
              }`}
            >
              {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{s.emoji}</span>}
              <span>{s.title}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <Card className="bg-slate-900/30 border-slate-700/30 backdrop-blur-sm rounded-2xl shadow-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center gap-3 text-lg">
            <span className="text-2xl">{currentStep.emoji}</span>
            <div>
              <span className="text-slate-500 text-xs font-normal block">Etapa {step} de {STEPS.length}</span>
              {currentStep.title}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent ref={formRef}>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => goToStep(step - 1)}
          disabled={step === 1}
          className="text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Anterior
        </Button>

        {step < STEPS.length ? (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl px-6"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl px-8 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enviar Anamnese
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
