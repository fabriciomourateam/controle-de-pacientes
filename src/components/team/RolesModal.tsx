import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TeamRole } from '@/lib/team-service';
import { Shield, Check, Edit, Plus } from 'lucide-react';
import { EditRoleModal } from './EditRoleModal';
import { CreateRoleModal } from './CreateRoleModal';

interface RolesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: TeamRole[];
  onRoleUpdated?: () => void;
}

export function RolesModal({ open, onOpenChange, roles, onRoleUpdated }: RolesModalProps) {
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const getPermissionsList = (permissions: Record<string, any>): string[] => {
    const list: string[] = [];
    
    Object.entries(permissions).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value) {
        list.push(formatPermissionKey(key));
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue) {
            list.push(`${formatPermissionKey(key)}: ${formatPermissionKey(subKey)}`);
          }
        });
      }
    });
    
    return list;
  };

  const formatPermissionKey = (key: string): string => {
    const translations: Record<string, string> = {
      dashboard: 'Dashboard',
      patients: 'Pacientes',
      checkins: 'Check-ins',
      diets: 'Planos Alimentares',
      metrics: 'Métricas',
      reports: 'Relatórios',
      team: 'Equipe',
      settings: 'Configurações',
      billing: 'Faturamento',
      view: 'Visualizar',
      create: 'Criar',
      edit: 'Editar',
      delete: 'Deletar',
      release: 'Liberar',
      view_sales: 'Ver vendas',
      view_retention: 'Ver retenção',
      export: 'Exportar',
      clinical: 'Clínicos',
      financial: 'Financeiros',
      account: 'Conta',
      integrations: 'Integrações',
      manage: 'Gerenciar',
    };
    
    return translations[key] || key;
  };

  const handleRoleUpdated = () => {
    if (onRoleUpdated) {
      onRoleUpdated();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Perfis de Acesso
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Gerencie os perfis de acesso e suas permissões
                </DialogDescription>
              </div>
              <Button 
                onClick={() => setCreateModalOpen(true)} 
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Perfil
              </Button>
            </div>
          </DialogHeader>

          <div className="grid gap-4 mt-4">
            {roles.map((role) => {
              const permissionsList = getPermissionsList(role.permissions);
              
              return (
                <Card key={role.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-white">
                          {role.name}
                          {role.is_system_role && (
                            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">
                              Sistema
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1 text-slate-400">
                          {role.description}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                        className="hover:bg-slate-700 text-slate-300"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-400 mb-3">
                        Permissões ({permissionsList.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissionsList.map((permission, index) => (
                          <div 
                            key={index} 
                            className="flex items-center gap-2 text-sm p-2 rounded-md bg-slate-700/50 text-slate-300"
                          >
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      {editingRole && (
        <EditRoleModal
          open={!!editingRole}
          onOpenChange={(open) => !open && setEditingRole(null)}
          role={editingRole}
          onSuccess={() => {
            setEditingRole(null);
            handleRoleUpdated();
          }}
        />
      )}

      {/* Modal de Criação */}
      <CreateRoleModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false);
          handleRoleUpdated();
        }}
      />
    </>
  );
}

