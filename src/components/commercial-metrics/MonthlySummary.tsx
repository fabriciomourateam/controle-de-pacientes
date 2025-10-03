import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyData {
  current: number;
  previous: number;
  growth: number;
}

interface MonthlySummaryProps {
  monthlyLeads: MonthlyData;
  monthlyCalls: MonthlyData;
  conversionRate: number;
}

export function MonthlySummary({ monthlyLeads, monthlyCalls, conversionRate }: MonthlySummaryProps) {
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardHeader>
        <CardTitle className="text-white">Resumo Mensal</CardTitle>
        <CardDescription className="text-slate-400">
          Comparação com o mês anterior e métricas de performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Leads Mensais */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-400">LEADS</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Este mês:</span>
                <span className="font-semibold text-white">{monthlyLeads.current.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Mês anterior:</span>
                <span className="text-slate-400">{monthlyLeads.previous.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Crescimento:</span>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(monthlyLeads.growth)}
                  <span className={`font-semibold ${getGrowthColor(monthlyLeads.growth)}`}>
                    {monthlyLeads.growth >= 0 ? '+' : ''}{monthlyLeads.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Calls Mensais */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-400">CALLS</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Este mês:</span>
                <span className="font-semibold text-white">{monthlyCalls.current.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Mês anterior:</span>
                <span className="text-slate-400">{monthlyCalls.previous.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Crescimento:</span>
                <div className="flex items-center gap-1">
                  {getGrowthIcon(monthlyCalls.growth)}
                  <span className={`font-semibold ${getGrowthColor(monthlyCalls.growth)}`}>
                    {monthlyCalls.growth >= 0 ? '+' : ''}{monthlyCalls.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-400">CONVERSÃO</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Taxa atual:</span>
                <Badge 
                  variant={conversionRate >= 15 ? "default" : conversionRate >= 10 ? "secondary" : "destructive"}
                  className={`text-sm ${conversionRate >= 15 ? "bg-green-600 text-white" : conversionRate >= 10 ? "bg-slate-700/50 text-slate-300" : "bg-red-600 text-white"}`}
                >
                  {conversionRate.toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Meta ideal:</span>
                <span className="text-slate-400">15%+</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Status:</span>
                <Badge 
                  variant={conversionRate >= 15 ? "default" : conversionRate >= 10 ? "secondary" : "destructive"}
                  className={conversionRate >= 15 ? "bg-green-600 text-white" : conversionRate >= 10 ? "bg-slate-700/50 text-slate-300" : "bg-red-600 text-white"}
                >
                  {conversionRate >= 15 ? "Excelente" : conversionRate >= 10 ? "Bom" : "Precisa melhorar"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <h5 className="font-semibold text-sm mb-2 text-white">💡 Insights</h5>
          <ul className="text-sm text-slate-300 space-y-1">
            {monthlyLeads.growth > 0 && (
              <li>• Crescimento positivo de {monthlyLeads.growth.toFixed(1)}% nos leads</li>
            )}
            {monthlyCalls.growth > 0 && (
              <li>• Aumento de {monthlyCalls.growth.toFixed(1)}% nas calls agendadas</li>
            )}
            {conversionRate >= 15 && (
              <li>• Taxa de conversão excelente! Mantenha o foco na qualidade dos leads</li>
            )}
            {conversionRate < 10 && (
              <li>• Considere revisar o processo de qualificação de leads</li>
            )}
            {monthlyLeads.growth < 0 && (
              <li>• Atenção: redução de {Math.abs(monthlyLeads.growth).toFixed(1)}% nos leads</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
