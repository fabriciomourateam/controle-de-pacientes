import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { commercialMetricsService } from '@/lib/commercial-metrics-service';
import { processSalesData, compareWithExcel } from '@/lib/sales-metrics-fix';

export default function DebugVendas() {
  const [dadosVendas, setDadosVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);

  const buscarDadosVendas = async (forcarAtualizacao = false) => {
    setLoading(true);
    setErro(null);
    
    try {
      console.log('🔍 Buscando dados de vendas...');
      if (forcarAtualizacao) {
        console.log('🔄 FORÇANDO ATUALIZAÇÃO - Ignorando cache...');
      }
      
      const vendas = await commercialMetricsService.getTotalDeVendas();
      console.log('📊 Dados carregados:', vendas.length, 'registros');
      console.log('📋 Primeiro registro:', vendas[0]);
      
      // CONTAGEM DIRETA AQUI MESMO
      const contagemDiretaAqui = {
        total: vendas.length,
        comprou1: vendas.filter(v => v.COMPROU === '1').length,
        naoComprou1: vendas.filter(v => v['NÃO COMPROU'] === '1').length,
        noShow1: vendas.filter(v => v['NO SHOW'] === '1').length,
        comprou0: vendas.filter(v => v.COMPROU === '0').length,
        naoComprou0: vendas.filter(v => v['NÃO COMPROU'] === '0').length,
        noShow0: vendas.filter(v => v['NO SHOW'] === '0').length,
      };
      console.log('🎯 CONTAGEM DIRETA NA PÁGINA:', contagemDiretaAqui);
      
      // Mostrar os últimos 10 registros também para verificar
      console.log('📋 Últimos 10 registros:');
      vendas.slice(-10).forEach((v, i) => {
        console.log(`Registro ${vendas.length - 10 + i + 1}:`, {
          comprou: v.COMPROU,
          naoComprou: v['NÃO COMPROU'],
          noShow: v['NO SHOW'],
          mes: v.MÊS,
          funil: v.FUNIL
        });
      });
      
      setDadosVendas(vendas);
      processarDados(vendas);
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const processarDados = (vendas: any[]) => {
    console.log('📊 Processando dados de vendas com lógica corrigida...');
    
    // Usar a função corrigida
    const resultadosProcessados = processSalesData(vendas);
    
    // Comparar com Excel
    const diferencas = compareWithExcel(resultadosProcessados);
    
    const resultadosFinais = {
      ...resultadosProcessados,
      diferencas
    };
    
    console.log('📊 Resultados finais:', resultadosFinais);
    setResultados(resultadosFinais);
  };

  useEffect(() => {
    buscarDadosVendas();
  }, []);

  const getStatusIcon = (diferenca: number) => {
    if (diferenca === 0) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (Math.abs(diferenca) <= 5) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusColor = (diferenca: number) => {
    if (diferenca === 0) return 'bg-green-500/10 border-green-500/30 text-green-400';
    if (Math.abs(diferenca) <= 5) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    return 'bg-red-500/10 border-red-500/30 text-red-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🔍 Debug de Vendas
            </h1>
            <p className="text-slate-400 mt-1">
              Análise detalhada dos dados de vendas vs Excel
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => buscarDadosVendas(false)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Atualizar Dados'}
            </Button>
            <Button 
              onClick={() => {
                console.clear();
                buscarDadosVendas(true);
              }}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Forçar Atualização (Limpar Cache)
            </Button>
          </div>
        </div>

        {/* Status */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Status da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center gap-2 text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Carregando dados do Supabase...
              </div>
            )}
            {erro && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                Erro: {erro}
              </div>
            )}
            {resultados && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Análise concluída com {dadosVendas.length} registros
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados do Sistema */}
        {resultados && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Resultados do Sistema</CardTitle>
              <CardDescription className="text-slate-400">
                Dados processados pelo sistema atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                  <p className="text-xs text-blue-400 font-semibold mb-1">Total Calls</p>
                  <p className="text-2xl font-bold text-white">{resultados.totalCalls}</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                  <p className="text-xs text-green-400 font-semibold mb-1">Comprou</p>
                  <p className="text-2xl font-bold text-white">{resultados.comprou}</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                  <p className="text-xs text-red-400 font-semibold mb-1">Não Comprou</p>
                  <p className="text-2xl font-bold text-white">{resultados.naoComprou}</p>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
                  <p className="text-xs text-orange-400 font-semibold mb-1">No Show</p>
                  <p className="text-2xl font-bold text-white">{resultados.noShow}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparação com Excel */}
        {resultados && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Comparação com Excel</CardTitle>
              <CardDescription className="text-slate-400">
                Dados do Excel vs Sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* COMPROU */}
                <div className={`p-4 rounded-lg border ${getStatusColor(resultados.diferencas.comprou)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(resultados.diferencas.comprou)}
                      <span className="font-semibold">COMPROU</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Excel: 204 | Sistema: {resultados.comprou}</p>
                      <p className="text-sm font-bold">
                        Diferença: {resultados.diferencas.comprou > 0 ? '+' : ''}{resultados.diferencas.comprou}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NÃO COMPROU */}
                <div className={`p-4 rounded-lg border ${getStatusColor(resultados.diferencas.naoComprou)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(resultados.diferencas.naoComprou)}
                      <span className="font-semibold">NÃO COMPROU</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Excel: 110 | Sistema: {resultados.naoComprou}</p>
                      <p className="text-sm font-bold">
                        Diferença: {resultados.diferencas.naoComprou > 0 ? '+' : ''}{resultados.diferencas.naoComprou}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NO SHOW */}
                <div className={`p-4 rounded-lg border ${getStatusColor(resultados.diferencas.noShow)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(resultados.diferencas.noShow)}
                      <span className="font-semibold">NO SHOW</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Excel: 87 | Sistema: {resultados.noShow}</p>
                      <p className="text-sm font-bold">
                        Diferença: {resultados.diferencas.noShow > 0 ? '+' : ''}{resultados.diferencas.noShow}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TOTAL CALLS */}
                <div className={`p-4 rounded-lg border ${getStatusColor(resultados.diferencas.totalCalls)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(resultados.diferencas.totalCalls)}
                      <span className="font-semibold">TOTAL CALLS</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Excel: 402 | Sistema: {resultados.totalCalls}</p>
                      <p className="text-sm font-bold">
                        Diferença: {resultados.diferencas.totalCalls > 0 ? '+' : ''}{resultados.diferencas.totalCalls}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Resumo da Análise:</h3>
                {resultados.diferencas.comprou === 0 && resultados.diferencas.totalCalls === 0 ? (
                  <p className="text-green-400">✅ PERFEITO! Os dados estão 100% alinhados com o Excel!</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-yellow-400">⚠️ Diferenças encontradas. Possíveis causas:</p>
                    <ul className="text-slate-300 text-sm ml-4 space-y-1">
                      <li>• Filtros aplicados no sistema (ex: "reunião de equipe")</li>
                      <li>• Lógica de processamento diferente</li>
                      <li>• Período de dados diferente</li>
                      <li>• Formato dos dados diferente</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registros Suspeitos */}
        {resultados && resultados.registrosSuspeitos > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Registros Suspeitos
              </CardTitle>
              <CardDescription className="text-slate-400">
                {resultados.registrosSuspeitos} registros sem status marcado (podem ser os que estão causando as diferenças)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <p className="text-sm text-orange-400">
                  <strong>💡 Análise:</strong> Estes registros não têm nenhum status marcado (COMPROU, NÃO COMPROU, NO SHOW). 
                  No Excel, eles provavelmente estão marcados como "Sim" em algum campo, mas o sistema não está reconhecendo.
                  Verifique o console para ver os valores exatos desses registros.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registros Problemáticos */}
        {resultados && resultados.registrosProblematicos && resultados.registrosProblematicos.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Registros com Múltiplos Status
              </CardTitle>
              <CardDescription className="text-slate-400">
                {resultados.registrosProblematicos.length} registros com múltiplos status marcados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resultados.registrosProblematicos.map((registro: any, index: number) => (
                  <div key={index} className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold text-yellow-400">
                          Registro #{registro.index} - {registro.mes} - {registro.funil}
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">COMPROU:</span>
                            <span className="ml-1 text-white">{registro.comprou || 'null'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">NÃO COMPROU:</span>
                            <span className="ml-1 text-white">{registro.naoComprou || 'null'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">NO SHOW:</span>
                            <span className="ml-1 text-white">{registro.noShow || 'null'}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/50">
                        {registro.statusCount} status
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                <p className="text-sm text-yellow-400">
                  <strong>💡 Solução:</strong> Estes registros têm múltiplos status marcados. 
                  O sistema está aplicando a lógica de prioridade (Comprou {'>'} No Show {'>'} Não Comprou), 
                  mas isso pode estar causando as discrepâncias com o Excel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Valores Únicos no Supabase */}
        {resultados && resultados.valoresUnicos && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
                Valores Únicos no Supabase
              </CardTitle>
              <CardDescription className="text-slate-400">
                Todos os valores únicos encontrados nos campos de status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white mb-2">COMPROU:</p>
                  <div className="flex flex-wrap gap-2">
                    {resultados.valoresUnicos.comprou.map((valor: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        "{valor}"
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-white mb-2">NÃO COMPROU:</p>
                  <div className="flex flex-wrap gap-2">
                    {resultados.valoresUnicos.naoComprou.map((valor: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        "{valor}"
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-white mb-2">NO SHOW:</p>
                  <div className="flex flex-wrap gap-2">
                    {resultados.valoresUnicos.noShow.map((valor: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        "{valor}"
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Análise de Soma */}
        {resultados && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-400" />
                Análise de Soma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Total de Calls:</p>
                    <p className="text-white font-semibold">{resultados.totalCalls}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Soma Classificados:</p>
                    <p className="text-white font-semibold">{resultados.somaClassificados || (resultados.comprou + resultados.naoComprou + resultados.noShow)}</p>
                  </div>
                </div>
                
                {resultados.diferencaSoma > 0 && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-sm text-red-400">
                      <strong>⚠️ Problema encontrado:</strong> {resultados.diferencaSoma} registros não foram classificados em nenhuma categoria!
                    </p>
                    <p className="text-xs text-slate-300 mt-1">
                      Isso explica por que a soma não bate. Verifique o console para ver quais registros não estão sendo processados.
                    </p>
                  </div>
                )}
                
                {(!resultados.diferencaSoma || resultados.diferencaSoma === 0) && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-sm text-green-400">
                      <strong>✅ Soma correta:</strong> Todos os registros foram classificados corretamente.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados por Mês */}
        {resultados && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Dados por Mês</CardTitle>
              <CardDescription className="text-slate-400">
                Breakdown mensal dos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.keys(resultados.porMes).map(mes => {
                  const dados = resultados.porMes[mes];
                  const conversao = dados.comprou + dados.naoComprou > 0 
                    ? (dados.comprou / (dados.comprou + dados.naoComprou) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <div key={mes} className="bg-slate-700/30 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">{mes}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-slate-400">Total</p>
                          <p className="text-lg font-bold text-white">{dados.total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-green-400">Comprou</p>
                          <p className="text-lg font-bold text-green-400">{dados.comprou}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-red-400">Não Comprou</p>
                          <p className="text-lg font-bold text-red-400">{dados.naoComprou}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-orange-400">No Show</p>
                          <p className="text-lg font-bold text-orange-400">{dados.noShow}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          Conversão: {conversao}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
