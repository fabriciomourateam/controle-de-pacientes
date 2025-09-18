import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
interface MetricsData {
  mes_numero: number;
  mes: string;
  ano: number;
  total_pacientes: number;
  pacientes_ativos: number;
  novos_pacientes: number;
  churn_rate: number;
  renovacao_rate: number;
}

interface MetricsTableProps {
  data: MetricsData[];
  loading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export function MetricsTable({ data, loading = false, onRefresh, onExport, isMinimized = false, onToggleMinimize }: MetricsTableProps) {

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Dados Detalhados</CardTitle>
          <CardDescription className="text-slate-400">
            Histórico completo de métricas mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-12 bg-slate-700/50 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Dados Detalhados</CardTitle>
          <CardDescription className="text-slate-400">
            Histórico completo de métricas mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
            <p className="text-sm text-slate-500">
              Os dados aparecerão conforme forem inseridos no sistema
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRenovacaoStatus = (valor: number) => {
    // Valor já vem multiplicado por 100 (90.5 = 90.5%)
    if (valor >= 70) return { label: 'Bom', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (valor >= 50) return { label: 'Regular', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Baixo', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  const getChurnStatus = (valor: number) => {
    // Valor já vem multiplicado por 100 (12.5 = 12.5%)
    if (valor < 3) return { label: 'Baixo', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (valor < 6) return { label: 'Regular', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Alto', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Dados Detalhados</CardTitle>
            <CardDescription className="text-slate-400">
              Histórico completo de métricas mensais
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onToggleMinimize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleMinimize}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                {isMinimized ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronUp className="w-4 h-4 mr-2" />
                )}
                {isMinimized ? 'Expandir' : 'Minimizar'}
              </Button>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isMinimized && (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                <TableHead className="text-slate-300">Período</TableHead>
                <TableHead className="text-slate-300">Pacientes Ativos</TableHead>
                <TableHead className="text-slate-300">Total Pacientes</TableHead>
                <TableHead className="text-slate-300">Novos Pacientes</TableHead>
                <TableHead className="text-slate-300">Taxa Renovação</TableHead>
                <TableHead className="text-slate-300">Taxa Churn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
                const renovacaoStatus = getRenovacaoStatus(item.renovacao_rate);
                const churnStatus = getChurnStatus(item.churn_rate);
                
                return (
                  <TableRow 
                    key={`${item.mes_numero}-${item.ano}` || index}
                    className="border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="text-white font-medium">
                      {item.mes}/{item.ano}
                    </TableCell>
                    <TableCell className="text-blue-400 font-medium">
                      {item.pacientes_ativos.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {item.total_pacientes.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-green-400">
                      {item.novos_pacientes.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${renovacaoStatus.color}`}
                      >
                        {item.renovacao_rate.toFixed(1)}% {renovacaoStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${churnStatus.color}`}
                      >
                        {item.churn_rate.toFixed(1)}% {churnStatus.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        )}
        {/* Resumo */}
        <div className={`${isMinimized ? 'mt-0' : 'mt-6'} p-4 bg-slate-800/30 rounded-lg border border-slate-700/50`}>
          <h4 className="text-sm font-medium text-white mb-3">Resumo do Período</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-slate-400">Total Novos Pacientes:</p>
              <p className="text-green-400 font-semibold">
                {data.reduce((acc, item) => acc + item.novos_pacientes, 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Pacientes Ativos Atuais:</p>
              <p className="text-blue-400 font-semibold">
                {data.length > 0 ? data[data.length - 1].pacientes_ativos.toLocaleString('pt-BR') : '0'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Renovação Média:</p>
              <p className="text-green-400 font-semibold">
                {data.length > 0 ? (data.reduce((acc, item) => acc + item.renovacao_rate, 0) / data.length).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div>
              <p className="text-slate-400">Churn Médio:</p>
              <p className="text-red-400 font-semibold">
                {data.length > 0 ? (data.reduce((acc, item) => acc + item.churn_rate, 0) / data.length).toFixed(1) : '0.0'}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


