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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useTeam } from '@/hooks/use-team';
import { TeamRole } from '@/lib/team-service';
import { Mail, Key, Loader2, Settings } from 'lucide-react';
import { PermissionsEditor } from './PermissionsEditor';

const formSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  role_id: z.string().min(1, 'Selecione um perfil'),
  password: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  roles: TeamRole[];
}

export function AddMemberModal({ open, onOpenChange, onSuccess, roles }: AddMemberModalProps) {
  const { toast } = useToast();
  const { addMember } = useTeam();
  const [loading, setLoading] = useState(false);
  const [addMethod, setAddMethod] = useState<'direct' | 'invite'>('direct');
  const [customizePermissions, setCustomizePermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<Record<string, any> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role_id: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (addMethod === 'direct' && !data.password) {
        toast({
          title: 'Senha obrigatória',
          description: 'Para cadastro direto, informe uma senha.',
          variant: 'destructive',
        });
        return;
      }

      await addMember({
        name: data.name,
        email: data.email,
        role_id: data.role_id,
        password: addMethod === 'direct' ? data.password : undefined,
        send_invite: addMethod === 'invite',
        permissions: customPermissions || undefined,
      });

      toast({
        title: 'Membro adicionado!',
        description: addMethod === 'direct' 
          ? `${data.name} foi cadastrado e já pode acessar o sistema.`
          : `Convite enviado para ${data.email}.`,
      });

      form.reset();
      setCustomizePermissions(false);
      setCustomPermissions(null);
      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro ao adicionar membro',
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
          <DialogTitle className="text-white">Adicionar Membro da Equipe</DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione um novo membro e defina suas permissões de acesso
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informação sobre o método */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white mb-1">Convite por Email</h4>
                  <p className="text-sm text-slate-400">
                    O membro receberá um email com um link para criar sua senha e acessar o sistema.
                  </p>
                </div>
              </div>
            </div>

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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {addMethod === 'direct' && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Senha *</FormLabel>
                      <FormControl>
                        <Input className="bg-slate-700 border-slate-600 text-white" type="password" 
                          placeholder="Mínimo 6 caracteres" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-slate-400">
                        O membro poderá alterar a senha após o primeiro acesso
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                      onClick={() => setCustomizePermissions(!customizePermissions)}
                    >
                      {customizePermissions ? 'Usar Padrão' : 'Personalizar'}
                    </Button>
                  </div>

                  {customizePermissions && (
                    <PermissionsEditor
                      initialPermissions={selectedRole.permissions}
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
                {addMethod === 'direct' ? 'Cadastrar Membro' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


