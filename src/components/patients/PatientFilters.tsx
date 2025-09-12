import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface PatientFilters {
  plan?: string;
  plans?: string[]; // Novo: array de planos selecionados
  status?: 'active' | 'expired' | 'expiring_soon' | 'all';
  days_to_expire?: number;
  gender?: string;
  created_after?: Date;
  created_before?: Date;
  search?: string;
}

interface PatientFiltersProps {
  filters: PatientFilters;
  onFiltersChange: (filters: PatientFilters) => void;
  onReset: () => void;
  plans: string[];
}

export function PatientFilters({ filters, onFiltersChange, onReset, plans }: PatientFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<PatientFilters>(filters);
  const isInternalUpdate = useRef(false);

  // Atualizar localFilters apenas quando filters mudar externamente
  useEffect(() => {
    if (!isInternalUpdate.current) {
      setLocalFilters(filters);
    }
    isInternalUpdate.current = false;
  }, [filters]);

  const handleFilterChange = (key: keyof PatientFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    isInternalUpdate.current = true;
    onFiltersChange(newFilters);
  };

  const handlePlanToggle = (plan: string) => {
    const currentPlans = localFilters.plans || [];
    const newPlans = currentPlans.includes(plan)
      ? currentPlans.filter(p => p !== plan)
      : [...currentPlans, plan];
    
    const newFilters = { 
      ...localFilters, 
      plans: newPlans.length > 0 ? newPlans : undefined,
      plan: undefined // Limpar o filtro de plano único
    };
    
    
    setLocalFilters(newFilters);
    isInternalUpdate.current = true;
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: PatientFilters = {
      plan: undefined,
      plans: undefined
    };
    setLocalFilters(resetFilters);
    isInternalUpdate.current = true;
    onReset();
  };

  const getActiveFiltersCount = () => {
    const count = Object.entries(localFilters).filter(([key, value]) => {
      if (key === 'plans') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== '' && value !== null;
    }).length;
    
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Filter className="w-5 h-5 text-blue-400" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-8 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Busca por nome/telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search" className="text-slate-300">Buscar</Label>
              <Input
                id="search"
                placeholder="Nome, apelido ou telefone..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-slate-300">Gênero</Label>
              <Select
                value={localFilters.gender || 'all'}
                onValueChange={(value) => handleFilterChange('gender', value === 'all' ? undefined : value)}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Todos os gêneros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gêneros</SelectItem>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros de plano e status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Planos (múltipla seleção)</Label>
              <div className="mt-2 space-y-2 max-h-32 overflow-y-auto bg-slate-800/30 rounded-lg p-3 border border-slate-600/30">
                {plans.map((plan) => {
                  const isChecked = localFilters.plans?.includes(plan) || false;
                  return (
                    <div key={plan} className="flex items-center space-x-2">
                      <Checkbox
                        id={`plan-${plan}`}
                        checked={isChecked}
                        onCheckedChange={() => handlePlanToggle(plan)}
                        className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label 
                        htmlFor={`plan-${plan}`} 
                        className="text-slate-300 cursor-pointer flex-1"
                      >
                        {plan}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="text-slate-300">Status</Label>
              <Select
                value={localFilters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value as any)}
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expiring_soon">Vencendo em breve</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros de data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Data de criação - De</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50",
                      !localFilters.created_after && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.created_after ? (
                      format(localFilters.created_after, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={localFilters.created_after}
                    onSelect={(date) => handleFilterChange('created_after', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-slate-300">Data de criação - Até</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50",
                      !localFilters.created_before && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.created_before ? (
                      format(localFilters.created_before, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-600">
                  <Calendar
                    mode="single"
                    selected={localFilters.created_before}
                    onSelect={(date) => handleFilterChange('created_before', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro de dias para vencimento */}
          <div>
            <Label htmlFor="days_to_expire" className="text-slate-300">Vencendo em (dias)</Label>
            <Input
              id="days_to_expire"
              type="number"
              placeholder="Ex: 7 (próximos 7 dias)"
              value={localFilters.days_to_expire || ''}
              onChange={(e) => handleFilterChange('days_to_expire', e.target.value ? parseInt(e.target.value) : undefined)}
              className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Filtros ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-600/30">
              <span className="text-sm text-slate-400">Filtros ativos:</span>
              {localFilters.search && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Busca: {localFilters.search}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('search', undefined)}
                  />
                </Badge>
              )}
              {localFilters.plans && localFilters.plans.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                  Planos: {localFilters.plans.join(', ')}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('plans', undefined)}
                  />
                </Badge>
              )}
              {localFilters.plan && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/20 text-green-400 border-green-500/30">
                  Plano: {localFilters.plan}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('plan', undefined)}
                  />
                </Badge>
              )}
              {localFilters.status && localFilters.status !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                  Status: {localFilters.status}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('status', 'all')}
                  />
                </Badge>
              )}
              {localFilters.gender && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Gênero: {localFilters.gender}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('gender', undefined)}
                  />
                </Badge>
              )}
              {localFilters.days_to_expire && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
                  Vencendo em: {localFilters.days_to_expire} dias
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => handleFilterChange('days_to_expire', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
