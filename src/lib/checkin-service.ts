import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Checkin = Database['public']['Tables']['checkin']['Row'];
type CheckinInsert = Database['public']['Tables']['checkin']['Insert'];
type CheckinUpdate = Database['public']['Tables']['checkin']['Update'];

export interface CheckinWithPatient extends Checkin {
  patient?: {
    id: string;
    nome: string;
    telefone: string;
  };
}

export const checkinService = {
  // Buscar todos os checkins
  // Otimizado: limita a 500 registros mais recentes e usa campos específicos
  async getAll(limit: number = 500): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select(`
        id,
        telefone,
        data_checkin,
        data_preenchimento,
        peso,
        medida,
        objetivo,
        dificuldades,
        treino,
        cardio,
        agua,
        sono,
        melhora_visual,
        foto_1,
        foto_2,
        foto_3,
        foto_4,
        mes_ano,
        total_pontuacao,
        percentual_aproveitamento,
        created_at,
        updated_at
      `)
      .order('data_checkin', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins com dados do paciente (usando telefone)
  // Otimizado: aceita limite customizado para reduzir tráfego
  // Filtra apenas check-ins completos (não inclui registros de evolução)
  async getAllWithPatient(limit: number | null = 200): Promise<CheckinWithPatient[]> {
    let query = supabase
      .from('checkin')
      .select(`
        *,
        patient:patients!inner(
          id,
          nome,
          apelido,
          telefone,
          plano
        )
      `)
      .eq('tipo_checkin', 'completo') // Filtrar apenas check-ins completos
      .order('data_checkin', { ascending: false });
    
    // Aplicar limite apenas se fornecido e for um número válido
    if (limit !== null && limit !== undefined && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins por telefone do paciente
  // MODIFICADO: Inclui registros iniciais e de evolução para o Timeline
  async getByPhone(telefone: string): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .in('tipo_checkin', ['completo', 'evolucao', 'inicial']) // Incluir todos os tipos para Timeline
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkin específico por telefone e mês/ano
  async getByPhoneAndMonth(telefone: string, mesAno: string): Promise<Checkin | null> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .eq('mes_ano', mesAno)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Criar novo checkin
  async create(checkin: CheckinInsert): Promise<Checkin> {
    // Obter user_id do usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login para criar checkins.');
    }

    const checkinData = {
      ...checkin,
      user_id: user.id, // Garantir que user_id seja definido (trigger também faz isso, mas é bom garantir)
      data_preenchimento: checkin.data_preenchimento || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('checkin')
      .insert(checkinData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar checkin existente
  async update(id: string, updates: CheckinUpdate): Promise<Checkin> {
    const { data, error } = await supabase
      .from('checkin')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Upsert checkin (criar ou atualizar)
  async upsert(checkin: CheckinInsert): Promise<Checkin> {
    const checkinData = {
      ...checkin,
      data_preenchimento: checkin.data_preenchimento || new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('checkin')
      .upsert(checkinData, { 
        onConflict: 'telefone,mes_ano',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar checkin
  async delete(id: string): Promise<void> {
    console.log('🗑️ checkinService.delete - Iniciando exclusão do checkin:', id);
    
    const { error, data } = await supabase
      .from('checkin')
      .delete()
      .eq('id', id)
      .select(); // Adicionar select para ver o que foi deletado
    
    console.log('🗑️ checkinService.delete - Resposta do Supabase:', { data, error });
    
    if (error) {
      console.error('❌ checkinService.delete - Erro do Supabase:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.warn('⚠️ checkinService.delete - Nenhum registro foi deletado. Possível problema de RLS ou ID inválido.');
    } else {
      console.log('✅ checkinService.delete - Registro deletado:', data);
    }
  },

  // Buscar checkins por período
  // Otimizado: usa campos específicos e permite limite opcional
  async getByPeriod(startDate: string, endDate: string, limit?: number): Promise<Checkin[]> {
    let query = supabase
      .from('checkin')
      .select(`
        id,
        telefone,
        data_checkin,
        data_preenchimento,
        peso,
        medida,
        objetivo,
        dificuldades,
        treino,
        cardio,
        agua,
        sono,
        melhora_visual,
        foto_1,
        foto_2,
        foto_3,
        foto_4,
        mes_ano,
        total_pontuacao,
        percentual_aproveitamento,
        created_at,
        updated_at
      `)
      .gte('data_checkin', startDate)
      .lte('data_checkin', endDate)
      .order('data_checkin', { ascending: false });
    
    // Aplicar limite apenas se especificado (permite buscar todos os registros do período)
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
  
  // Buscar checkins antigos (sem limite, para consultas históricas)
  // Use esta função quando precisar acessar registros antigos sem restrições
  async getOldCheckins(beforeDate: string, limit?: number): Promise<Checkin[]> {
    let query = supabase
      .from('checkin')
      .select(`
        id,
        telefone,
        data_checkin,
        data_preenchimento,
        peso,
        medida,
        objetivo,
        dificuldades,
        treino,
        cardio,
        agua,
        sono,
        melhora_visual,
        foto_1,
        foto_2,
        foto_3,
        foto_4,
        mes_ano,
        total_pontuacao,
        percentual_aproveitamento,
        created_at,
        updated_at
      `)
      .lt('data_checkin', beforeDate)
      .order('data_checkin', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins do mês atual
  async getCurrentMonth(): Promise<Checkin[]> {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const mesAno = `${year}-${month}`;
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('mes_ano', mesAno)
      .order('data_checkin', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar estatísticas de checkins
  async getStats(): Promise<{
    totalCheckins: number;
    checkinsThisMonth: number;
    patientsWithCheckin: number;
    averageScore: number;
  }> {
    // Total de checkins
    const { count: totalCheckins } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true });

    // Checkins deste mês
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { count: checkinsThisMonth } = await supabase
      .from('checkin')
      .select('*', { count: 'exact', head: true })
      .eq('mes_ano', currentMonth);

    // Pacientes únicos com checkin
    const { data: uniquePatients } = await supabase
      .from('checkin')
      .select('telefone')
      .not('telefone', 'is', null);
    
    const patientsWithCheckin = new Set(uniquePatients?.map(p => p.telefone)).size;

    // Score médio
    const { data: scores } = await supabase
      .from('checkin')
      .select('total_pontuacao')
      .not('total_pontuacao', 'is', null);
    
    const averageScore = scores?.length 
      ? scores.reduce((acc, curr) => acc + (curr.total_pontuacao || 0), 0) / scores.length
      : 0;

    return {
      totalCheckins: totalCheckins || 0,
      checkinsThisMonth: checkinsThisMonth || 0,
      patientsWithCheckin,
      averageScore: Math.round(averageScore * 100) / 100
    };
  },

  // Buscar evolução de um paciente específico
  async getPatientEvolution(telefone: string, months: number = 12): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .eq('telefone', telefone)
      .order('data_checkin', { ascending: true })
      .limit(months);
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins por data de preenchimento
  async getByFillDate(startDate: string, endDate: string): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', startDate)
      .lte('data_preenchimento', endDate)
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins preenchidos hoje
  async getFilledToday(): Promise<Checkin[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', `${today}T00:00:00`)
      .lte('data_preenchimento', `${today}T23:59:59`)
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar checkins preenchidos na última semana
  async getFilledLastWeek(): Promise<Checkin[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('data_preenchimento', oneWeekAgo.toISOString())
      .order('data_preenchimento', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // FUNÇÕES OTIMIZADAS PARA REDUZIR EGRESS
  // ==========================================

  /**
   * Busca checkins recentes (para notificações)
   * Otimizado: filtra por data no banco para reduzir tráfego
   * @param hours - Número de horas para buscar (padrão: 48h)
   */
  async getRecent(hours: number = 48): Promise<Checkin[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  // Buscar checkins recentes COM dados do paciente (para merge inteligente)
  async getRecentWithPatient(hours: number = 48): Promise<CheckinWithPatient[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('checkin')
      .select(`
        *,
        patient:patients!inner(
          id,
          nome,
          apelido,
          telefone,
          plano
        )
      `)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Busca checkins por termo (busca server-side)
   * Otimizado: busca no banco em vez de carregar todos os dados
   * @param term - Termo de busca (telefone, objetivo ou dificuldades)
   * @param limit - Limite de resultados (padrão: 50)
   */
  async search(term: string, limit: number = 50): Promise<Checkin[]> {
    if (!term || term.trim().length < 2) {
      return [];
    }

    const searchTerm = term.trim();
    
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .or(`telefone.ilike.%${searchTerm}%,objetivo.ilike.%${searchTerm}%,dificuldades.ilike.%${searchTerm}%`)
      .order('data_checkin', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  },

  /**
   * Busca o último checkin de cada paciente (para alertas de inatividade)
   * Otimizado: usa distinct on para pegar apenas o mais recente de cada telefone
   */
  async getLastCheckinPerPatient(): Promise<Checkin[]> {
    // Usar RPC ou query otimizada - por enquanto, buscar últimos 200 e agrupar no client
    const { data, error } = await supabase
      .from('checkin')
      .select('*')
      .order('data_checkin', { ascending: false })
      .limit(500); // Pegar mais registros para ter cobertura de mais pacientes
    
    if (error) throw error;
    
    // Agrupar por telefone e pegar apenas o mais recente de cada
    const latestByPhone = new Map<string, Checkin>();
    for (const checkin of data || []) {
      if (checkin.telefone && !latestByPhone.has(checkin.telefone)) {
        latestByPhone.set(checkin.telefone, checkin);
      }
    }
    
    return Array.from(latestByPhone.values());
  }
};
