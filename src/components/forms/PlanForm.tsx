import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/use-supabase-data";

const planSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["BASIC", "PREMIUM"], {
    required_error: "Tipo é obrigatório",
  }),
  period: z.enum(["Mensal", "Bimestral", "Trimestral", "Semestral", "Anual"], {
    required_error: "Período é obrigatório",
  }),
  category: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planSchema>;

interface PlanFormProps {
  plan?: any;
  trigger?: React.ReactNode;
  onSave?: (plan: any) => void;
  onCancel?: () => void;
}

export function PlanForm({ plan, trigger, onSave, onCancel }: PlanFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { createPlan, updatePlan } = usePlans();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      type: "BASIC",
      period: "Mensal",
      category: "",
      description: "",
      active: true,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name || "",
        type: plan.type || "BASIC",
        period: plan.period || "Mensal",
        category: plan.category || "",
        description: plan.description || "",
        active: plan.active ?? true,
      });
      // Se plan for fornecido, abrir modal automaticamente
      if (!open) {
        setOpen(true);
      }
    } else if (!plan && open) {
      // Se não há plan mas modal está aberto (criação), resetar formulário
      form.reset({
        name: "",
        type: "BASIC",
        period: "Mensal",
        category: "",
        description: "",
        active: true,
      });
    }
  }, [plan]);

  const onSubmit = async (data: PlanFormData) => {
    try {
      if (plan) {
        await updatePlan(plan.id, data);
        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso! Todos os pacientes usando este plano foram atualizados automaticamente.",
        });
      } else {
        await createPlan(data);
        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso!",
        });
      }
      
      setOpen(false);
      form.reset();
      onSave?.(data);
      onCancel?.(); // Chamar onCancel para limpar estado no componente pai
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setOpen(false);
    form.reset();
    onCancel?.();
  };

  // Se plan for fornecido, sempre mostrar o modal aberto
  const isOpen = plan ? open : open;
  
  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      if (!plan) {
        setOpen(newOpen);
      } else if (!newOpen) {
        // Se fechar e for edição, chamar onCancel
        onCancel?.();
      }
    }}>
      {trigger && !plan && (
        <div onClick={() => setOpen(true)}>
          {trigger}
        </div>
      )}
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white text-white">
            {plan ? "Editar Plano" : "Novo Plano"}
          </DialogTitle>
          <DialogDescription>
            {plan ? "Atualize as informações do plano" : "Crie um novo plano de acompanhamento"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Plano</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: PREMIUM (Anual)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BASIC">BASIC</SelectItem>
                        <SelectItem value="PREMIUM">PREMIUM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o período" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Bimestral">Bimestral</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Iniciante, Avançado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os benefícios do plano..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Plano Ativo</FormLabel>
                    <FormDescription>
                      Desmarque para desativar o plano
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium">
                {plan ? "Atualizar" : "Criar"} Plano
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
