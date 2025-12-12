import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  Ban,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
  MoreVertical,
  Copy,
  Mail,
  User,
  FileText,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { adminService, AdminUser, AdminMetrics, RevenueData } from '@/lib/admin-service';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

export default function AdminDashboard() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorization();
  }, []);

  useEffect(() => {
    if (authorized) {
      loadData();
    }
  }, [authorized]);

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthorized(user?.email === ADMIN_EMAIL);
    } catch (error) {
      console.error('Erro ao verificar autorização:', error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [usersData, metricsData, revenueDataData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAdminMetrics(),
        adminService.getRevenueData()
      ]);
      setUsers(usersData);
      setMetrics(metricsData);
      setRevenueData(revenueDataData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? false : true;
      await adminService.toggleUserStatus(userId, newStatus);
      toast({
        title: 'Sucesso',
        description: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível alterar o status do usuário.',
        variant: 'destructive'
      });
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({
      title: 'Email copiado!',
      description: `Email ${email} copiado para a área de transferência.`
    });
  };

  const handleViewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const handleViewUserPatients = (userId: string) => {
    // Navegar para a página de pacientes com filtro por user_id
    navigate(`/patients?userId=${userId}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case 'trial':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Expirado</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Sem assinatura</Badge>;
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.subscription?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-slate-400">Verificando permissões...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!authorized) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="max-w-md bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-center">Acesso Negado</CardTitle>
              <CardDescription className="text-center">
                Você não tem permissão para acessar esta página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate('/')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">Dashboard Administrativo</h1>
            <p className="text-slate-400 mt-1">
              Visão geral de todos os usuários e métricas do sistema
            </p>
          </div>
          <Button
            onClick={loadData}
            disabled={refreshing}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* KPIs Principais */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.totalUsers}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.activeSubscriptions + metrics.trialSubscriptions} com assinatura
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Plano Ativo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.activeSubscriptions}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {((metrics.activeSubscriptions / metrics.totalUsers) * 100 || 0).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Em Trial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.trialSubscriptions}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {((metrics.trialSubscriptions / metrics.totalUsers) * 100 || 0).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">MRR (Receita Mensal)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{formatCurrency(metrics.monthlyRecurringRevenue)}</div>
                <p className="text-xs text-slate-400 mt-1">
                  ARPU: {formatCurrency(metrics.averageRevenuePerUser)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* KPIs Secundários */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Total de Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.totalPatients}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {metrics.totalCheckins} check-ins totais
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Taxa de Churn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.churnRate.toFixed(1)}%</div>
                <p className="text-xs text-slate-400 mt-1">
                  Crescimento: {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">Cancelados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{metrics.canceledSubscriptions}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {((metrics.canceledSubscriptions / metrics.totalUsers) * 100 || 0).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico de Receita */}
        {revenueData.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Receita Mensal</CardTitle>
              <CardDescription>Evolução da receita ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Receita"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Lista de Usuários */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-white">Usuários do Sistema</CardTitle>
                <CardDescription>
                  {filteredUsers.length} de {users.length} usuários
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-slate-700/50 border-slate-600 text-white">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="canceled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Assinatura</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Pacientes</TableHead>
                    <TableHead className="text-slate-300">Check-ins</TableHead>
                    <TableHead className="text-slate-300">Receita</TableHead>
                    <TableHead className="text-slate-300">Cadastro</TableHead>
                    <TableHead className="text-slate-300 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-400 py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-slate-700">
                        <TableCell className="text-white font-medium">{user.email}</TableCell>
                        <TableCell>
                          {user.subscription ? (
                            <div>
                              <div className="text-white">{user.subscription.plan_display_name}</div>
                              {user.subscription.current_period_end && (
                                <div className="text-xs text-slate-400">
                                  {user.subscription.status === 'trial' ? 'Trial vence' : 'Vence'}: {formatDate(user.subscription.current_period_end)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Sem assinatura</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.subscription ? getStatusBadge(user.subscription.status) : getStatusBadge('none')}
                        </TableCell>
                        <TableCell className="text-white">{user.stats.total_patients}</TableCell>
                        <TableCell className="text-white">{user.stats.total_checkins}</TableCell>
                        <TableCell className="text-white">{formatCurrency(user.stats.total_revenue)}</TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem
                                  onClick={() => handleViewUserDetails(user)}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewUserPatients(user.id)}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <Users className="w-4 h-4 mr-2" />
                                  Ver Pacientes ({user.stats.total_patients})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyEmail(user.email)}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copiar Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.location.href = `mailto:${user.email}`}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Enviar Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-700" />
                                {user.subscription && (
                                  <DropdownMenuItem
                                    onClick={() => handleToggleUserStatus(
                                      user.id,
                                      user.subscription!.status
                                    )}
                                    className={
                                      user.subscription.status === 'active'
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-green-400 hover:bg-green-500/10'
                                    }
                                  >
                                    {user.subscription.status === 'active' ? (
                                      <>
                                        <Ban className="w-4 h-4 mr-2" />
                                        Desativar Assinatura
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Ativar Assinatura
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Adicionais */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Receita Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</div>
                <p className="text-xs text-slate-400 mt-1">Receita acumulada</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Métricas de Crescimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa de Crescimento:</span>
                  <span className={`font-semibold ${metrics.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics.growthRate >= 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taxa de Churn:</span>
                  <span className="text-red-400 font-semibold">{metrics.churnRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ARPU:</span>
                  <span className="text-white font-semibold">{formatCurrency(metrics.averageRevenuePerUser)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Dialog de Detalhes do Usuário */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Usuário</DialogTitle>
            <DialogDescription className="text-slate-400">
              Informações completas sobre o usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Email</label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Data de Cadastro</label>
                  <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                </div>
                {selectedUser.subscription && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Plano</label>
                      <p className="text-white">{selectedUser.subscription.plan_display_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-400">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedUser.subscription.status)}
                      </div>
                    </div>
                    {selectedUser.subscription.current_period_end && (
                      <div>
                        <label className="text-sm font-medium text-slate-400">
                          {selectedUser.subscription.status === 'trial' ? 'Trial vence em' : 'Vencimento'}
                        </label>
                        <p className="text-white">{formatDate(selectedUser.subscription.current_period_end)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-lg font-semibold text-white mb-3">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-slate-400">Total de Pacientes</label>
                    <p className="text-2xl font-bold text-white">{selectedUser.stats.total_patients}</p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-slate-400">Total de Check-ins</label>
                    <p className="text-2xl font-bold text-white">{selectedUser.stats.total_checkins}</p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-slate-400">Total de Pagamentos</label>
                    <p className="text-2xl font-bold text-white">{selectedUser.stats.total_payments}</p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <label className="text-sm font-medium text-slate-400">Receita Total</label>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(selectedUser.stats.total_revenue)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}



