import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export function useMeetings() {
  const { user } = useAuthContext();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeetings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("team_meetings")
        .select("*")
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Erro ao carregar reuniões:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, [user]);

  const createMeeting = async (data: any) => {
    if (!user) throw new Error("Usuário não autenticado");

    const { error } = await supabase.from("team_meetings").insert({
      ...data,
      owner_id: user.id,
      created_by: user.id,
    });

    if (error) throw error;
    await loadMeetings();
  };

  const updateMeeting = async (id: string, data: any) => {
    const { error } = await supabase
      .from("team_meetings")
      .update(data)
      .eq("id", id);

    if (error) throw error;
    await loadMeetings();
  };

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase
      .from("team_meetings")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await loadMeetings();
  };

  return {
    meetings,
    loading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    reload: loadMeetings,
  };
}
