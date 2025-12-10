import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { MetricsForm } from './MetricsForm';
import { Plus, Edit, Trash2, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { DashboardDados } from '@/types/dashboard';

interface MetricsManagerProps {
  onRefresh?: () => void;
}

export function MetricsManager({ onRefresh }: MetricsManagerProps) {
  const [data, setData] = useState<DashboardDados[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Minimizado por padrão
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { data: metricsData, error } = await supabase
        .from('dashboard_dados')
        .select('*')
        .eq('user_id', userId)
        .order('ano', { ascending: false })
        .order('mes_numero', { ascending: false });

      if (error) throw error;

      setData(metricsData || []);
    } catch (error: any) {
      console.error('Erro ao buscar métricas:', error);
      toast({
        title: 'Erro ao carregar',
        description: error.message || 'Não foi possível carregar as métricas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta métrica?')) {
      return;
    }

    try {
      setDeletingId(id);
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('dashboard_dados')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Garantir que só deleta seus próprios dados

      if (error) throw error;

      toast({
        title: 'Métrica excluída!',
        description: 'A métrica foi excluída com sucesso.',
      });

      await fetchData();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Erro ao excluir métrica:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a métrica.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    fetchData();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Gerenciar Métricas Operacionais</CardTitle>
          <CardDescription className="text-slate-400">
            Visualize, edite e exclua suas métricas mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Gerenciar Métricas Operacionais</CardTitle>
            <CardDescription className="text-slate-400">
              Visualize, edite e exclua suas métricas mensais
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              {isMinimized ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Expandir
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Minimizar
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={loading}
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <MetricsForm onSuccess={handleSuccess}>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Métrica
              </Button>
            </MetricsForm>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isMinimized && (
          <>
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-slate-400 mb-4">Nenhuma métrica cadastrada ainda</p>
                <MetricsForm onSuccess={handleSuccess}>
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Métrica
                  </Button>
                </MetricsForm>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                      <TableHead className="text-slate-300">Período</TableHead>
                      <TableHead className="text-slate-300">Ativos Início</TableHead>
                      <TableHead className="text-slate-300">Entraram</TableHead>
                      <TableHead className="text-slate-300">Sairam</TableHead>
                      <TableHead className="text-slate-300">Renovação</TableHead>
                      <TableHead className="text-slate-300">Churn</TableHead>
                      <TableHead className="text-slate-300 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((item) => {
                      // Converter valores: se for decimal (0-1), multiplicar por 100; se já for percentual (0-100), usar direto
                      let renovacao = parseFloat(String(item.percentual_renovacao || 0));
                      let churn = parseFloat(String(item.percentual_churn || 0));
                      
                      // Se o valor for menor que 1, assume-se que está em formato decimal (0.8 = 80%)
                      if (renovacao > 0 && renovacao < 1) {
                        renovacao = renovacao * 100;
                      }
                      if (churn > 0 && churn < 1) {
                        churn = churn * 100;
                      }

                      return (
                        <TableRow
                          key={item.id}
                          className="border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <TableCell className="text-white font-medium">
                            {item.mes}/{item.ano}
                          </TableCell>
                          <TableCell className="text-blue-400">
                            {Number(item.ativos_total_inicio_mes || 0).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-green-400">
                            {Number(item.entraram || 0).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-red-400">
                            {Number(item.sairam || 0).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                !isNaN(renovacao) && renovacao >= 70
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : !isNaN(renovacao) && renovacao >= 50
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }
                            >
                              {renovacao.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                !isNaN(churn) && churn <= 4
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : !isNaN(churn) && churn === 5
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                              }
                            >
                              {churn.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <MetricsForm data={item} onSuccess={handleSuccess}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </MetricsForm>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id!)}
                                disabled={deletingId === item.id}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

