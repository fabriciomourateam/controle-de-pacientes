import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function useDailyReports() {
  const { user } = useAuthContext();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar todos os relatórios (RLS vai filtrar automaticamente)
      const { data, error } = await (supabase as any)
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });

      if (error) throw error;

      if (error) throw error;
      
      // Buscar informações dos membros separadamente
      const reportsWithNames = await Promise.all(
        (data || []).map(async (report: any) => {
          // Tentar buscar nome do team_members primeiro
          const { data: teamMember } = await (supabase as any)
            .from("team_members")
            .select("name")
            .eq("user_id", report.member_id)
            .single();
          
          let memberName = teamMember?.name;
          
          // Se não encontrou no team_members, verificar se é o próprio usuário
          if (!memberName && report.member_id === user.id) {
            memberName = "Eu";
          }
          
          // Se ainda não tem nome, buscar no profiles
          if (!memberName) {
            const { data: profile } = await (supabase as any)
              .from("profiles")
              .select("full_name, email")
              .eq("id", report.member_id)
              .single();
            memberName = profile?.full_name || profile?.email || "Desconhecido";
          }
          
          return {
            ...report,
            member_name: memberName
          };
        })
      );
      
      setReports(reportsWithNames);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user]);

  const createReport = async (data: any) => {
    if (!user) throw new Error("Usuário não autenticado");

    // Verificar se já existe relatório para esta data
    const { data: existing } = await (supabase as any)
      .from("daily_reports")
      .select("id")
      .eq("member_id", user.id)
      .eq("report_date", data.report_date)
      .single();

    if (existing) {
      // Atualizar relatório existente
      const { error } = await (supabase as any)
        .from("daily_reports")
        .update(data)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Criar novo relatório
      const { error } = await (supabase as any).from("daily_reports").insert({
        ...data,
        owner_id: user.id,
        member_id: user.id,
      });

      if (error) throw error;
    }

    await loadReports();
  };

  const updateReport = async (id: string, data: any) => {
    const { error } = await (supabase as any)
      .from("daily_reports")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    await loadReports();
  };

  const deleteReport = async (id: string) => {
    const { error } = await (supabase as any)
      .from("daily_reports")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await loadReports();
  };

  return {
    reports,
    loading,
    createReport,
    updateReport,
    deleteReport,
    reload: loadReports,
  };
}
