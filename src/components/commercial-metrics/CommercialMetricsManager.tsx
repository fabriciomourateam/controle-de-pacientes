import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
import { CommercialMetricsForm } from './CommercialMetricsForm';
import { Plus, Edit, Trash2, Loader2, RefreshCw, TrendingUp, Phone, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';

interface LeadData {
  id?: number;
  DATA?: string;
  GOOGLE?: number;
  GOOGLE_FORMS?: number;
  INSTAGRAM?: number;
  FACEBOOK?: number;
  SELLER?: number;
  INDICACAO?: number;
  OUTROS?: number;
  TOTAL?: number;
}

interface CallData {
  id?: number;
  AGENDADAS?: string;
  TOTAL_DE_CALLS_AGENDADAS?: number;
  PERCENT_QUE_VAI_PRA_CALL?: number;
}

interface VendaData {
  id?: number;
  DATA?: string;
  MES?: string;
  TOTAL_DE_VENDAS?: number;
  VALOR_TOTAL?: number;
}

export function CommercialMetricsManager() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [calls, setCalls] = useState<CallData[]>([]);
  const [vendas, setVendas] = useState<VendaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<{ type: string; id: number } | null>(null);
  const [isMinimized, setIsMinimized] = useState(true); // Minimizado por padrão
  const [activeTab, setActiveTab] = useState<'leads' | 'calls' | 'vendas'>('leads');
  const { toast } = useToast();

  // Função helper para parsear datas em diferentes formatos
  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    
    // Tentar formato DD/MM/YY ou DD/MM/YYYY
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
      let year = parseInt(parts[2], 10);
      
      // Se ano tem 2 dígitos, converter para 4
      if (year < 100) {
        year += 2000;
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Tentar formato ISO (YYYY-MM-DD) ou outros formatos padrão
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }
    
    return null;
  };

  // Função helper para formatar data para exibição
  const formatDate = (dateStr: string | null | undefined): string => {
    const date = parseDate(dateStr);
    if (!date) return '-';
    return date.toLocaleDateString('pt-BR');
  };

  // Função helper para extrair mês/ano de uma data ou string
  const formatMonthYear = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    
    // Se já for um mês (ex: "Janeiro", "Fevereiro", etc.)
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesEncontrado = meses.find(m => dateStr.toLowerCase().includes(m.toLowerCase()));
    if (mesEncontrado) {
      // Tentar extrair o ano se houver
      const anoMatch = dateStr.match(/\d{4}/);
      if (anoMatch) {
        return `${mesEncontrado}/${anoMatch[0]}`;
      }
      return mesEncontrado;
    }
    
    // Tentar parsear como data
    const date = parseDate(dateStr);
    if (date) {
      const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      return `${mes}/${ano}`;
    }
    
    // Se não conseguir parsear, retornar como está (pode ser um mês em outro formato)
    return dateStr;
  };

  // Função helper para obter o número do mês para ordenação cronológica
  const getMonthNumber = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Normalizar string para busca
    const strLower = dateStr.toLowerCase().trim();
    
    // Tentar encontrar o mês no texto
    const mesIndex = meses.findIndex(m => strLower.includes(m.toLowerCase()));
    if (mesIndex !== -1) {
      // Tentar extrair o ano (procura por 4 dígitos)
      const anoMatch = dateStr.match(/\b(\d{4})\b/);
      const ano = anoMatch ? parseInt(anoMatch[1], 10) : new Date().getFullYear();
      // Retornar número para ordenação: ano * 100 + mês (ex: 202512 = Dez/2025, 202511 = Nov/2025)
      // Usar 100 para garantir que anos diferentes sejam bem separados
      return ano * 100 + (mesIndex + 1); // +1 porque mês começa em 0, queremos 1-12
    }
    
    // Tentar parsear como data (DD/MM/YYYY, YYYY-MM-DD, etc)
    const date = parseDate(dateStr);
    if (date && !isNaN(date.getTime())) {
      return date.getFullYear() * 100 + (date.getMonth() + 1);
    }
    
    // Se não conseguir parsear, retornar 0 (vai para o final)
    return 0;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_que_entraram')
        .select('*')
        .eq('user_id', userId)
        .order('DATA', { ascending: false });

      if (leadsError) throw leadsError;

      // Buscar calls (sem ordenação do banco, vamos ordenar depois por mês/ano)
      const { data: callsData, error: callsError } = await supabase
        .from('Total de Calls Agendadas')
        .select('*')
        .eq('user_id', userId);

      if (callsError && callsError.code !== 'PGRST116') { // PGRST116 = tabela não existe
        console.warn('Erro ao buscar calls:', callsError);
      }

      // Buscar vendas (a tabela Total de Vendas armazena vendas individuais, não agregadas)
      // Por enquanto, vamos deixar vazio pois a estrutura é diferente
      const { data: vendasData, error: vendasError } = await supabase
        .from('Total de Vendas')
        .select('*')
        .eq('user_id', userId)
        .order('DATA', { ascending: false })
        .limit(0); // Limitar a 0 para evitar erro, já que a estrutura é diferente

      if (vendasError && vendasError.code !== 'PGRST116') {
        console.warn('Erro ao buscar vendas:', vendasError);
      }

      setLeads(leadsData || []);
      
      // Ordenar calls por mês/ano em ordem cronológica (mais recente primeiro)
      // Remover ordenação do banco e aplicar ordenação customizada
      const callsOrdenados = (callsData || []).slice().sort((a, b) => {
        const mesA = getMonthNumber(a.AGENDADAS);
        const mesB = getMonthNumber(b.AGENDADAS);
        
        // Se ambos forem 0 (não parseados), manter ordem original
        if (mesA === 0 && mesB === 0) return 0;
        if (mesA === 0) return 1; // Itens sem data vão para o final
        if (mesB === 0) return -1;
        
        return mesB - mesA; // Ordem decrescente (mais recente primeiro: Dez, Nov, Out, Set...)
      });
      setCalls(callsOrdenados);
      
      setVendas(vendasData || []);
    } catch (error: any) {
      console.error('Erro ao buscar métricas comerciais:', error);
      toast({
        title: 'Erro ao carregar',
        description: error.message || 'Não foi possível carregar as métricas comerciais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type: 'lead' | 'call' | 'venda', id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) {
      return;
    }

    try {
      setDeletingId({ type, id });
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      let tableName = '';
      if (type === 'lead') {
        tableName = 'leads_que_entraram';
      } else if (type === 'call') {
        tableName = 'Total de Calls Agendadas';
      } else if (type === 'venda') {
        tableName = 'Total de Vendas';
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Registro excluído!',
        description: 'O registro foi excluído com sucesso.',
      });

      await fetchData();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir o registro.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Gerenciar Métricas Comerciais</CardTitle>
          <CardDescription className="text-slate-400">
            Visualize, edite e exclua seus leads, calls e vendas
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

  const totalLeads = leads.length;
  const totalCalls = calls.length;
  const totalVendas = vendas.length;

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Gerenciar Métricas Comerciais</CardTitle>
            <CardDescription className="text-slate-400">
              Visualize, edite e exclua seus leads, calls e vendas
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isMinimized && (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'calls' | 'vendas')} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border-slate-700/50">
                <TabsTrigger value="leads" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Leads ({totalLeads})
                </TabsTrigger>
                <TabsTrigger value="calls" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-300">
                  <Phone className="w-4 h-4 mr-2" />
                  Calls ({totalCalls})
                </TabsTrigger>
                <TabsTrigger value="vendas" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Vendas ({totalVendas})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leads" className="space-y-4">
                <div className="flex justify-end">
                  <CommercialMetricsForm type="lead" onSuccess={handleSuccess}>
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Lead
                    </Button>
                  </CommercialMetricsForm>
                </div>

                {leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-slate-400 mb-4">Nenhum lead cadastrado ainda</p>
                    <CommercialMetricsForm type="lead" onSuccess={handleSuccess}>
                      <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Lead
                      </Button>
                    </CommercialMetricsForm>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                          <TableHead className="text-slate-300">Data</TableHead>
                          <TableHead className="text-slate-300">Google</TableHead>
                          <TableHead className="text-slate-300">Google Forms</TableHead>
                          <TableHead className="text-slate-300">Instagram</TableHead>
                          <TableHead className="text-slate-300">Facebook</TableHead>
                          <TableHead className="text-slate-300">Seller</TableHead>
                          <TableHead className="text-slate-300">Indicação</TableHead>
                          <TableHead className="text-slate-300">Outros</TableHead>
                          <TableHead className="text-slate-300">Total</TableHead>
                          <TableHead className="text-slate-300 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.map((item) => (
                          <TableRow
                            key={item.id}
                            className="border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <TableCell className="text-white font-medium">
                              {formatDate(item.DATA)}
                            </TableCell>
                            <TableCell className="text-blue-400">{item.GOOGLE || 0}</TableCell>
                            <TableCell className="text-green-400">{item.GOOGLE_FORMS || 0}</TableCell>
                            <TableCell className="text-pink-400">{item.INSTAGRAM || 0}</TableCell>
                            <TableCell className="text-indigo-400">{item.FACEBOOK || 0}</TableCell>
                            <TableCell className="text-orange-400">{item.SELLER || 0}</TableCell>
                            <TableCell className="text-yellow-400">{item.INDICACAO || 0}</TableCell>
                            <TableCell className="text-gray-400">{item.OUTROS || 0}</TableCell>
                            <TableCell className="text-white font-semibold">{item.TOTAL || 0}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <CommercialMetricsForm type="lead" data={item} onSuccess={handleSuccess}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </CommercialMetricsForm>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete('lead', item.id!)}
                                  disabled={deletingId?.type === 'lead' && deletingId?.id === item.id}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  {deletingId?.type === 'lead' && deletingId?.id === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="calls" className="space-y-4">
                <div className="flex justify-end">
                  <CommercialMetricsForm type="call" onSuccess={handleSuccess}>
                    <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Call
                    </Button>
                  </CommercialMetricsForm>
                </div>

                {calls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-slate-400 mb-4">Nenhuma call cadastrada ainda</p>
                    <CommercialMetricsForm type="call" onSuccess={handleSuccess}>
                      <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeira Call
                      </Button>
                    </CommercialMetricsForm>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/50 hover:bg-slate-800/30">
                          <TableHead className="text-slate-300">Mês/Ano</TableHead>
                          <TableHead className="text-slate-300">Total de Calls</TableHead>
                          <TableHead className="text-slate-300">Percentual (%)</TableHead>
                          <TableHead className="text-slate-300 text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {calls.map((item) => (
                          <TableRow
                            key={item.id}
                            className="border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <TableCell className="text-white font-medium">
                              {formatMonthYear(item.AGENDADAS)}
                            </TableCell>
                            <TableCell className="text-green-400 font-semibold">
                              {item.TOTAL_DE_CALLS_AGENDADAS || 0}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                                {item.PERCENT_QUE_VAI_PRA_CALL != null 
                                  ? (typeof item.PERCENT_QUE_VAI_PRA_CALL === 'number' 
                                      ? item.PERCENT_QUE_VAI_PRA_CALL.toFixed(1) 
                                      : Number(item.PERCENT_QUE_VAI_PRA_CALL).toFixed(1))
                                  : '0.0'}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <CommercialMetricsForm type="call" data={item} onSuccess={handleSuccess}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </CommercialMetricsForm>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete('call', item.id!)}
                                  disabled={deletingId?.type === 'call' && deletingId?.id === item.id}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                  {deletingId?.type === 'call' && deletingId?.id === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vendas" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-slate-400 mb-4">
                    A tabela "Total de Vendas" armazena vendas individuais, não métricas agregadas.
                  </p>
                  <p className="text-slate-500 text-sm mb-4">
                    Use a aba "Vendas" na página de Métricas Comerciais para ver análises detalhadas.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}

