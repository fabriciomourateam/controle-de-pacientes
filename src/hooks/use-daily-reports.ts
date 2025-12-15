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
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });

      if (error) throw error;
      
      // Buscar informações dos membros separadamente
      const reportsWithNames = await Promise.all(
        (data || []).map(async (report) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email")
            .eq("id", report.member_id)
            .single();
          
          return {
            ...report,
            member_name: profile?.email || "Desconhecido"
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
    const { data: existing } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("member_id", user.id)
      .eq("report_date", data.report_date)
      .single();

    if (existing) {
      // Atualizar relatório existente
      const { error } = await supabase
        .from("daily_reports")
        .update(data)
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Criar novo relatório
      const { error } = await supabase.from("daily_reports").insert({
        ...data,
        owner_id: user.id,
        member_id: user.id,
      });

      if (error) throw error;
    }

    await loadReports();
  };

  return {
    reports,
    loading,
    createReport,
    reload: loadReports,
  };
}
