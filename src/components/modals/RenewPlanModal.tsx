import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, RefreshCw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePatients, usePlans } from "@/hooks/use-supabase-data";

const renewPlanSchema = z.object({
  plan_id: z.string().min(1, "Plano é obrigatório"),
  follow_up_duration_months: z.number().min(1, "Duração mínima: 1 mês").max(24, "Duração máxima: 24 meses"),
});

type RenewPlanFormData = z.infer<typeof renewPlanSchema>;

interface RenewPlanModalProps {
  patient: any;
  open: boolean;
  onClose: () => void;
  onRenew?: (patientId: string, data: RenewPlanFormData) => void;
}

export function RenewPlanModal({ patient, open, onClose, onRenew }: RenewPlanModalProps) {
  const { toast } = useToast();
  const { plans } = usePlans();
  const { updatePatient } = usePatients();

  const form = useForm<RenewPlanFormData>({
    resolver: zodResolver(renewPlanSchema),
    defaultValues: {
      plan_id: patient?.plan_id || "",
      follow_up_duration_months: patient?.follow_up_duration_months || 6,
    },
  });

  const onSubmit = async (data: RenewPlanFormData) => {
    if (!patient) return;

    try {
      // Calcular nova data de expiração
      const currentDate = new Date();
      const newExpirationDate = new Date(currentDate);
      newExpirationDate.setMonth(newExpirationDate.getMonth() + data.follow_up_duration_months);
      
      // Calcular dias para expiração
      const daysToExpiration = Math.ceil((newExpirationDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      await updatePatient(patient.id, {
        plan_id: data.plan_id,
        follow_up_duration_months: data.follow_up_duration_months,
        expiration_date: newExpirationDate.toISOString().split('T')[0],
        days_to_expiration: daysToExpiration,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: "Sucesso",
        description: "Plano renovado com sucesso!",
      });

      onRenew?.(patient.id, data);
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível renovar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    onClose();
  };

  if (!patient) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Renovar Plano
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Renovar o plano de acompanhamento para {patient.full_name || 'o paciente'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans
                        .filter(plan => plan.active)
                        .map(plan => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.type} ({plan.period})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="follow_up_duration_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração do Acompanhamento (meses)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      placeholder="Ex: 6"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Duração em meses do acompanhamento (1-24 meses)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Informações da Renovação:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• A data de expiração será recalculada automaticamente</p>
                <p>• O status do paciente será atualizado</p>
                <p>• O histórico será mantido</p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-premium">
                <RefreshCw className="w-4 h-4 mr-2" />
                Renovar Plano
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
