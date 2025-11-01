import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingDown, 
  Calendar,
  Clock,
  AlertCircle,
  BarChart3,
  Sparkles,
  Users,
  MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface CancellationPattern {
  totalCancelamentos: number;
  totalCongelamentos: number;
  tempoMedioCancelamento: number; // em dias
  tempoMedioCongelamento: number;
  diasSemContatoAntesCancelar: number;
  mesesComMaisCancelamentos: { mes: string; total: number }[];
  sinaisAlerta: {
    diasSemContato: number;
    percentual: number;
  }[];
}

export function CancellationPatternsAnalysis() {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<CancellationPattern | null>(null);

  useEffect(() => {
    loadCancellationPatterns();
  }, []);

  const loadCancellationPatterns = async () => {
    try {
      setLoading(true);

      // Buscar alunos cancelados e congelados
      const { data: cancelados, error: errorCancelados } = await supabase
        .from('patients')
        .select('id, nome, inicio_acompanhamento, data_cancelamento, ultimo_contato, created_at')
        .not('data_cancelamento', 'is', null)
        .or('plano.ilike.%RESCISÃO%,plano.ilike.%Negativado%');

      const { data: congelados, error: errorCongelados } = await supabase
        .from('patients')
        .select('id, nome, inicio_acompanhamento, data_congelamento, ultimo_contato, created_at')
        .not('data_congelamento', 'is', null)
        .ilike('plano', '%CONGELADO%');

      if (errorCancelados || errorCongelados) {
        throw errorCancelados || errorCongelados;
      }

      // Processar dados
      const canceladosData = (cancelados as any[]) || [];
      const congeladosData = (congelados as any[]) || [];

      // Calcular tempo médio até cancelar
      const temposCancelamento = canceladosData
        .filter(p => p.inicio_acompanhamento && p.data_cancelamento)
        .map(p => {
          const inicio = new Date(p.inicio_acompanhamento || p.created_at);
          const cancelamento = extractDate(p.data_cancelamento);
          if (!cancelamento) return 0;
          return Math.ceil((cancelamento.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter(t => t > 0);

      const tempoMedioCancelamento = temposCancelamento.length > 0
        ? Math.round(temposCancelamento.reduce((a, b) => a + b, 0) / temposCancelamento.length)
        : 0;

      // Calcular tempo médio até congelar
      const temposCongelamento = congeladosData
        .filter(p => p.inicio_acompanhamento && p.data_congelamento)
        .map(p => {
          const inicio = new Date(p.inicio_acompanhamento || p.created_at);
          const congelamento = extractDate(p.data_congelamento);
          if (!congelamento) return 0;
          return Math.ceil((congelamento.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter(t => t > 0);

      const tempoMedioCongelamento = temposCongelamento.length > 0
        ? Math.round(temposCongelamento.reduce((a, b) => a + b, 0) / temposCongelamento.length)
        : 0;

      // Calcular dias sem contato antes de cancelar
      const diasSemContatoList = canceladosData
        .filter(p => p.ultimo_contato && p.data_cancelamento)
        .map(p => {
          const ultimoContato = extractDate(p.ultimo_contato);
          const cancelamento = extractDate(p.data_cancelamento);
          if (!ultimoContato || !cancelamento) return 0;
          return Math.ceil((cancelamento.getTime() - ultimoContato.getTime()) / (1000 * 60 * 60 * 24));
        })
        .filter(d => d > 0);

      const diasSemContatoAntesCancelar = diasSemContatoList.length > 0
        ? Math.round(diasSemContatoList.reduce((a, b) => a + b, 0) / diasSemContatoList.length)
        : 0;

      // Meses com mais cancelamentos
      const cancelamentosPorMes = canceladosData
        .filter(p => p.data_cancelamento)
        .reduce((acc: any, p) => {
          const data = extractDate(p.data_cancelamento);
          if (!data) return acc;
          const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
          acc[mes] = (acc[mes] || 0) + 1;
          return acc;
        }, {});

      const mesesComMaisCancelamentos = Object.entries(cancelamentosPorMes)
        .map(([mes, total]) => ({ mes, total: total as number }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      // Sinais de alerta (distribuição de dias sem contato)
      const sinaisAlerta = [
        { 
          diasSemContato: 20, 
          percentual: Math.round((diasSemContatoList.filter(d => d >= 20).length / diasSemContatoList.length) * 100) || 0 
        },
        { 
          diasSemContato: 30, 
          percentual: Math.round((diasSemContatoList.filter(d => d >= 30).length / diasSemContatoList.length) * 100) || 0 
        },
        { 
          diasSemContato: 45, 
          percentual: Math.round((diasSemContatoList.filter(d => d >= 45).length / diasSemContatoList.length) * 100) || 0 
        },
      ];

      setPatterns({
        totalCancelamentos: canceladosData.length,
        totalCongelamentos: congeladosData.length,
        tempoMedioCancelamento,
        tempoMedioCongelamento,
        diasSemContatoAntesCancelar,
        mesesComMaisCancelamentos,
        sinaisAlerta
      });

    } catch (error) {
      console.error('Erro ao carregar padrões de cancelamento:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para extrair data do formato JSON
  const extractDate = (dateField: any): Date | null => {
    if (!dateField) return null;

    try {
      if (typeof dateField === 'string') {
        const parsed = JSON.parse(dateField);
        return new Date(parsed.start);
      } else if (typeof dateField === 'object' && dateField.start) {
        return new Date(dateField.start);
      }
      return new Date(dateField);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400">Carregando análise de padrões...</div>
        </CardContent>
      </Card>
    );
  }

  if (!patterns) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Análise de Padrões de Cancelamento
          </CardTitle>
          <CardDescription className="text-slate-400">
            Insights baseados em dados históricos para prevenir cancelamentos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* KPIs de Cancelamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Cancelamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{patterns.totalCancelamentos}</div>
            <p className="text-xs text-slate-400 mt-1">alunos cancelaram</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Congelamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{patterns.totalCongelamentos}</div>
            <p className="text-xs text-slate-400 mt-1">alunos congelaram</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Até Cancelar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {Math.round(patterns.tempoMedioCancelamento / 30)}
            </div>
            <p className="text-xs text-slate-400 mt-1">meses (média)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Até Congelar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {Math.round(patterns.tempoMedioCongelamento / 30)}
            </div>
            <p className="text-xs text-slate-400 mt-1">meses (média)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Sem Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{patterns.diasSemContatoAntesCancelar}</div>
            <p className="text-xs text-slate-400 mt-1">dias antes de cancelar</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Cancelamentos por Mês */}
      {patterns.mesesComMaisCancelamentos.length > 0 && (
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Meses com Mais Cancelamentos
            </CardTitle>
            <CardDescription className="text-slate-400">
              Identificar períodos críticos para ações preventivas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={patterns.mesesComMaisCancelamentos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="mes" 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="total" fill="#ef4444" name="Cancelamentos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sinais de Alerta */}
      <Card className="bg-slate-800/40 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Sinais de Alerta Identificados
          </CardTitle>
          <CardDescription className="text-slate-400">
            Padrões de comportamento antes do cancelamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.sinaisAlerta.map((sinal, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-white font-semibold">
                      {sinal.diasSemContato}+ dias sem contato
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                    {sinal.percentual}%
                  </Badge>
                </div>
                <p className="text-sm text-slate-400">
                  {sinal.percentual}% dos alunos que cancelaram ficaram {sinal.diasSemContato}+ dias sem contato antes
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações de IA */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Recomendações Baseadas em IA
          </CardTitle>
          <CardDescription className="text-slate-400">
            Ações preventivas sugeridas com base nos padrões identificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 font-bold text-sm">1</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Contato Proativo</p>
                <p className="text-slate-300 text-sm">
                  Entrar em contato com alunos que estão há {Math.round(patterns.diasSemContatoAntesCancelar * 0.7)} dias sem interação 
                  (70% do tempo médio antes de cancelar)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 font-bold text-sm">2</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Período Crítico</p>
                <p className="text-slate-300 text-sm">
                  Reforçar engajamento aos {Math.round(patterns.tempoMedioCancelamento / 30)} meses de acompanhamento 
                  (tempo médio até cancelamento)
                </p>
              </div>
            </div>

            {patterns.mesesComMaisCancelamentos.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-1">Campanha Preventiva</p>
                  <p className="text-slate-300 text-sm">
                    Criar campanha de reengajamento em {patterns.mesesComMaisCancelamentos[0].mes} 
                    (mês com mais cancelamentos históricos)
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 font-bold text-sm">4</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-1">Monitoramento Intensivo</p>
                <p className="text-slate-300 text-sm">
                  Acompanhar de perto alunos congelados ({patterns.totalCongelamentos} atualmente) 
                  para evitar que se tornem cancelamentos
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
