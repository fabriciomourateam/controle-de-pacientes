import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Calendar,
  BarChart3,
  TrendingUp,
  Settings,
  User,
  Bell,
  HelpCircle,
  LogOut,
  Monitor,
  Activity,
  Target,
  AlertTriangle,
  LineChart,
  Shield
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pacientes", url: "/patients", icon: Users },
  { title: "Retenção", url: "/retention", icon: AlertTriangle },
  { title: "Checkins", url: "/checkins", icon: MessageSquare },
  { title: "Planos de Acompanhamento", url: "/plans", icon: Calendar, ownerOnly: true }, // Apenas owner
  { title: "Métricas Operacionais", url: "/metrics", icon: TrendingUp },
  { title: "Métricas Comerciais", url: "/commercial-metrics", icon: Target },
  { title: "Workspace", url: "/workspace", icon: Monitor },
  { title: "Relatórios", url: "/reports", icon: BarChart3 },
];

const secondaryNavItems = [
  { title: "Perfil", url: "/profile", icon: User },
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Ajuda", url: "/help", icon: HelpCircle },
];

// Email do administrador que tem acesso ao Workspace
const ADMIN_EMAIL = 'fabriciomouratreinador@gmail.com';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const { profile } = useProfile();
  const { hasPermission, isOwner } = useAuthContext();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isTeamMember, setIsTeamMember] = useState(false);

  // Buscar email do usuário atual e verificar se é membro de equipe
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserEmail(user?.email || null);
        
        // Verificar se é membro de alguma equipe
        if (user) {
          const { data: teamMember, error } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setIsTeamMember(!!teamMember);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    }
    fetchUserData();
  }, []);

  // Função para fazer logout
  const handleLogout = async () => {
    try {
      console.log('🔄 Iniciando logout...');
      
      // Limpar dados locais primeiro
      localStorage.clear();
      sessionStorage.clear();
      
      // Fazer logout no Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro ao fazer logout:', error);
        toast({
          title: "Erro",
          description: "Não foi possível fazer logout. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Logout realizado com sucesso');
      
      // Redirecionar para login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => 
    isActive(path) 
      ? "bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 font-medium border-blue-500/30" 
      : "hover:bg-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600/50";

  // Mapeamento de permissões por rota
  const routePermissions: Record<string, { resource: string; action?: string }> = {
    "/patients": { resource: "patients", action: "view" },
    "/retention": { resource: "patients", action: "view" },
    "/checkins": { resource: "checkins", action: "view" },
    "/metrics": { resource: "metrics", action: "view_sales" },
    "/commercial-metrics": { resource: "metrics", action: "view_sales" },
    "/reports": { resource: "reports", action: "clinical" },
  };

  // Filtrar itens do menu baseado em permissões
  const filteredMainNavItems = mainNavItems.filter(item => {
    // Workspace só aparece para o admin
    if (item.title === "Workspace") {
      return userEmail === ADMIN_EMAIL;
    }
    
    // Planos de Acompanhamento só para owner
    if ((item as any).ownerOnly) {
      return isOwner;
    }
    
    // Dashboard sempre aparece
    if (item.url === "/") {
      return true;
    }
    
    // Verificar permissão para a rota
    const permission = routePermissions[item.url];
    if (permission) {
      return isOwner || hasPermission(permission.resource, permission.action);
    }
    
    return true;
  });

  // Adicionar Admin Dashboard e Gestão de Equipe
  const adminNavItems = [];
  
  // Admin só para o email específico
  if (userEmail === ADMIN_EMAIL) {
    adminNavItems.push({ title: "Admin", url: "/admin", icon: Shield });
  }
  
  // Gestão de Equipe apenas para owner ou admin
  if (userEmail === ADMIN_EMAIL || isOwner) {
    adminNavItems.push({ title: "Gestão de Equipe", url: "/team", icon: Users });
    adminNavItems.push({ title: "Reuniões", url: "/meetings", icon: Calendar });
  }
  
  // Reuniões também para membros da equipe (que não são owners)
  // Usar isTeamMember que já foi verificado, ou verificar permissão de dashboard
  if (!isOwner && userEmail !== ADMIN_EMAIL && (isTeamMember || profile?.permissions?.dashboard)) {
    adminNavItems.push({ title: "Reuniões", url: "/meetings", icon: Calendar });
  }
  


  return (
    <Sidebar
      className={`bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300 ${
        isCollapsed ? "w-[70px]" : "w-[240px]"
      }`}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500/30 via-cyan-500/30 to-blue-600/30 rounded-xl flex items-center justify-center border border-blue-500/40 shadow-lg shadow-blue-500/20">
              <LineChart className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-cyan-400 tracking-tight">
                Grow Nutri
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Gestão de Pacientes</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className={`text-slate-400 text-xs font-medium ${isCollapsed ? "sr-only" : ""}`}>
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`${getNavCls(item.url)} transition-colors duration-200`}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavItems.length > 0 && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className={`text-slate-400 text-xs font-medium ${isCollapsed ? "sr-only" : ""}`}>
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`${getNavCls(item.url)} transition-colors duration-200`}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={`text-slate-400 text-xs font-medium ${isCollapsed ? "sr-only" : ""}`}>
            Conta
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`${getNavCls(item.url)} transition-colors duration-200`}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-slate-700/50">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 border-slate-600/50">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 text-xs border border-blue-500/30">
                {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs text-white truncate">
                {profile?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {profile?.email || 'email@exemplo.com'}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogout();
              }}
              className="p-1 hover:bg-slate-700/50 hover:text-white rounded-md transition-colors cursor-pointer"
              title="Sair"
              type="button"
            >
              <LogOut className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="w-7 h-7 border-slate-600/50">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 text-xs border border-blue-500/30">
                {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}