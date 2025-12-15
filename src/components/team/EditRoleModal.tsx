import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TeamRole, teamService } from '@/lib/team-service';
import { Loader2, AlertTriangle } from 'lucide-react';
import { PermissionsEditor } from './PermissionsEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

interface EditRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: TeamRole;
  onSuccess: () => void;
}

export function EditRoleModal({ open, onOpenChange, role, onSuccess }: EditRoleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, any>>(role.permissions);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role.name,
      description: role.description,
    },
  });

  useEffect(() => {
    if (role) {
      form.reset({
        name: role.name,
        description: role.description,
      });
      setPermissions(role.permissions);
    }
  }, [role, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      await teamService.updateRole(role.id, {
        name: data.name,
        description: data.description,
        permissions,
      });

      toast({
        title: 'Perfil atualizado!',
        description: `O perfil "${data.name}" foi atualizado com sucesso.`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Perfil de Acesso</DialogTitle>
          <DialogDescription className="text-slate-400">
            Atualize as informações e permissões do perfil
          </DialogDescription>
        </DialogHeader>

        {role.is_system_role && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este é um perfil do sistema. Alterações podem afetar o funcionamento do sistema.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Nome do Perfil *</FormLabel>
                  <FormControl>
                    <Input className="bg-slate-700 border-slate-600 text-white" placeholder="Ex: Nutricionista Sênior" {...field} />
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
                  <FormLabel className="text-slate-300">Descrição *</FormLabel>
                  <FormControl>
                    <Textarea className="bg-slate-700 border-slate-600 text-white" placeholder="Descreva as responsabilidades deste perfil..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <h4 className="font-medium">Permissões</h4>
              <PermissionsEditor
                initialPermissions={permissions}
                onChange={setPermissions}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-slate-900">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


