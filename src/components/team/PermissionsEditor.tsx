import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PermissionsEditorProps {
  initialPermissions: Record<string, any>;
  onChange: (permissions: Record<string, any>) => void;
}

interface PermissionChild {
  label: string;
  description: string;
}

interface PermissionConfigBoolean {
  label: string;
  description: string;
  type: 'boolean';
}

interface PermissionConfigObject {
  label: string;
  type: 'object';
  children: Record<string, PermissionChild>;
}

type PermissionConfig = PermissionConfigBoolean | PermissionConfigObject;

const permissionsConfig: Record<string, PermissionConfig> = {
  dashboard: {
    label: 'Dashboard',
    description: 'Visualizar métricas e gráficos gerais',
    type: 'boolean',
  },
  patients: {
    label: 'Pacientes',
    type: 'object',
    children: {
      view: { label: 'Visualizar lista', description: 'Ver lista de pacientes' },
      create: { label: 'Adicionar novos', description: 'Cadastrar novos pacientes' },
      edit: { label: 'Editar dados', description: 'Modificar informações' },
      delete: { label: 'Deletar', description: 'Remover pacientes' },
    },
  },
  checkins: {
    label: 'Check-ins',
    type: 'object',
    children: {
      view: { label: 'Visualizar', description: 'Ver check-ins' },
      create: { label: 'Registrar novos', description: 'Criar check-ins' },
      edit: { label: 'Editar', description: 'Modificar check-ins' },
      delete: { label: 'Deletar', description: 'Remover check-ins' },
    },
  },
  diets: {
    label: 'Planos Alimentares',
    type: 'object',
    children: {
      view: { label: 'Visualizar', description: 'Ver planos' },
      create: { label: 'Criar novos', description: 'Criar planos' },
      edit: { label: 'Editar', description: 'Modificar planos' },
      delete: { label: 'Deletar', description: 'Remover planos' },
      release: { label: 'Liberar', description: 'Liberar para pacientes' },
    },
  },
  metrics: {
    label: 'Métricas Comerciais',
    type: 'object',
    children: {
      view_sales: { label: 'Visualizar vendas', description: 'Ver métricas de vendas' },
      view_retention: { label: 'Visualizar retenção', description: 'Ver retenção' },
      export: { label: 'Exportar', description: 'Exportar relatórios' },
    },
  },
  reports: {
    label: 'Relatórios',
    type: 'object',
    children: {
      clinical: { label: 'Relatórios clínicos', description: 'Gerar relatórios clínicos' },
      financial: { label: 'Relatórios financeiros', description: 'Gerar relatórios financeiros' },
      export: { label: 'Exportar', description: 'Exportar relatórios' },
    },
  },
  team: {
    label: 'Gestão de Equipe',
    type: 'object',
    children: {
      view: { label: 'Visualizar membros', description: 'Ver lista de membros' },
      create: { label: 'Adicionar membros', description: 'Convidar novos' },
      edit: { label: 'Editar membros', description: 'Modificar permissões' },
      delete: { label: 'Remover membros', description: 'Remover da equipe' },
    },
  },
  settings: {
    label: 'Configurações',
    type: 'object',
    children: {
      account: { label: 'Dados da conta', description: 'Alterar informações' },
      integrations: { label: 'Integrações', description: 'Configurar webhooks' },
    },
  },
  billing: {
    label: 'Faturamento',
    type: 'object',
    children: {
      view: { label: 'Visualizar plano', description: 'Ver plano atual' },
      manage: { label: 'Gerenciar plano', description: 'Alterar plano' },
    },
  },
};

export function PermissionsEditor({ initialPermissions, onChange }: PermissionsEditorProps) {
  const [permissions, setPermissions] = useState<Record<string, any>>(initialPermissions);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    onChange(permissions);
  }, [permissions, onChange]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleBooleanChange = (key: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleObjectChange = (parent: string, child: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [child]: checked,
      },
    }));
  };

  const toggleAllChildren = (parent: string, checked: boolean) => {
    const config = permissionsConfig[parent as keyof typeof permissionsConfig];
    if (config.type === 'object' && config.children) {
      const newChildren: Record<string, boolean> = {};
      Object.keys(config.children).forEach(key => {
        newChildren[key] = checked;
      });
      setPermissions(prev => ({
        ...prev,
        [parent]: newChildren,
      }));
    }
  };

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {Object.entries(permissionsConfig).map(([key, config]) => {
        if (config.type === 'boolean') {
          return (
            <div key={key} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50">
              <Checkbox
                id={key}
                checked={permissions[key] === true}
                onCheckedChange={(checked) => handleBooleanChange(key, checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor={key} className="font-medium cursor-pointer">
                  {config.label}
                </Label>
                {'description' in config && (
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                )}
              </div>
            </div>
          );
        }

        if (config.type === 'object' && 'children' in config && config.children) {
          const isExpanded = expandedSections.has(key);
          const childrenValues = permissions[key] || {};
          const allChecked = Object.keys(config.children).every(
            childKey => childrenValues[childKey] === true
          );
          const someChecked = Object.keys(config.children).some(
            childKey => childrenValues[childKey] === true
          );

          return (
            <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleSection(key)}>
              <div className="border rounded-lg">
                <div className="w-full p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <button className="p-0 hover:bg-transparent">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Checkbox
                        checked={allChecked}
                        onCheckedChange={(checked) => {
                          toggleAllChildren(key, checked as boolean);
                        }}
                      />
                      <Label className="font-medium cursor-pointer">
                        {config.label}
                      </Label>
                    </div>
                    {someChecked && !allChecked && (
                      <span className="text-xs text-muted-foreground">Parcial</span>
                    )}
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="p-3 pt-0 space-y-2 border-t">
                    {config.type === 'object' && config.children && Object.entries(config.children).map(([childKey, childConfig]) => (
                      <div key={childKey} className="flex items-center space-x-2 pl-6">
                        <Checkbox
                          id={`${key}-${childKey}`}
                          checked={childrenValues[childKey] === true}
                          onCheckedChange={(checked) => 
                            handleObjectChange(key, childKey, checked as boolean)
                          }
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`${key}-${childKey}`} 
                            className="text-sm cursor-pointer"
                          >
                            {childConfig.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {childConfig.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        }

        return null;
      })}
    </div>
  );
}
