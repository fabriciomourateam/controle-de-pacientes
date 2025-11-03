import { supabase } from "@/integrations/supabase/client";

export interface ContactHistoryEntry {
  id?: string;
  telefone: string; // Telefone do paciente (chave de ligação)
  patient_name?: string; // Nome do paciente
  contact_date: string;
  contact_type: 'manual' | 'whatsapp' | 'phone' | 'email' | 'system';
  notes?: string;
  created_by?: string;
}

export class ContactHistoryService {
  /**
   * Registra um novo contato no histórico
   * IMPORTANTE: Não atualiza o campo 'ultimo_contato' (esse é do aluno)
   * Atualiza apenas 'ultimo_contato_nutricionista' (seu contato)
   * Usa TELEFONE como chave de ligação (padrão do sistema)
   */
  static async registerContact(
    telefone: string,
    patientName: string,
    contactType: ContactHistoryEntry['contact_type'] = 'manual',
    notes?: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      const hoje = new Date().toISOString();

      // 1. Inserir no histórico de contatos (tabela separada)
      // @ts-ignore - Tabela contact_history será criada via SQL
      const { error: historyError } = await supabase
        .from('contact_history')
        .insert({
          telefone: telefone,
          patient_name: patientName,
          contact_date: hoje,
          contact_type: contactType,
          notes: notes || null,
        });

      if (historyError) {
        console.error('Erro ao inserir histórico:', historyError);
        throw historyError;
      }

      // 2. Atualizar campo ultimo_contato_nutricionista (campo separado)
      // NÃO atualiza 'ultimo_contato' pois esse é o contato do aluno
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          ultimo_contato_nutricionista: hoje
        } as any)
        .eq('telefone', telefone);

      if (updateError) {
        console.error('Erro ao atualizar ultimo_contato_nutricionista:', updateError);
        // Não falha se não conseguir atualizar o campo (histórico já foi salvo)
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
      return { success: false, error };
    }
  }

  /**
   * Busca histórico de contatos de um paciente (por telefone)
   */
  static async getPatientContactHistory(
    telefone: string,
    limit: number = 50
  ): Promise<ContactHistoryEntry[]> {
    try {
      // @ts-ignore - Tabela contact_history será criada via SQL
      const { data, error } = await supabase
        .from('contact_history')
        .select('*')
        .eq('telefone', telefone)
        .order('contact_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Busca último contato de um paciente (por telefone)
   */
  static async getLastContact(telefone: string): Promise<ContactHistoryEntry | null> {
    try {
      // @ts-ignore - Tabela contact_history será criada via SQL
      const { data, error } = await supabase
        .from('contact_history')
        .select('*')
        .eq('telefone', telefone)
        .order('contact_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar último contato:', error);
      return null;
    }
  }

  /**
   * Conta quantos contatos um paciente teve em um período (por telefone)
   */
  static async countContactsInPeriod(
    telefone: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // @ts-ignore - Tabela contact_history será criada via SQL
      const { data, error, count } = await supabase
        .from('contact_history')
        .select('*', { count: 'exact', head: true })
        .eq('telefone', telefone)
        .gte('contact_date', startDate.toISOString())
        .lte('contact_date', endDate.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Erro ao contar contatos:', error);
      return 0;
    }
  }

  /**
   * Busca todos os contatos de hoje
   */
  static async getTodayContacts(): Promise<ContactHistoryEntry[]> {
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      // @ts-ignore - Tabela contact_history será criada via SQL
      const { data, error } = await supabase
        .from('contact_history')
        .select(`
          *,
          patients (
            nome,
            telefone
          )
        `)
        .gte('contact_date', hoje.toISOString())
        .order('contact_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar contatos de hoje:', error);
      return [];
    }
  }

  /**
   * Estatísticas de contatos
   */
  static async getContactStats(days: number = 30): Promise<{
    total: number;
    byType: Record<string, number>;
    byDay: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // @ts-ignore - Tabela contact_history será criada via SQL
      const { data, error } = await supabase
        .from('contact_history')
        .select('contact_date, contact_type')
        .gte('contact_date', startDate.toISOString())
        .order('contact_date', { ascending: true });

      if (error) throw error;

      const contacts = data || [];
      
      // Contar por tipo
      const byType: Record<string, number> = {};
      contacts.forEach(c => {
        byType[c.contact_type] = (byType[c.contact_type] || 0) + 1;
      });

      // Contar por dia
      const byDayMap = new Map<string, number>();
      contacts.forEach(c => {
        const date = new Date(c.contact_date).toISOString().split('T')[0];
        byDayMap.set(date, (byDayMap.get(date) || 0) + 1);
      });

      const byDay = Array.from(byDayMap.entries()).map(([date, count]) => ({
        date,
        count
      }));

      return {
        total: contacts.length,
        byType,
        byDay
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { total: 0, byType: {}, byDay: [] };
    }
  }
}
