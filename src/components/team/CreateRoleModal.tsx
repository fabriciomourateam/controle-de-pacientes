import { useState } from 'react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { teamService } from '@/lib/team-service';
import { Loader2 } from 'lucide-react';
import { PermissionsEditor } from './PermissionsEditor';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Permissões padrão para novo perfil (apenas visualização)
const defaultPermissions = {
  dashboard: true,
  patients: {
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
  checkins: {
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
  diets: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    release: false,
  },
  metrics: {
    view_sales: false,
    view_retention: false,
    export: false,
  },
  reports: {
    clinical: false,
    financial: false,
    export: false,
  },
  team: {
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  settings: {
    account: false,
    integrations: false,
  },
  billing: {
    view: false,
    manage: false,
  },
};

export function CreateRoleModal({ open, onOpenChange, onSuccess }: CreateRoleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, any>>(defaultPermissions);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      await teamService.createRole({
        name: data.name,
        description: data.description,
        permissions,
        is_system_role: false,
      });

      toast({
        title: 'Perfil criado!',
        description: `O perfil "${data.name}" foi criado com sucesso.`,
      });

      form.reset();
      setPermissions(defaultPermissions);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao criar perfil',
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
          <DialogTitle className="text-white">Criar Novo Perfil de Acesso</DialogTitle>
          <DialogDescription className="text-slate-400">
            Defina um novo perfil com permissões personalizadas
          </DialogDescription>
        </DialogHeader>

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
                  <FormDescription className="text-slate-400">
                    Escolha um nome descritivo para o perfil
                  </FormDescription>
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
                  <FormDescription className="text-slate-400">
                    Explique quando usar este perfil
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Permissões</h4>
                <p className="text-sm text-muted-foreground">
                  Configure as permissões que este perfil terá
                </p>
              </div>
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
                Criar Perfil
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


