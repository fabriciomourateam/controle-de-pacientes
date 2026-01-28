import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Utensils, Calendar, CheckCircle, Star, Copy, Trash2, Save, 
  Edit, Eye, X, Power, PowerOff, MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { calcularTotaisPlano } from '@/utils/diet-calculations';

interface CompactDietPlanCardProps {
  plan: any;
  onEdit: (plan: any) => void;
  onDelete: (planId: string, planName: string) => void;
  onViewDetails: (plan: any) => void;
  onToggleFavorite: (planId: string, currentFavorite: boolean) => void;
  onToggleStatus: (planId: string, planName: string, currentStatus: string) => void;
  onToggleReleased: (planId: string, planName: string, currentReleased: boolean) => void;
  onDuplicate: (plan: any) => void;
  onSaveAsTemplate: (planId: string) => void;
}

export function CompactDietPlanCard({
  plan,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleFavorite,
  onToggleStatus,
  onToggleReleased,
  onDuplicate,
  onSaveAsTemplate,
}: CompactDietPlanCardProps) {
  const isActive = plan.status === 'active' || plan.active;
  const totais = calcularTotaisPlano(plan);

  return (
    <Card 
      className={`
        bg-gradient-to-br from-slate-50 to-gray-50 border hover:shadow-lg transition-all duration-300 overflow-hidden
        ${isActive ? 'border-[#00C98A]/30 shadow-[#00C98A]/10' : 'border-gray-200 opacity-90 hover:opacity-100'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Botão Toggle para Liberar no Portal - LADO ESQUERDO */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleReleased(plan.id, plan.name, plan.is_released)}
            className={`h-10 w-10 p-0 flex-shrink-0 rounded-lg border-2 transition-all duration-300 ${
              plan.is_released
                ? 'bg-green-500/10 border-green-500 hover:bg-green-500/20'
                : 'bg-gray-100 border-gray-300 hover:bg-gray-200'
            }`}
            title={plan.is_released ? 'Clique para ocultar do portal' : 'Clique para liberar no portal'}
          >
            {plan.is_released ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-gray-400" />
            )}
          </Button>
          
          {/* Informações principais */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <h3 className="text-base font-bold text-[#222222] flex items-center gap-2 flex-shrink-0">
                <Utensils className={`w-4 h-4 ${isActive ? 'text-[#00C98A]' : 'text-gray-400'}`} />
                {plan.name}
              </h3>
            </div>
            
            {/* Macros em mini cards alinhados - DEPOIS DO TÍTULO */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span className="text-[11px] font-medium text-orange-700 uppercase">Calorias</span>
                </div>
                <div className="font-bold text-base text-[#222222]">{totais.calorias.toLocaleString('pt-BR')}</div>
                <div className="text-[11px] text-orange-600">kcal</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-medium text-blue-700 uppercase">Proteína</span>
                </div>
                <div className="font-bold text-base text-[#222222]">{totais.proteinas.toFixed(0)}</div>
                <div className="text-[11px] text-blue-600">gramas</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-[11px] font-medium text-purple-700 uppercase">Carboidrato</span>
                </div>
                <div className="font-bold text-base text-[#222222]">{totais.carboidratos.toFixed(0)}</div>
                <div className="text-[11px] text-purple-600">gramas</div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-700 uppercase">Gordura</span>
                </div>
                <div className="font-bold text-base text-[#222222]">{totais.gorduras.toFixed(0)}</div>
                <div className="text-[11px] text-emerald-600">gramas</div>
              </div>
            </div>
            
            {/* Apenas badge de Favorito */}
            {plan.favorite && (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-yellow-500/50 text-yellow-600 bg-yellow-50 text-xs h-5">
                  <Star className="w-3 h-3 mr-1 fill-yellow-500" />
                  Favorito
                </Badge>
              </div>
            )}
            
            {plan.notes && (
              <p className="text-xs text-[#777777] line-clamp-1 mb-2">{plan.notes}</p>
            )}
            
            {/* Data de criação */}
            <div className="flex items-center gap-1 text-xs text-[#777777]">
              <Calendar className="w-3 h-3" />
              {new Date(plan.created_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleFavorite(plan.id, plan.favorite)}
                className="h-8 w-8 p-0 hover:bg-slate-100"
              >
                <Star className={`w-4 h-4 ${plan.favorite ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-slate-100 border border-slate-300 bg-slate-50"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onViewDetails(plan)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSaveAsTemplate(plan.id)}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar como Template
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onToggleStatus(plan.id, plan.name, plan.status)}
                  >
                    {isActive ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-2" />
                        Desativar Plano
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-2" />
                        Ativar Plano
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(plan.id, plan.name)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Botões de Editar e Duplicar separados */}
            <div className="flex flex-col items-end gap-1 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(plan)}
                className="h-7 w-full text-xs border-gray-300 text-gray-700 hover:bg-gray-100 bg-white shadow-sm justify-center"
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(plan)}
                className="h-7 w-full text-xs border-gray-300 text-gray-700 hover:bg-gray-100 bg-white shadow-sm justify-center"
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
