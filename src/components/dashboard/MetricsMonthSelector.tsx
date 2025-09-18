import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle, X, Filter } from "lucide-react";
import { useState } from "react";

interface MonthData {
  mes_numero: number;
  mes: string;
  ano: number;
  total_pacientes: number;
  pacientes_ativos: number;
  novos_pacientes: number;
  churn_rate: number;
  renovacao_rate: number;
}

interface MetricsMonthSelectorProps {
  availableMonths: MonthData[];
  selectedMonths: number[];
  onToggleMonth: (monthNumber: number) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  loading?: boolean;
}

export function MetricsMonthSelector({ 
  availableMonths, 
  selectedMonths,
  onToggleMonth, 
  onSelectAll, 
  onClearAll,
  loading = false 
}: MetricsMonthSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const selectedCount = selectedMonths.length;
  const hasSelection = selectedCount > 0;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <CardTitle className="text-sm text-white">
              Filtro de Meses - Página de Métricas
            </CardTitle>
            {hasSelection && (
              <Badge variant="secondary" className="ml-2 bg-blue-600/20 text-blue-300 border-blue-500/30">
                {selectedCount} {selectedCount === 1 ? 'mês' : 'meses'}
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 px-2 text-slate-400 hover:text-white"
          >
            {isExpanded ? 'Recolher' : 'Expandir'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Informações dos meses disponíveis */}
        <div className="text-xs text-slate-400">
          Meses com dados: {availableMonths.length} | Pacientes atuais: {availableMonths.length > 0 ? availableMonths[availableMonths.length - 1].pacientes_ativos : 0}
        </div>

        {/* Seleção rápida */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={loading}
            className="h-7 px-2 text-xs border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Todos ({availableMonths.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={loading}
            className="h-7 px-2 text-xs border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        </div>

        {/* Meses selecionados (sempre visível) */}
        {hasSelection && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400">Meses selecionados:</div>
            <div className="flex flex-wrap gap-1">
              {availableMonths
                .filter(month => selectedMonths.includes(month.mes_numero))
                .map(month => (
                  <Badge
                    key={month.mes_numero}
                    variant="default"
                    className="bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30 cursor-pointer text-xs"
                    onClick={() => onToggleMonth(month.mes_numero)}
                  >
                    {month.mes} ({month.pacientes_ativos})
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Lista completa de meses disponíveis */}
        {isExpanded && (
          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <div className="text-xs text-slate-400">Todos os meses disponíveis:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableMonths.map(month => (
                <div
                  key={month.mes_numero}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer border border-slate-700/30"
                  onClick={() => onToggleMonth(month.mes_numero)}
                >
                  <Checkbox
                    id={`month-${month.mes_numero}`}
                    checked={selectedMonths.includes(month.mes_numero)}
                    onChange={() => onToggleMonth(month.mes_numero)}
                    disabled={loading}
                    className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={`month-${month.mes_numero}`}
                      className={`text-sm cursor-pointer transition-colors block ${
                        selectedMonths.includes(month.mes_numero)
                          ? 'text-blue-300 font-medium' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {month.mes}
                    </label>
                    <div className="text-xs text-slate-500">
                      {month.pacientes_ativos} ativos • {month.churn_rate.toFixed(1)}% churn • {month.renovacao_rate.toFixed(1)}% renovação
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {!hasSelection && !loading && availableMonths.length > 0 && (
          <p className="text-xs text-slate-500 text-center py-2">
            Selecione os meses para filtrar as métricas
          </p>
        )}

        {availableMonths.length === 0 && !loading && (
          <p className="text-xs text-red-400 text-center py-2">
            ⚠️ Nenhum mês com dados encontrado. Execute a sincronização.
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-xs text-slate-400">Carregando meses...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
