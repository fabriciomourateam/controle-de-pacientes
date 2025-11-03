import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingDown, Snowflake, ChevronDown, ChevronUp } from "lucide-react";

interface ReasonData {
  motivo: string;
  count: number;
  percentage: number;
}

export function CancellationReasonsAnalysis() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [cancelamentoReasons, setCancelamentoReasons] = useState<ReasonData[]>([]);
  const [congelamentoReasons, setCongelamentoReasons] = useState<ReasonData[]>([]);
  const [showCancelamentos, setShowCancelamentos] = useState(false);
  const [showCongelamentos, setShowCongelamentos] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar motivos de cancelamento
      const { data: cancelamentos, error: errorCancel } = await supabase
        .from('patients')
        .select('motivo_cancelamento')
        .not('motivo_cancelamento', 'is', null)
        .not('data_cancelamento', 'is', null);

      // Buscar motivos de congelamento
      const { data: congelamentos, error: errorFreeze } = await supabase
        .from('patients')
        .select('motivo_congelamento')
        .not('motivo_congelamento', 'is', null)
        .not('data_congelamento', 'is', null);

      if (errorCancel || errorFreeze) {
        throw errorCancel || errorFreeze;
      }

      // Processar motivos de cancelamento
      const cancelMap = new Map<string, number>();
      (cancelamentos || []).forEach((item: any) => {
        const motivo = item.motivo_cancelamento?.trim() || 'Não informado';
        cancelMap.set(motivo, (cancelMap.get(motivo) || 0) + 1);
      });

      const totalCancel = cancelamentos?.length || 0;
      const cancelData = Array.from(cancelMap.entries())
        .map(([motivo, count]) => ({
          motivo,
          count,
          percentage: totalCancel > 0 ? Math.round((count / totalCancel) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      // Processar motivos de congelamento
      const freezeMap = new Map<string, number>();
      (congelamentos || []).forEach((item: any) => {
        const motivo = item.motivo_congelamento?.trim() || 'Não informado';
        freezeMap.set(motivo, (freezeMap.get(motivo) || 0) + 1);
      });

      const totalFreeze = congelamentos?.length || 0;
      const freezeData = Array.from(freezeMap.entries())
        .map(([motivo, count]) => ({
          motivo,
          count,
          percentage: totalFreeze > 0 ? Math.round((count / totalFreeze) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count);

      setCancelamentoReasons(cancelData);
      setCongelamentoReasons(freezeData);
    } catch (error) {
      console.error('Erro ao carregar análise de motivos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a análise de motivos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'];

  if (loading) {
    return (
      <Card className="bg-slate-800/40 border-slate-700">
        <CardContent className="p-12 text-center">
          <div className="text-slate-400">Carregando análise...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Análise de Cancelamentos */}
      <Card className="bg-slate-800/40 border-red-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Motivos de Cancelamento
              </CardTitle>
              <CardDescription className="text-slate-400">
                {cancelamentoReasons.reduce((sum, r) => sum + r.count, 0)} cancelamentos analisados
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCancelamentos(!showCancelamentos)}
              className="text-slate-400 hover:text-white"
            >
              {showCancelamentos ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showCancelamentos && <CardContent>
          {cancelamentoReasons.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum motivo registrado ainda
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gráfico de Barras */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cancelamentoReasons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="motivo" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Lista de Motivos */}
              <div className="space-y-2">
                {cancelamentoReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-300">{reason.motivo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{reason.count}</span>
                      <span className="text-xs text-slate-400">({reason.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>}
      </Card>

      {/* Análise de Congelamentos */}
      <Card className="bg-slate-800/40 border-cyan-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-cyan-400" />
                Motivos de Congelamento
              </CardTitle>
              <CardDescription className="text-slate-400">
                {congelamentoReasons.reduce((sum, r) => sum + r.count, 0)} congelamentos analisados
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCongelamentos(!showCongelamentos)}
              className="text-slate-400 hover:text-white"
            >
              {showCongelamentos ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </CardHeader>
        {showCongelamentos && <CardContent>
          {congelamentoReasons.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Nenhum motivo registrado ainda
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gráfico de Barras */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={congelamentoReasons}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="motivo" 
                    stroke="#94a3b8"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              {/* Lista de Motivos */}
              <div className="space-y-2">
                {congelamentoReasons.map((reason, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-slate-300">{reason.motivo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{reason.count}</span>
                      <span className="text-xs text-slate-400">({reason.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>}
      </Card>
    </div>
  );
}
