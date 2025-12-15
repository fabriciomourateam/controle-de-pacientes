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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTeam } from '@/hooks/use-team';
import { TeamMember, TeamRole } from '@/lib/team-service';
import { Loader2, Settings } from 'lucide-react';
import { PermissionsEditor } from './PermissionsEditor';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  role_id: z.string().min(1, 'Selecione um perfil'),
});

type FormData = z.infer<typeof formSchema>;

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  roles: TeamRole[];
  onSuccess: () => void;
}

export function EditMemberModal({ open, onOpenChange, member, roles, onSuccess }: EditMemberModalProps) {
  const { toast } = useToast();
  const { updateMember } = useTeam();
  const [loading, setLoading] = useState(false);
  const [customizePermissions, setCustomizePermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<Record<string, any> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: member.name,
      email: member.email,
      role_id: member.role_id,
    },
  });

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name,
        email: member.email,
        role_id: member.role_id,
      });
      setCustomPermissions(member.permissions || null);
      setCustomizePermissions(!!member.permissions);
    }
  }, [member, form]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      await updateMember(member.id, {
        name: data.name,
        email: data.email,
        role_id: data.role_id,
        permissions: customizePermissions ? customPermissions : null,
      });

      toast({
        title: 'Membro atualizado!',
        description: `As informações de ${data.name} foram atualizadas.`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao atualizar membro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === form.watch('role_id'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Membro da Equipe</DialogTitle>
          <DialogDescription className="text-slate-400">
            Atualize as informações e permissões de {member.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados do Membro */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Nome Completo *</FormLabel>
                    <FormControl>
                      <Input className="bg-slate-700 border-slate-600 text-white" placeholder="Ex: João Silva" {...field} />
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
                    <FormLabel className="text-slate-300">Email *</FormLabel>
                    <FormControl>
                      <Input className="bg-slate-700 border-slate-600 text-white" type="email" placeholder="joao@email.com" {...field} />
                    </FormControl>
                    <FormDescription className="text-slate-400">
                      O email não pode ser alterado se o usuário já tiver acessado o sistema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Perfil de Acesso *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div>
                              <div className="font-medium">{role.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {role.description}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personalizar Permissões */}
              {selectedRole && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Permissões
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {customizePermissions 
                          ? 'Permissões personalizadas' 
                          : `Usando permissões do perfil "${selectedRole.name}"`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCustomizePermissions(!customizePermissions);
                        if (!customizePermissions) {
                          setCustomPermissions(selectedRole.permissions);
                        }
                      }}
                    >
                      {customizePermissions ? 'Usar Padrão' : 'Personalizar'}
                    </Button>
                  </div>

                  {customizePermissions && (
                    <PermissionsEditor
                      initialPermissions={customPermissions || selectedRole.permissions}
                      onChange={setCustomPermissions}
                    />
                  )}
                </div>
              )}
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


