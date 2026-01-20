import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, User, Phone, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAutoSave } from "@/hooks/use-auto-save";
import { patientSchema, PatientFormData } from "@/lib/validation-schemas";
import { usePlans } from "@/hooks/use-supabase-data";
import { cn } from "@/lib/utils";

interface PatientFormProps {
  patient?: PatientFormData & { id: string };
  trigger: React.ReactNode;
  onSave: (data: PatientFormData) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PatientForm({ patient, trigger, onSave, open: externalOpen, onOpenChange }: PatientFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { plans, loading: plansLoading } = usePlans();
  
  // Usar estado externo se fornecido, senão usar interno
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient ? {
      ...patient,
      vencimento: patient.vencimento ? new Date(patient.vencimento) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      data_nascimento: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
    } : {
      nome: "",
      apelido: "",
      cpf: "",
      email: "",
      telefone: "",
      telefone_filtro: "",
      genero: undefined,
      data_nascimento: undefined,
      plano: "",
      tempo_acompanhamento: 3,
      vencimento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 meses
      valor: undefined,
      observacao: "",
      objetivo: "",
      peso: undefined,
      medida: undefined,
    },
  });

  // Resetar formulário apenas quando o modal abre/fecha ou quando o ID do paciente muda
  useEffect(() => {
    if (open) {
      if (patient) {
        const formData = {
          ...patient,
          vencimento: patient.vencimento ? new Date(patient.vencimento) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          data_nascimento: patient.data_nascimento ? new Date(patient.data_nascimento) : undefined,
        };
        form.reset(formData);
      } else {
        form.reset({
          nome: "",
          apelido: "",
          cpf: "",
          email: "",
          telefone: "",
          telefone_filtro: "",
          genero: undefined,
          data_nascimento: undefined,
          plano: "",
          tempo_acompanhamento: 3,
          vencimento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          valor: undefined,
          observacao: "",
          objetivo: "",
          peso: undefined,
          medida: undefined,
        });
      }
    }
  }, [open, patient?.id]);

  // Auto-save desabilitado - causava conflitos com edição manual
  // const { isSaving } = useAutoSave({
  //   data: form.watch(),
  //   onSave: async (data) => {
  //     if (patient && form.formState.isValid) {
  //       await onSave(data);
  //     }
  //   },
  //   enabled: !!patient && form.formState.isDirty,
  //   delay: 3000,
  // });
  const isSaving = false;

  const activePlans = plans.filter(p => p.active);

  const handleSubmit = async (data: PatientFormData) => {
    setLoading(true);
    try {
      await onSave(data);
      toast({
        title: patient ? "Paciente atualizado" : "Paciente criado",
        description: `${data.nome} foi ${patient ? "atualizado" : "adicionado"} com sucesso.`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50 animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-blue-400" />
              {patient ? "Editar Paciente" : "Novo Paciente"}
              {isSaving && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-3 h-3 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" />
                  Salvando automaticamente...
                </div>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Preencha as informações do paciente. {patient ? "Clique em 'Atualizar Paciente' para salvar as alterações." : ""}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nome Completo *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: João Silva Santos"
                          {...field}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o telefone"
                          {...field}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone_filtro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Telefone Filtro
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-xs">
                              ?
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Telefone alternativo para filtros e buscas</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Telefone alternativo (opcional)"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Plano de Acompanhamento *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                            <SelectValue placeholder="Selecione o plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plansLoading ? (
                            <SelectItem value="loading" disabled>
                              Carregando planos...
                            </SelectItem>
                          ) : activePlans.length === 0 ? (
                            <SelectItem value="no-plans" disabled>
                              Nenhum plano disponível
                            </SelectItem>
                          ) : (
                            activePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.name}>
                                {plan.name} - {plan.period}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempo_acompanhamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duração (meses) *
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="w-4 h-4 rounded-full bg-slate-600 text-slate-300 flex items-center justify-center text-xs">
                              ?
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Período de acompanhamento de 1 a 24 meses</p>
                          </TooltipContent>
                        </Tooltip>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={24}
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              <FormField
                control={form.control}
                name="vencimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Expiração *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-surface border-border",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-900/95 backdrop-blur-sm border-slate-700/50" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Data em que o acompanhamento expira
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Novos campos para estrutura expandida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="apelido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Apelido</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: João"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="joao@email.com"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o CPF"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="genero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Gênero</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Feminino">Feminino</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data de Nascimento
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal bg-surface border-border hover:bg-surface-hover",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="30"
                          max="300"
                          placeholder="70.5"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medida"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Medida (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="175.0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="objetivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Objetivo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Perder peso, ganhar massa muscular..."
                        {...field}
                        value={field.value || ''}
                        className="bg-slate-800/50 border-slate-600/50 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Observações</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observações adicionais..."
                        {...field}
                        value={field.value || ''}
                        className="bg-slate-800/50 border-slate-600/50 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 mr-2" />
                      {patient ? "Atualizar" : "Criar"} Paciente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
