import { useState } from "react";
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
  Target
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";

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
  { title: "Checkins", url: "/checkins", icon: MessageSquare },
  { title: "Planos", url: "/plans", icon: Calendar },
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

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  const { profile } = useProfile();

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => 
    isActive(path) 
      ? "bg-gradient-to-r from-blue-600/20 to-blue-500/20 text-blue-400 font-medium border-blue-500/30" 
      : "hover:bg-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600/50";

  return (
    <Sidebar
      className={`bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300 ${
        isCollapsed ? "w-[70px]" : "w-[240px]"
      }`}
      collapsible="icon"
    >
      <SidebarHeader className="p-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-base text-white">FMTeam</h1>
              <p className="text-xs text-slate-400">Personal Dashboard</p>
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
              {mainNavItems.map((item) => (
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
            <button className="p-1 hover:bg-slate-700/50 hover:text-white rounded-md transition-colors">
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