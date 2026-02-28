import { useState, useRef, useEffect } from 'react';
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
  Save, Loader2, CheckCircle2, Upload, X, Camera, FileText, Check, ChevronsUpDown, Search
} from 'lucide-react';
import { AnamnesisData } from '@/lib/anamnesis-service';
import type { AnamnesisFlowStep, AnamnesisFieldDef } from '@/lib/anamnesis-flow-default';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { cn } from "@/lib/utils"
import { countries, Country } from "@/lib/countries"

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
  isPublic?: boolean;
  customFlow?: AnamnesisFlowStep[];
  customTermsUrl?: string;
  customTermsText?: string;
}

const DEFAULT_STEPS = [
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
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
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


function FieldInput({ label, value, onChange, placeholder, type = 'text', required = false, icon, labelClassName }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; icon?: string; labelClassName?: string;
}) {
  return (
    <div className="flex flex-col h-full gap-1.5">
      <Label className={`text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5 ${labelClassName}`}>
        {icon && <span className="text-sm">{icon}</span>}
        {label}{required && <span className="text-blue-400">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-auto bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3, labelClassName }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; labelClassName?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className={`text-slate-300 text-xs font-medium tracking-wide ${labelClassName}`}>{label}</Label>
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


// ===== COMPONENTE REUTILIZÁVEL DE TELEFONE =====
function PhoneInputField({ value, onChange, placeholder }: { value: string, onChange: (v: string) => void, placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [internalCountry, setInternalCountry] = useState<Country>(countries.find(c => c.code === 'BR')!);
  const [customDDI, setCustomDDI] = useState('');
  const [body, setBody] = useState('');
  const isInitialized = useRef(false);

  // Parse initial value
  useEffect(() => {
    if (value && !isInitialized.current) {
      const sorted = [...countries].filter(c => c.code !== 'OT').sort((a, b) => b.dial_code.length - a.dial_code.length);
      const match = sorted.find(c => value.startsWith(c.dial_code));

      if (match) {
        setInternalCountry(match);
        setBody(value.slice(match.dial_code.length).trim());
      } else if (value.startsWith('+')) {
        // Try to guess custom DDI
        setInternalCountry(countries.find(c => c.code === 'OT')!);
        // Simple heuristic: extract digits after + until space? Or just assume formatted?
        // Since we don't know the split, we put everything in body for safety if we can't parse,
        // OR we just assume it's a custom DDI scenario.
        // Let's just set Country to OT and let user fix if needed.
        setBody(value);
      } else {
        setBody(value);
      }
      isInitialized.current = true;
    }
  }, []);

  // Update value when internal state changes
  const notifyChange = (c: Country, d: string, b: string) => {
    let prefix = c.dial_code;
    if (c.code === 'OT') prefix = d.startsWith('+') ? d : (d ? `+${d}` : '');
    onChange(`${prefix} ${b}`.trim());
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[110px] bg-slate-800/20 border-slate-700/30 text-white justify-between h-11 px-3 hover:bg-slate-800/30 hover:text-white"
          >
            {internalCountry.code !== 'OT' ? (
              <span className="flex items-center gap-2 truncate">
                <span>{internalCountry.flag}</span>
                <span>{internalCountry.dial_code}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 truncate">
                <span>🌍</span>
                <span>Outro</span>
              </span>
            )}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-slate-900 border-slate-700 text-white max-h-[300px]">
          <Command>
            <CommandInput placeholder="Buscar país..." className="h-9" />
            <CommandList>
              <CommandEmpty>País não encontrado.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.name}
                    value={country.name}
                    onSelect={() => {
                      setInternalCountry(country);
                      setOpen(false);
                      notifyChange(country, customDDI, body);
                    }}
                    className="text-white cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  >
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-slate-400 text-xs ml-2">{country.dial_code}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        internalCountry.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {internalCountry.code === 'OT' && (
        <div className="relative w-[80px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">+</span>
          <Input
            type="tel"
            value={customDDI}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setCustomDDI(val);
              notifyChange(internalCountry, val, body);
            }}
            placeholder="DDI"
            className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11 pl-6 focus:border-blue-500/50 focus:ring-blue-500/20 font-mono"
          />
        </div>
      )}

      <Input
        type="tel"
        value={body}
        onChange={(e) => {
          const val = e.target.value.replace(/[^0-9\-\s]/g, '');
          setBody(val);
          notifyChange(internalCountry, customDDI, val);
        }}
        placeholder={placeholder || "DDD + Número"}
        className="flex-1 bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 font-mono tracking-wider"
      />
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====

export function AnamnesisForm({ onSubmit, loading, isPublic = false, customFlow, customTermsUrl, customTermsText }: AnamnesisFormProps) {
  const useCustomFlow = customFlow && customFlow.length > 0;

  // Derivar STEPS dinamicamente a partir do customFlow
  const STEPS = useCustomFlow
    ? customFlow.map((s, i) => ({
      id: i + 1,
      title: s.sectionTitle,
      icon: MessageSquare,
      emoji: s.sectionEmoji || '📋',
    }))
    : DEFAULT_STEPS;
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  // Planos só usados no modo interno
  let activePlans: any[] = [];
  if (!isPublic) {
    try {
      const { plans, loading: plansLoading } = usePlans();
      activePlans = plans.filter((p: any) => p.active);
    } catch { }
  }

  const [form, setForm] = useState<FormData>({
    nome: '', data_nascimento: '', genero: '', cpf: '', telefone: '', email: '',
    plano: '', tempo_acompanhamento: 3, vencimento: '', objetivo: '', observacao: '',
    peso: '', altura: '', cintura: '', quadril: '',
    foto_frente: null, foto_lado: null, foto_lado2: null, foto_costas: null,
    anamnese: {},
  });

  const [previews, setPreviews] = useState({ frente: '', lado: '', lado2: '', costas: '' });
  const [isCustomDDI, setIsCustomDDI] = useState(false);

  /* 
     State for field confirmations (e.g. email or phone double-check).
     Key = field ID (or 'telefone' for hardcoded), Value = the confirmation value typed by user.
  */
  const [confirmations, setConfirmations] = useState<Record<string, string>>({});

  // State for field confirmations, etc. deleted old phone state


  // Persistence: Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('anamnesis-form-progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        const { _step, ...formFields } = parsed;
        setForm(prev => ({
          ...prev,
          ...formFields,
          foto_frente: null, foto_lado: null, foto_lado2: null, foto_costas: null
        }));
        if (_step && _step >= 1 && _step <= STEPS.length) {
          setStep(_step);
        }
      }
    } catch (e) {
      console.error('Failed to load saved form', e);
    }
  }, []);

  // Persistence: Save to localStorage on change (includes current step)
  useEffect(() => {
    try {
      const dataToSave = { ...form, foto_frente: null, foto_lado: null, foto_lado2: null, foto_costas: null, _step: step };
      localStorage.setItem('anamnesis-form-progress', JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save form progress', e);
    }
  }, [form, step]);

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
    const checkEmpty = (value: any) => !value || (typeof value === 'string' && !value.trim());
    const showErr = (field: string) => {
      toast({ title: 'Campo obrigatório', description: `O campo "${field}" é obrigatório. Se não souber, preencha com 0.`, variant: 'destructive' });
      return false;
    };
    const showMismatch = (field: string) => {
      toast({ title: 'Confirmação incorreta', description: `A confirmação do campo "${field}" não confere.`, variant: 'destructive' });
      return false;
    };

    // Validação dinâmica para fluxo customizado
    if (useCustomFlow) {
      const section = customFlow[step - 1];
      if (section) {
        for (const fieldDef of section.fields) {
          if (!fieldDef.required && !fieldDef.requiresConfirmation) continue;
          if (fieldDef.type === 'photo') continue; // photos are optional by nature

          // Check showIf condition
          if (fieldDef.showIf) {
            const condVal = fieldDef.showIf.field === 'genero'
              ? form.genero
              : (form.anamnese as any)[fieldDef.showIf.field] || '';
            if (condVal !== fieldDef.showIf.value) continue;
          }

          const val = fieldDef.targetField === 'form'
            ? (form as any)[fieldDef.field]
            : (form.anamnese as any)[fieldDef.field];

          if (fieldDef.required && checkEmpty(val)) return showErr(fieldDef.label);

          if (fieldDef.requiresConfirmation) {
            const confirmVal = confirmations[fieldDef.id] || '';
            // Para telefone, a verificação pode ser tricky por causa do DDI
            // Se for 'telefone', comparamos string normal.
            // O input de confirmação deve ser preenchido
            if (val !== confirmVal) return showMismatch(fieldDef.label);
          }
        }
      }
      return true;
    }

    if (step === 1) {
      if (checkEmpty(form.nome)) return showErr('Nome Completo');
      if (checkEmpty(form.telefone)) return showErr('Telefone');

      // Hardcoded check for phone confirmation in standard flow
      const phoneConfirm = confirmations['telefone'] || '';
      // form.telefone inclui DDI. Vamos simplificar: verificar se o que o user digitou no confirm (número)
      // está contido no final de form.telefone?
      // Ou melhor: Vamos forçar que o confirm tenha DDI?
      // Não, a UI do confirm vai ser simples. Vamos verificar se phoneConfirm == form.telefone SEM O DDI ou algo assim.
      // Melhor: Vamos salvar o telefone 'completo' na confirmação também?
      // A implementação do renderDadosPessoais vai definir isso. Assumindo que confirmations['telefone'] tem o numero completo.
      if (form.telefone !== phoneConfirm) return showMismatch('Telefone');

      if (checkEmpty(form.data_nascimento)) return showErr('Data de Nascimento');
      if (checkEmpty(form.data_nascimento)) return showErr('Data de Nascimento');
      if (checkEmpty(form.cpf)) return showErr('CPF');
      if (checkEmpty(form.email)) return showErr('Email');
    }

    if (step === 2) {
      if (checkEmpty(form.anamnese.rua)) return showErr('Rua/Avenida');
      if (checkEmpty(form.anamnese.numero)) return showErr('Número');
      if (checkEmpty(form.anamnese.bairro)) return showErr('Bairro');
      if (checkEmpty(form.anamnese.cidade)) return showErr('Cidade');
      if (checkEmpty(form.anamnese.estado)) return showErr('Estado');
      if (checkEmpty(form.anamnese.cep)) return showErr('CEP');
      if (form.anamnese.estado === 'Exterior' && checkEmpty(form.anamnese.detalhes_endereco_exterior)) return showErr('Detalhes do Endereço');
    }

    if (step === 3) {
      if (checkEmpty(form.peso)) return showErr('Peso');
      if (checkEmpty(form.altura)) return showErr('Altura');
      if (checkEmpty(form.cintura)) return showErr('Cintura');
      if (checkEmpty(form.quadril)) return showErr('Quadril');
    }

    // Generic check for other steps if needed, but specific is better
    // Steps 4-10: mostly text areas or inputs.
    // I'll implement checks based on Step ID.

    if (step === 4) { // Objetivos
      if (checkEmpty(form.anamnese.onde_conheceu)) return showErr('Onde conheceu');
      if (checkEmpty(form.objetivo)) return showErr('Objetivo Principal');
      if (checkEmpty(form.anamnese.relato_objetivo)) return showErr('Relato do Objetivo');
      if (checkEmpty(form.anamnese.ja_foi_nutricionista)) return showErr('Já foi em nutricionista');
      // ... others can be checked generically or specifically
    }

    // Step 5: Saude - all mandatory per request
    if (step === 5) {
      const fields = [
        ['restricao_alimentar', 'Restrição Alimentar'],
        ['alergia_intolerancia', 'Alergia/Intolerância'],
        ['fuma', 'Fuma'],
        ['bebida_alcoolica', 'Bebida Alcoólica'],
        ['problema_saude', 'Problema de Saúde'],
        ['medicamento_continuo', 'Medicamento'],
        ['uso_hormonal', 'Uso Hormonal'],
        ['protocolo_hormonal', 'Protocolo Hormonal'],
        ['interesse_hormonal', 'Interesse Hormonal']
      ];
      for (const [key, label] of fields) {
        if (checkEmpty((form.anamnese as any)[key])) return showErr(label);
      }
    }

    // Step 6: Alimentação
    if (step === 6) {
      const fields = [
        ['mora_com_quantas_pessoas', 'Mora com quantas pessoas'],
        ['habito_cozinhar', 'Hábito de cozinhar'],
        ['alimentos_nao_gosta', 'Alimentos que não gosta'],
        ['problema_alimentos_especificos', 'Problemas com alimentos'],
        ['preferencia_carboidratos', 'Preferência Carboidratos'],
        ['preferencia_proteinas', 'Preferência Proteínas'],
        ['preferencia_frutas', 'Preferência Frutas'],
        ['hora_mais_fome', 'Hora de mais fome'],
        ['apetite', 'Apetite'],
        ['mastigacao', 'Mastigação'],
        ['alimentos_faz_questao', 'Alimentos que faz questão'],
        ['suplementos', 'Suplementos'],
        ['litros_agua', 'Litros de água']
      ];
      for (const [key, label] of fields) {
        if (checkEmpty((form.anamnese as any)[key])) return showErr(label);
      }
    }

    // Step 7: Rotina
    if (step === 7) {
      const fields = [
        ['horario_estudo', 'Horário de Estudo'],
        ['horario_trabalho', 'Horário de Trabalho'],
        ['trabalha_pe_sentado', 'Trabalha em pé ou sentado'],
        ['tempo_em_pe', 'Tempo em pé'],
        ['horario_treino', 'Horário de Treino'],
        ['horario_acordar', 'Horário de Acordar'],
        ['horario_dormir', 'Horário de Dormir'],
        ['horas_sono', 'Horas de Sono'],
        ['qualidade_sono', 'Qualidade do Sono'],
        ['habito_cafe', 'Hábito de Café'],
        ['cafe_sem_acucar', 'Café sem açúcar'],
        ['alimentacao_fim_semana', 'Alimentação Fim de Semana'],
        ['levar_refeicoes_trabalho', 'Levar refeições'],
        ['pesar_refeicoes', 'Pesar refeições']
      ];
      for (const [key, label] of fields) {
        if (checkEmpty((form.anamnese as any)[key])) return showErr(label);
      }
    }

    // Step 8: Refeições
    if (step === 8) {
      // Check at least one meal? Or all? "Todos os dados obrigatórios".
      // Let's check all 6 slots? Some might be empty if user eats less times.
      // User said: "Se não souber... colocar 0".
      // But if they eat 3 times, should they put "0" in meal 4/5/6?
      // Safe bet: Text says "Descreva o que come...".
      // I'll enforced at least Refeição 01, 02, 03?
      // Or ALL as requested. "tem como todos os dados serem obrigatorios?" -> Yes.
      const meals = Array.from({ length: 6 }, (_, i) => i + 1);
      for (const n of meals) {
        if (checkEmpty((form.anamnese as any)[`refeicao_0${n}`])) return showErr(`Refeição 0${n} (descrição)`);
        if (checkEmpty((form.anamnese as any)[`horario_refeicao_0${n}`])) return showErr(`Horário Refeição 0${n}`);
      }
    }

    // Step 9: Treinos
    if (step === 9) {
      const fields = [
        'frequencia_musculacao', 'recuperacao_pos_treino', 'disponibilidade_musculacao',
        'horas_treino_dia', 'divisao_treino', 'exercicios_por_grupo', 'series_por_exercicio',
        'repeticoes_por_serie', 'prioridade_muscular', 'aerobico_dias_semana', 'tempo_aerobico',
        'aerobico_preferido', 'lesoes', 'atividades_fisicas'
      ];
      for (const key of fields) {
        if (checkEmpty((form.anamnese as any)[key])) return showErr('Campo de treino');
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
    if (!termsAccepted) {
      toast({ title: 'Termo de Adesão', description: 'Você precisa aceitar os termos de adesão para finalizar.', variant: 'destructive' });
      return;
    }

    // Clear storage on successful submission attempt
    localStorage.removeItem('anamnesis-form-progress');
    await onSubmit(form);
  };

  const handleDuracaoChange = (meses: number) => {
    updateField('tempo_acompanhamento', meses);
    const d = new Date(); d.setMonth(d.getMonth() + meses);
    updateField('vencimento', d.toISOString().split('T')[0]);
  };

  // ===== MÁSCARA DE HORÁRIO (HH:MM) =====
  const handleTimeMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  // ===== SEÇÕES =====

  const renderDadosPessoais = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput icon="👤" label="Nome Completo" value={form.nome} onChange={v => updateField('nome', v)} placeholder="Seu nome completo" required />
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
            <span className="text-sm">📱</span> Telefone <span className="text-blue-400">*</span>
          </Label>
          <PhoneInputField
            value={form.telefone}
            onChange={(v) => updateField('telefone', v)}
            placeholder="DDD + Número"
          />
          <p className="text-slate-600 text-[10px]">Selecione o país e digite o DDD + número.</p>
        </div>
      </div>

      {/* Confirmação de Telefone (Hardcoded Step 1) */}
      <div className="space-y-1.5 mt-2">
        <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
          <span className="text-sm">🔄</span> Confirme o Telefone <span className="text-blue-400">*</span>
        </Label>
        <PhoneInputField
          value={confirmations['telefone'] || ''}
          onChange={(v) => setConfirmations(prev => ({ ...prev, 'telefone': v }))}
          placeholder="Digite o número completo novamente"
        />
        <p className="text-slate-600 text-[10px]">Confirme o número para evitar erros de contato.</p>
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
          <Label className="text-slate-300 text-xs font-medium tracking-wide">Estado</Label>
          <Select value={form.anamnese.estado || ''} onValueChange={v => updateAnamnese('estado', v)}>
            <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>
              {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              <SelectItem value="Exterior">Exterior</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FieldInput label="CEP" value={form.anamnese.cep || ''} onChange={v => updateAnamnese('cep', v)} placeholder="00000-000" />
      </div>
      {form.anamnese.estado === 'Exterior' && (
        <FieldInput label="País/Detalhes do Endereço" value={form.anamnese.detalhes_endereco_exterior || ''} onChange={v => updateAnamnese('detalhes_endereco_exterior', v)} placeholder="Digite seu país e detalhes do endereço" />
      )}
    </div>
  );

  const renderMedidasFotos = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
          <span className="text-lg">📐</span> Medidas Corporais
        </h3>
        <div className="mb-6 rounded-xl overflow-hidden border border-blue-500/30 w-full max-w-sm mx-auto">
          <img src="/unnamed.jpg" alt="Exemplo de fotos e medidas" className="w-full h-auto object-contain bg-black/40" />
        </div>
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
            <strong className="text-blue-300">Instruções:</strong> Faça as fotos preferencialmente em jejum, em um local bem iluminado, enquadre o corpo inteiro (inclusive as pernas). <br />
            Caso não tenha ninguém pra tirar as fotos, você pode colocar o celular num apoio, filmar com a câmera frontal e tirar print nas posições solicitadas.
            <br /><br />
            - <strong>Homens:</strong> cueca/sunga/shorts curto. <br />
            - <strong>Mulheres:</strong> biquíni ou shorts curto e top.
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
      <div className="space-y-1.5">
        <Label className="text-slate-300 text-xs font-medium tracking-wide">Onde conheceu meu trabalho?</Label>
        <Select value={form.anamnese.onde_conheceu || ''} onValueChange={v => updateAnamnese('onde_conheceu', v)}>
          <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Google">Google</SelectItem>
            <SelectItem value="Instagram">Instagram</SelectItem>
            <SelectItem value="Facebook">Facebook</SelectItem>
            <SelectItem value="Indicação">Indicação</SelectItem>
            <SelectItem value="Outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-slate-300 text-xs font-medium tracking-wide">Objetivo (Selecione com base no que mais te incomoda no seu físico hoje)</Label>
        <Select value={form.objetivo} onValueChange={v => updateField('objetivo', v)}>
          <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione o principal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Diminuir o percentual de gordura">Diminuir o percentual de gordura</SelectItem>
            <SelectItem value="Ganho de massa muscular">Ganho de massa muscular</SelectItem>
            <SelectItem value="Recomposição corporal">Recomposição corporal</SelectItem>
            <SelectItem value="Emagrecimento">Emagrecimento</SelectItem>
            <SelectItem value="Performance">Performance</SelectItem>
            <SelectItem value="Melhora de saúde">Melhora de saúde</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FieldTextarea label="Agora descreva detalhadamente seu objetivo" value={form.anamnese.relato_objetivo || ''} onChange={v => updateAnamnese('relato_objetivo', v)} placeholder="O que te motivou a buscar esse objetivo..." />
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

      <div className="space-y-1.5">
        <Label className="text-slate-300 text-xs font-medium tracking-wide">Como é sua mastigação?</Label>
        <Select value={form.anamnese.mastigacao || ''} onValueChange={v => updateAnamnese('mastigacao', v)}>
          <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Lenta">Lenta</SelectItem>
            <SelectItem value="Mediana">Mediana</SelectItem>
            <SelectItem value="Rápida">Rápida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FieldTextarea label="Alimentos que faz questão que tenha na dieta" value={form.anamnese.alimentos_faz_questao || ''} onChange={v => updateAnamnese('alimentos_faz_questao', v)} />
      <FieldInput label="Possui algum suplemento em mãos? Se sim, qual(is)?" value={form.anamnese.suplementos || ''} onChange={v => updateAnamnese('suplementos', v)} />
      <FieldInput label="Bebe quantos litros de água por dia?" value={form.anamnese.litros_agua || ''} onChange={v => updateAnamnese('litros_agua', v)} />
    </div>
  );

  const renderRotina = () => (
    <div className="space-y-4">
      <FieldInput label="Horário de estudo" value={form.anamnese.horario_estudo || ''} onChange={v => updateAnamnese('horario_estudo', v)} placeholder="Não estudo / Manhã / Tarde / Noite" />
      <FieldInput label="Horário de trabalho" value={form.anamnese.horario_trabalho || ''} onChange={v => updateAnamnese('horario_trabalho', v)} placeholder="Ex: 08h às 18h" />
      <FieldInput label="Trabalha em pé ou sentado?" value={form.anamnese.trabalha_pe_sentado || ''} onChange={v => updateAnamnese('trabalha_pe_sentado', v)} />
      <FieldInput label="Quanto tempo do dia fica em pé?" value={form.anamnese.tempo_em_pe || ''} onChange={v => updateAnamnese('tempo_em_pe', v)} />
      <FieldInput label="Horário de treino (ou pretende treinar)" value={form.anamnese.horario_treino || ''} onChange={v => updateAnamnese('horario_treino', v)} />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-xs font-medium tracking-wide">Acorda que horas?</Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={form.anamnese.horario_acordar || ''}
            onChange={e => updateAnamnese('horario_acordar', handleTimeMask(e.target.value))}
            placeholder="00:00"
            className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11 text-center text-sm font-mono tracking-widest w-28"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-xs font-medium tracking-wide">Dorme que horas?</Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={form.anamnese.horario_dormir || ''}
            onChange={e => updateAnamnese('horario_dormir', handleTimeMask(e.target.value))}
            placeholder="00:00"
            className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11 text-center text-sm font-mono tracking-widest w-28"
          />
        </div>
      </div>
      <FieldInput label="Quantas horas dorme por noite?" value={form.anamnese.horas_sono || ''} onChange={v => updateAnamnese('horas_sono', v)} />
      <FieldTextarea label="Como é seu sono? Usa remédio para dormir?" value={form.anamnese.qualidade_sono || ''} onChange={v => updateAnamnese('qualidade_sono', v)} />
      <FieldInput label="Tem o hábito de tomar café? Se sim, toma com açúcar? Quanto?" value={form.anamnese.habito_cafe || ''} onChange={v => updateAnamnese('habito_cafe', v)} />
      <FieldInput label="Consegue tomar sem açúcar ou com adoçante?" value={form.anamnese.cafe_sem_acucar || ''} onChange={v => updateAnamnese('cafe_sem_acucar', v)} />
      <FieldInput label="Como é sua alimentação aos finais de semana?" value={form.anamnese.alimentacao_fim_semana || ''} onChange={v => updateAnamnese('alimentacao_fim_semana', v)} />
      <FieldInput label="Tem condições de levar refeições para o trabalho?" value={form.anamnese.levar_refeicoes_trabalho || ''} onChange={v => updateAnamnese('levar_refeicoes_trabalho', v)} />
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
        <p className="text-slate-300 text-sm">Descreva o que come e o que gostaria de comer em cada refeição:</p>
        {refeicoes.map(r => (
          <div key={r.num} className="bg-slate-800/20 rounded-2xl p-4 space-y-3 border border-slate-700/20">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-white font-medium text-sm">Refeição {r.num}</h4>
              <div className="space-y-1">
                <Label className="text-slate-500 text-[10px] font-medium">Horário</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={(form.anamnese as any)[r.horKey] || ''}
                  onChange={e => updateAnamnese(r.horKey, handleTimeMask(e.target.value))}
                  placeholder="00:00"
                  className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-9 text-center font-mono tracking-widest w-24"
                />
              </div>
            </div>
            <FieldTextarea label="O que come na refeição atualmente e o que gostaria de comer" value={(form.anamnese as any)[r.refKey] || ''} onChange={v => updateAnamnese(r.refKey, v)} placeholder={r.ex || 'Descreva...'} rows={3} />
          </div>
        ))}
      </div>
    );
  };

  const renderTreinos = () => (
    <div className="space-y-4">
      <FieldInput label="Faz musculação quantas vezes por semana?" value={form.anamnese.frequencia_musculacao || ''} onChange={v => updateAnamnese('frequencia_musculacao', v)} />

      <FieldInput label="Treina há quanto tempo?" value={form.anamnese.tempo_treinando || ''} onChange={v => updateAnamnese('tempo_treinando', v)} placeholder="Ex: 6 meses, 1 ano..." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
            Treina em jejum?
          </Label>
          <Select value={form.anamnese.treina_jejum || ''} onValueChange={v => updateAnamnese('treina_jejum', v)}>
            <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Sim">Sim</SelectItem>
              <SelectItem value="Não">Não</SelectItem>
              <SelectItem value="Às vezes">Às vezes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <FieldInput label="Como é sua recuperação pós-treino?" value={form.anamnese.recuperacao_pos_treino || ''} onChange={v => updateAnamnese('recuperacao_pos_treino', v)} />
      </div>

      <FieldTextarea label="Já treinou em jejum? Se sim, como foi?" value={form.anamnese.ja_treinou_jejum || ''} onChange={v => updateAnamnese('ja_treinou_jejum', v)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FieldInput label="Tem disponibilidade para treinar quantos dias na semana?" value={form.anamnese.disponibilidade_musculacao || ''} onChange={v => updateAnamnese('disponibilidade_musculacao', v)} />
        <FieldInput label="Quantas horas por dia tem disponível para treino?" value={form.anamnese.horas_treino_dia || ''} onChange={v => updateAnamnese('horas_treino_dia', v)} />
      </div>

      <FieldTextarea label="Como está sua divisão de treino atual?" value={form.anamnese.divisao_treino || ''} onChange={v => updateAnamnese('divisao_treino', v)} placeholder="Ex: Peito/Tríceps/Ombro, Costas/Bíceps, Perna..." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldInput label="Faz quantos exercícios por grupo muscular?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.exercicios_por_grupo || ''} onChange={v => updateAnamnese('exercicios_por_grupo', v)} />
        <FieldInput label="Faz quantas séries por exercício?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.series_por_exercicio || ''} onChange={v => updateAnamnese('series_por_exercicio', v)} />
        <FieldInput label="Quantas repetições em cada série?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.repeticoes_por_serie || ''} onChange={v => updateAnamnese('repeticoes_por_serie', v)} />
      </div>

      <FieldTextarea label="Qual grupo muscular que tem mais prioridade em desenvolver?" value={form.anamnese.prioridade_muscular || ''} onChange={v => updateAnamnese('prioridade_muscular', v)} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FieldInput label="Faz cardio quantos dias na semana?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.aerobico_dias_semana || ''} onChange={v => updateAnamnese('aerobico_dias_semana', v)} />
        <FieldInput label="Quanto tempo de cardio você faz nesses dias?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.tempo_aerobico || ''} onChange={v => updateAnamnese('tempo_aerobico', v)} />
        <FieldInput label="Qual seu cardio preferido?" labelClassName="h-10 flex items-end pb-1" value={form.anamnese.aerobico_preferido || ''} onChange={v => updateAnamnese('aerobico_preferido', v)} />
      </div>

      <FieldTextarea label="Já teve alguma lesão? Detalhe" value={form.anamnese.lesoes || ''} onChange={v => updateAnamnese('lesoes', v)} />
      <FieldTextarea label="Atividades físicas que pratica atualmente (além da musculação)" value={form.anamnese.atividades_fisicas || ''} onChange={v => updateAnamnese('atividades_fisicas', v)} />
    </div>
  );

  const [termsAccepted, setTermsAccepted] = useState(false);

  // === RENDERIZAÇÃO DINÂMICA DE CAMPOS ===
  const renderDynamicField = (fieldDef: AnamnesisFieldDef) => {
    const getValue = () => {
      if (fieldDef.targetField === 'form') return (form as any)[fieldDef.field] || '';
      return (form.anamnese as any)[fieldDef.field] || '';
    };
    const setValue = (v: string) => {
      if (fieldDef.targetField === 'form') updateField(fieldDef.field as keyof FormData, v);
      else updateAnamnese(fieldDef.field as keyof AnamnesisData, v);
    };

    // showIf conditional
    if (fieldDef.showIf) {
      const condVal = fieldDef.showIf.field === 'genero'
        ? form.genero
        : (form.anamnese as any)[fieldDef.showIf.field] || '';
      if (condVal !== fieldDef.showIf.value) return null;
    }

    // Confirmation Field Renderer
    const renderConfirmation = () => {
      if (!fieldDef.requiresConfirmation) return null;
      return (
        <FieldInput
          label={`Confirme: ${fieldDef.label}`}
          value={confirmations[fieldDef.id] || ''}
          onChange={(v) => {
            // Prevent paste
            setConfirmations(prev => ({ ...prev, [fieldDef.id]: v }));
          }}
          placeholder={`Digite novamente: ${fieldDef.label}`}
          type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
          required={true}
          icon="🔄"
        // Add onPaste prevent via prop if FieldInput supported, but it doesn't.
        // We'll trust verification logic. Or add onPaste handler logic if critical.
        />
      );
    };

    // photo fields
    if (fieldDef.type === 'photo') {
      const photoKey = fieldDef.field as 'foto_frente' | 'foto_lado' | 'foto_lado2' | 'foto_costas';
      const previewKey = photoKey.replace('foto_', '') as 'frente' | 'lado' | 'lado2' | 'costas';
      return (
        <PhotoUploadField
          key={fieldDef.id}
          label={fieldDef.label}
          preview={previews[previewKey] || ''}
          onFileChange={f => handlePhotoChange(photoKey, f)}
          onRemove={() => removePhoto(photoKey)}
        />
      );
    }

    // select fields
    if (fieldDef.type === 'select' && fieldDef.options) {
      return (
        <div key={fieldDef.id} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
              {fieldDef.icon && <span className="text-sm">{fieldDef.icon}</span>}
              {fieldDef.label}{fieldDef.required && <span className="text-blue-400">*</span>}
            </Label>
            <Select value={getValue()} onValueChange={setValue}>
              <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {fieldDef.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Selects dont usually need confirmation but if configured... */}
          {fieldDef.requiresConfirmation && (
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
                <span className="text-sm">🔄</span> Confirme: {fieldDef.label} <span className="text-blue-400">*</span>
              </Label>
              <Select value={confirmations[fieldDef.id] || ''} onValueChange={v => setConfirmations(prev => ({ ...prev, [fieldDef.id]: v }))}>
                <SelectTrigger className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11"><SelectValue placeholder="Selecione novamente" /></SelectTrigger>
                <SelectContent>
                  {fieldDef.options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    }

    if (fieldDef.id === 'indicacoes_amigos') {
      return (
        <div key={fieldDef.id} className="col-span-full">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-xl">🤝</span> {fieldDef.label}
            </h3>
            <p className="text-slate-400 text-sm">
              Teria 2 ou 3 amigos/familiares para indicar que gostariam de ter um acompanhamento como o nosso?
            </p>
            <FieldTextarea
              label=""
              labelClassName="hidden"
              value={getValue()}
              onChange={setValue}
              placeholder={fieldDef.placeholder || "Nome - Telefone"}
              rows={3}
            />
          </div>
        </div>
      );
    }

    // textarea fields
    if (fieldDef.type === 'textarea') {
      return (
        <div key={fieldDef.id} className="space-y-4">
          <FieldTextarea
            key={fieldDef.id}
            label={fieldDef.label}
            value={getValue()}
            onChange={setValue}
            placeholder={fieldDef.placeholder}
          />
          {fieldDef.requiresConfirmation && (
            <FieldTextarea
              label={`Confirme: ${fieldDef.label}`}
              value={confirmations[fieldDef.id] || ''}
              onChange={(v) => setConfirmations(prev => ({ ...prev, [fieldDef.id]: v }))}
              placeholder="Digite novamente"
            />
          )}
        </div>
      );
    }



    // text, number, date, time fields
    // Special case for 'telefone' to use default country selector logic even in dynamic flow
    if (fieldDef.id === 'telefone' || (fieldDef.type === 'text' && fieldDef.field === 'telefone') || fieldDef.type === 'phone') {
      return (
        <div key={fieldDef.id} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
              <span className="text-sm">📱</span> {fieldDef.label} <span className="text-blue-400">*</span>
            </Label>
            {fieldDef.hasCountrySelector !== false ? (
              <>
                <PhoneInputField
                  value={getValue()}
                  onChange={setValue}
                  placeholder={fieldDef.placeholder}
                />
                <p className="text-slate-600 text-[10px]">Selecione o país e digite o DDD + número.</p>
              </>
            ) : (
              <FieldInput
                label=""
                labelClassName="hidden"
                value={getValue()}
                onChange={setValue}
                placeholder={fieldDef.placeholder || "Digite o telefone"}
                type="tel"
              />
            )}
          </div>

          {/* Dynamic Confirmation */}
          {fieldDef.requiresConfirmation && (
            <div className="space-y-1.5 mt-2">
              <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
                <span className="text-sm">🔄</span> Confirme: {fieldDef.label} <span className="text-blue-400">*</span>
              </Label>
              {fieldDef.hasCountrySelector !== false ? (
                <PhoneInputField
                  value={confirmations[fieldDef.id] || ''}
                  onChange={(v) => setConfirmations(prev => ({ ...prev, [fieldDef.id]: v }))}
                  placeholder="Digite o número completo novamente"
                />
              ) : (
                <Input
                  value={confirmations[fieldDef.id] || ''}
                  onChange={(e) => setConfirmations(prev => ({ ...prev, [fieldDef.id]: e.target.value }))}
                  placeholder="Digite o número completo novamente"
                  onPaste={(e) => {
                    e.preventDefault();
                    toast({ title: 'Atenção', description: 'Por favor, digite novamente para confirmar.', variant: 'destructive' });
                  }}
                  className="bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
                />
              )}
            </div>
          )}
        </div>
      );
    }

    // Time fields - compact masked input
    if (fieldDef.type === 'time') {
      return (
        <div key={fieldDef.id} className="space-y-1.5">
          <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-end gap-1.5 min-h-[2.5rem]">
            {fieldDef.icon && <span className="text-sm">{fieldDef.icon}</span>}
            {fieldDef.label}{fieldDef.required && <span className="text-blue-400">*</span>}
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={getValue()}
            onChange={e => setValue(handleTimeMask(e.target.value))}
            placeholder="00:00"
            className="bg-slate-800/40 border-slate-700/50 text-white rounded-xl h-11 text-center text-sm font-mono tracking-widest w-full max-w-[8rem]"
          />
        </div>
      );
    }

    return (
      <div key={fieldDef.id} className="space-y-4 h-full flex flex-col">
        <FieldInput
          label={fieldDef.label}
          value={getValue()}
          onChange={setValue}
          placeholder={fieldDef.placeholder}
          type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
          required={fieldDef.required}
          icon={fieldDef.icon}
        />
        {fieldDef.requiresConfirmation && (
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-medium tracking-wide flex items-center gap-1.5">
              <span className="text-sm">🔄</span> Confirme: {fieldDef.label} <span className="text-blue-400">*</span>
            </Label>
            <Input
              value={confirmations[fieldDef.id] || ''}
              onChange={(e) => setConfirmations(prev => ({ ...prev, [fieldDef.id]: e.target.value }))}
              placeholder={`Confirme ${fieldDef.label}`}
              onPaste={(e) => {
                e.preventDefault();
                toast({ title: 'Atenção', description: 'Por favor, digite novamente para confirmar.', variant: 'destructive' });
              }}
              className="bg-slate-800/40 border-slate-700/50 text-white placeholder:text-slate-600 rounded-xl h-11 focus:border-blue-500/50 focus:ring-blue-500/20 transition-all"
            />
          </div>
        )}
      </div>
    );
  };

  const renderDynamicSection = (sectionIndex: number) => {
    if (!useCustomFlow) return null;
    const section = customFlow[sectionIndex];
    if (!section) return null;

    // Group fields by gridCols for layout
    const renderedFields: React.ReactNode[] = [];
    let gridGroup: AnamnesisFieldDef[] = [];
    let currentGridCols = 0;

    const flushGrid = () => {
      if (gridGroup.length > 0) {
        const cols = currentGridCols || 1;
        const hasTimeField = gridGroup.some(f => f.type === 'time');
        const gridClass = hasTimeField
          ? 'grid grid-cols-[auto_1fr] gap-4 items-start'
          : `grid grid-cols-1 md:grid-cols-${cols} gap-4`;
        renderedFields.push(
          <div key={`grid-${renderedFields.length}`} className={gridClass}>
            {gridGroup.map(f => renderDynamicField(f))}
          </div>
        );
        gridGroup = [];
        currentGridCols = 0;
      }
    };

    for (const field of section.fields) {
      if (field.gridCols && field.gridCols > 1) {
        if (currentGridCols > 0 && currentGridCols !== field.gridCols) {
          flushGrid();
        }
        currentGridCols = field.gridCols;
        gridGroup.push(field);
      } else {
        flushGrid();
        renderedFields.push(renderDynamicField(field));
      }
    }
    flushGrid();

    // If this is the last section, add terms at the end
    const isLastSection = sectionIndex === customFlow.length - 1;

    return (
      <div className="space-y-4">
        {renderedFields}
        {isLastSection && renderTermsBlock()}
      </div>
    );
  };

  // Bloco de termos reutilizável
  const effectiveTermsUrl = customTermsUrl || 'https://drive.google.com/file/d/1KuLkE5WpEeqX6MYFI46VhySng5UOK-nY/view?usp=sharing';
  const effectiveTermsText = customTermsText || 'Antes de seguir, é importante que você conheça os termos do nosso acompanhamento.\n\nEste é o **contrato que formaliza sua adesão ao plano escolhido** e explica de forma transparente como funciona o serviço, prazos, deveres e garantias — pra que tudo fique claro desde o início.';

  const renderTermsBlock = () => (
    <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl mt-8">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Termo de Adesão</h3>
          </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{
              __html: effectiveTermsText
                .replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-medium">$1</span>')
                .replace(/\n/g, '<br />')
            }} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-center">
            <a
              href={effectiveTermsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg"
            >
              Ler contrato completo em PDF
              <Upload className="w-3 h-3 rotate-90 transition-transform group-hover:-translate-y-0.5" />
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl transition-colors hover:bg-blue-500/10">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/50 cursor-pointer transition-all"
            />
          </div>
          <Label htmlFor="terms" className="flex-1 cursor-pointer select-none">
            <span className="text-slate-200 text-sm font-medium block">
              Declaro que li e concordo com os termos de adesão.
            </span>
            <span className="text-slate-500 text-xs block mt-1">
              *Ao marcar esta caixa, você assina digitalmente este contrato e concorda com todas as cláusulas apresentadas.
            </span>
          </Label>
        </div>
      </div>
    </div>
  );

  const renderObservacoes = () => (
    <div className="space-y-5">
      <FieldTextarea label="Observações adicionais para a prescrição alimentar" value={form.anamnese.observacao_alimentar || ''} onChange={v => updateAnamnese('observacao_alimentar', v)} rows={4} />
      <FieldTextarea label="Observações para a prescrição dos treinos" value={form.anamnese.observacao_treinos || ''} onChange={v => updateAnamnese('observacao_treinos', v)} rows={4} />
      <FieldTextarea label="Observações gerais" value={form.observacao} onChange={v => updateField('observacao', v)} rows={3} />
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-xl">🤝</span> Indicações
        </h3>
        <p className="text-slate-400 text-xs">
          Teria 2 ou 3 amigos/familiares para indicar que gostariam de ter um acompanhamento como o nosso?
        </p>
        <FieldTextarea
          label=""
          labelClassName="hidden"
          value={form.anamnese.indicacoes_amigos || ''}
          onChange={v => updateAnamnese('indicacoes_amigos', v)}
          placeholder="Nome - Telefone"
          rows={3}
        />
      </div>
      {renderTermsBlock()}
    </div>
  );

  const renderStepContent = () => {
    // Se tem flow customizado, usar renderização dinâmica
    if (useCustomFlow) {
      return renderDynamicSection(step - 1);
    }

    // Fallback: renderização hardcoded original
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${step === s.id
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
