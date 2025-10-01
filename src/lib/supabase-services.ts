import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Patient = Database['public']['Tables']['patients']['Row'];
type PatientInsert = Database['public']['Tables']['patients']['Insert'];
type PatientUpdate = Database['public']['Tables']['patients']['Update'];

type Plan = Database['public']['Tables']['plans']['Row'];
type PlanInsert = Database['public']['Tables']['plans']['Insert'];
type PlanUpdate = Database['public']['Tables']['plans']['Update'];

type Feedback = Database['public']['Tables']['patients']['Row'];
type FeedbackInsert = Database['public']['Tables']['patients']['Insert'];
type FeedbackUpdate = Database['public']['Tables']['patients']['Update'];

// ===== PACIENTES =====
export const patientService = {
  // Função para calcular dias até expiração
  calculateDaysToExpiration(expirationDate: string | null): number | null {
    if (!expirationDate) return null;
    
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },

  // Buscar todos os pacientes
  async getAll() {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        nome,
        apelido,
        cpf,
        email,
        telefone,
        genero,
        data_nascimento,
        inicio_acompanhamento,
        plano,
        tempo_acompanhamento,
        vencimento,
        dias_para_vencer,
        valor,
        ticket_medio,
        rescisao_30_percent,
        pagamento,
        observacao,
        indicacoes,
        lembrete,
        telefone_filtro,
        antes_depois,
        janeiro,
        fevereiro,
        marco,
        abril,
        maio,
        junho,
        julho,
        agosto,
        setembro,
        outubro,
        novembro,
        dezembro,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Atualizar days_to_expiration para todos os pacientes
    const updatedData = data?.map(patient => ({
      ...patient,
      dias_para_vencer: this.calculateDaysToExpiration(patient.vencimento)
    }));

    return updatedData;
  },

  // Buscar paciente por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        nome,
        apelido,
        cpf,
        email,
        telefone,
        genero,
        data_nascimento,
        inicio_acompanhamento,
        plano,
        tempo_acompanhamento,
        vencimento,
        dias_para_vencer,
        valor,
        ticket_medio,
        rescisao_30_percent,
        pagamento,
        observacao,
        indicacoes,
        lembrete,
        telefone_filtro,
        antes_depois,
        janeiro,
        fevereiro,
        marco,
        abril,
        maio,
        junho,
        julho,
        agosto,
        setembro,
        outubro,
        novembro,
        dezembro,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    // Atualizar days_to_expiration
    const updatedData = {
      ...data,
      dias_para_vencer: this.calculateDaysToExpiration(data.vencimento)
    };

    return updatedData;
  },

  // Criar novo paciente
  async create(patient: PatientInsert) {
    // Calcular dias_para_vencer se vencimento for fornecido
    const patientData = {
      ...patient,
      dias_para_vencer: patient.vencimento ? this.calculateDaysToExpiration(patient.vencimento) : null
    };

    const { data, error } = await supabase
      .from('patients')
      .insert(patientData)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar paciente
  async update(id: string, updates: PatientUpdate) {
    // Calcular dias_para_vencer se vencimento for fornecido
    const updateData = {
      ...updates,
      dias_para_vencer: updates.vencimento ? this.calculateDaysToExpiration(updates.vencimento) : undefined
    };

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar paciente
  async delete(id: string) {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar pacientes expirando
  async getExpiring(days: number = 30) {
    const { data, error } = await supabase
      .from('patients')
      .select(`
        id,
        nome,
        apelido,
        cpf,
        email,
        telefone,
        genero,
        data_nascimento,
        inicio_acompanhamento,
        plano,
        tempo_acompanhamento,
        vencimento,
        dias_para_vencer,
        valor,
        ticket_medio,
        rescisao_30_percent,
        pagamento,
        observacao,
        indicacoes,
        lembrete,
        telefone_filtro,
        antes_depois,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filtrar e calcular dias_para_vencer
    const updatedData = data?.map(patient => ({
      ...patient,
      dias_para_vencer: this.calculateDaysToExpiration(patient.vencimento)
    })).filter(patient => {
      // Apenas pacientes ativos (não inativos/negativados)
      const diasParaVencer = patient.dias_para_vencer;
      
      // Excluir pacientes inativos/negativados
      if (diasParaVencer === null) return false;
      if (diasParaVencer < 0) return false; // Já expiraram
      
      // Excluir planos específicos que não devem aparecer no card "Ação Necessária"
      const planosExcluidos = [
        'INATIVO',
        'CONGELADO', 
        'RESCISÃO',
        '⚠️ Pendência Financeira',
        '⛔ Negativado'
      ];
      
      if (planosExcluidos.includes(patient.plano)) return false;
      
      // Apenas pacientes que vencem nos próximos X dias
      return diasParaVencer <= days && diasParaVencer >= 0;
    }).sort((a, b) => (a.dias_para_vencer || 0) - (b.dias_para_vencer || 0));

    return updatedData;
  },

  // Buscar pacientes com filtros e ordenação
  async getFiltered(filters: any, sorting: any, visibleColumns: string[]): Promise<Patient[]> {
    let query = supabase.from('patients').select(`
      id,
      nome,
      apelido,
      cpf,
      email,
      telefone,
      genero,
      data_nascimento,
      inicio_acompanhamento,
      plano,
      tempo_acompanhamento,
      vencimento,
      dias_para_vencer,
      valor,
      ticket_medio,
      rescisao_30_percent,
      pagamento,
      observacao,
      indicacoes,
      lembrete,
      telefone_filtro,
      antes_depois,
      janeiro,
      fevereiro,
      marco,
      abril,
      maio,
      junho,
      julho,
      agosto,
      setembro,
      outubro,
      novembro,
      dezembro,
      created_at,
      updated_at
    `);

    // Aplicar filtros
    if (filters.search) {
      query = query.or(`nome.ilike.%${filters.search}%,apelido.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`);
    }

    // Priorizar múltiplos planos sobre plano único
    if (filters.plans && filters.plans.length > 0) {
      query = query.in('plano', filters.plans);
    } else if (filters.plan) {
      query = query.eq('plano', filters.plan);
    }

    if (filters.gender) {
      query = query.eq('genero', filters.gender);
    }

    if (filters.status) {
      const today = new Date();
      switch (filters.status) {
        case 'active':
          query = query.gte('vencimento', today.toISOString().split('T')[0]);
          break;
        case 'expired':
          query = query.lt('vencimento', today.toISOString().split('T')[0]);
          break;
        case 'expiring_soon':
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + 7);
          query = query
            .gte('vencimento', today.toISOString().split('T')[0])
            .lte('vencimento', futureDate.toISOString().split('T')[0]);
          break;
      }
    }

    if (filters.days_to_expire) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.days_to_expire);
      query = query
        .gte('vencimento', new Date().toISOString().split('T')[0])
        .lte('vencimento', futureDate.toISOString().split('T')[0]);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after.toISOString());
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before.toISOString());
    }

    // Aplicar ordenação
    if (sorting.field) {
      query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
};

// ===== PLANOS =====
export const planService = {
  // Buscar todos os planos
  async getAll() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Buscar plano por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo plano
  async create(plan: PlanInsert) {
    const { data, error } = await supabase
      .from('plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar plano
  async update(id: string, updates: PlanUpdate) {
    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar plano
  async delete(id: string) {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// ===== FEEDBACKS (usando dados da tabela patients) =====
export const feedbackService = {
  // Buscar todos os pacientes (sem filtro de pontuação)
  async getAll() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Buscar paciente por ID (com dados de pontuação)
  async getByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar paciente por ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar pacientes recentes
  async getRecent(limit: number = 5) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Buscar pacientes pendentes (todos os pacientes)
  async getPending() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};

// ===== DASHBOARD MÉTRICAS =====
export const dashboardService = {
  // Buscar métricas do dashboard
  async getMetrics(filterThisMonth: boolean = false) {
    try {
      // Total de pacientes
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Buscar todos os pacientes para calcular expirando
      const { data: allPatients } = await supabase
        .from('patients')
        .select('vencimento, created_at, telefone, plano');

      // Calcular pacientes expirando em 30 dias
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const expiringPatients = allPatients?.filter(patient => {
        if (!patient.vencimento) return false;
        const expDate = new Date(patient.vencimento);
        return expDate >= today && expDate <= thirtyDaysFromNow;
      }).length || 0;

      // Calcular pacientes ativos (excluindo planos inativos)
      const inactivePlans = ['INATIVO', '⛔ Negativado', 'RESCISÃO', 'Pendência Financeira', 'CONGELADO'];
      const activePatients = allPatients?.filter(patient => {
        return patient.plano && !inactivePlans.includes(patient.plano);
      }).length || 0;

      // Buscar checkins existentes para calcular pendentes
      const { data: checkins } = await supabase
        .from('checkin')
        .select('telefone, data_checkin, total_pontuacao');

      // Calcular checkins pendentes (pacientes sem checkin recente)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      // Criar mapa de checkins por telefone
      const checkinsByPhone = new Map();
      checkins?.forEach(checkin => {
        if (checkin.telefone) {
          const checkinDate = new Date(checkin.data_checkin);
          if (!checkinsByPhone.has(checkin.telefone) || checkinDate > checkinsByPhone.get(checkin.telefone)) {
            checkinsByPhone.set(checkin.telefone, checkinDate);
          }
        }
      });
      
      // Contar pacientes ATIVOS sem checkin recente (apenas pacientes com planos ativos)
      const activePatientsData = allPatients?.filter(patient => {
        return patient.plano && !inactivePlans.includes(patient.plano);
      }) || [];
      
      const pendingFeedbacks = activePatientsData.filter(patient => {
        if (!patient.telefone) return true; // Se não tem telefone, considera pendente
        
        const lastCheckin = checkinsByPhone.get(patient.telefone);
        if (!lastCheckin) return true; // Se nunca fez checkin, considera pendente
        
        return lastCheckin < thirtyDaysAgo; // Se último checkin foi há mais de 30 dias
      }).length;

      // Calcular score médio baseado nos checkins
      let avgOverallScore = '0.0';
      if (checkins && checkins.length > 0) {
        const validScores = checkins
          .filter(checkin => checkin.total_pontuacao && !isNaN(parseFloat(checkin.total_pontuacao)))
          .map(checkin => parseFloat(checkin.total_pontuacao));
        
        if (validScores.length > 0) {
          const totalScore = validScores.reduce((sum, score) => sum + score, 0);
          avgOverallScore = (totalScore / validScores.length).toFixed(1);
        }
      }

      // Se filtrar por este mês, filtrar os dados localmente
      if (filterThisMonth) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        // Filtrar pacientes criados neste mês
        const patientsThisMonth = allPatients?.filter(patient => {
          if (!patient.created_at) return false;
          const createdDate = new Date(patient.created_at);
          return createdDate >= startOfMonth && createdDate <= endOfMonth;
        }) || [];
        
        // Filtrar pacientes que VENCEM neste mês (não os que foram criados)
        const expiringThisMonth = allPatients?.filter(patient => {
          if (!patient.vencimento) return false;
          const expDate = new Date(patient.vencimento);
          return expDate >= startOfMonth && expDate <= endOfMonth;
        }) || [];
        
        // Calcular checkins pendentes para pacientes ATIVOS deste mês
        const activePatientsThisMonthData = patientsThisMonth.filter(patient => {
          return patient.plano && !inactivePlans.includes(patient.plano);
        });
        
        const pendingThisMonth = activePatientsThisMonthData.filter(patient => {
          if (!patient.telefone) return true;
          
          const lastCheckin = checkinsByPhone.get(patient.telefone);
          if (!lastCheckin) return true;
          
          return lastCheckin < thirtyDaysAgo;
        }).length;
        
        // Calcular pacientes ativos deste mês
        const activePatientsThisMonth = patientsThisMonth.filter(patient => {
          return patient.plano && !inactivePlans.includes(patient.plano);
        }).length;

        // Calcular score médio para checkins deste mês
        let avgScoreThisMonth = '0.0';
        if (checkins && checkins.length > 0) {
          const checkinsThisMonth = checkins.filter(checkin => {
            const checkinDate = new Date(checkin.data_checkin);
            return checkinDate >= startOfMonth && checkinDate <= endOfMonth;
          });
          
          const validScores = checkinsThisMonth
            .filter(checkin => checkin.total_pontuacao && !isNaN(parseFloat(checkin.total_pontuacao)))
            .map(checkin => parseFloat(checkin.total_pontuacao));
          
          if (validScores.length > 0) {
            const totalScore = validScores.reduce((sum, score) => sum + score, 0);
            avgScoreThisMonth = (totalScore / validScores.length).toFixed(1);
          }
        }
        
        return {
          totalPatients: patientsThisMonth.length,
          activePatients: activePatientsThisMonth,
          expiringPatients: expiringThisMonth.length,
          pendingFeedbacks: pendingThisMonth,
          avgOverallScore: avgScoreThisMonth
        };
      }

      return {
        totalPatients: totalPatients || 0,
        activePatients,
        expiringPatients,
        pendingFeedbacks,
        avgOverallScore
      };
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return {
        totalPatients: 0,
        activePatients: 0,
        expiringPatients: 0,
        pendingFeedbacks: 0,
        avgOverallScore: '0.0'
      };
    }
  },

  // Buscar dados para gráficos
  async getChartData(filterThisMonth: boolean = false) {
    try {
      let startDate: Date;
      
      if (filterThisMonth) {
        // Se filtrar por este mês, mostrar apenas o mês atual
        startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else {
        // Dados mensais dos últimos 6 meses
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
      }

      // Novos pacientes por mês - usando data de início do acompanhamento
      const { data: patientsData } = await supabase
        .from('patients')
        .select('inicio_acompanhamento, plano')
        .gte('inicio_acompanhamento', startDate.toISOString());

      // Pacientes com pontuação por mês (usando mesmo critério)
      const { data: feedbacksData } = await supabase
        .from('patients')
        .select('inicio_acompanhamento')
        .gte('inicio_acompanhamento', startDate.toISOString());

      // Processar dados para gráfico
      const monthlyData = [];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = months[date.getMonth()];
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const novos = patientsData?.filter(p => {
          if (!p.inicio_acompanhamento) return false;
          const inicioDate = new Date(p.inicio_acompanhamento);
          return inicioDate >= monthStart && inicioDate <= monthEnd;
        }).length || 0;
        
        const feedbacks = feedbacksData?.filter(f => {
          if (!f.inicio_acompanhamento) return false;
          const inicioDate = new Date(f.inicio_acompanhamento);
          return inicioDate >= monthStart && inicioDate <= monthEnd;
        }).length || 0;
        
        // Simular dados de renovação e churn em porcentagem
        // Renovação: 65-85% (baseado em dados típicos de retenção)
        const renovacao = 65 + Math.random() * 20;
        
        // Churn: 8-18% (baseado em dados típicos de churn)
        const churn = 8 + Math.random() * 10;
        
        monthlyData.push({
          month: monthName,
          novos,
          feedbacks,
          renovacao: Number(renovacao.toFixed(1)),
          churn: Number(churn.toFixed(1))
        });
      }

      // Distribuição de planos (apenas ativos)
      const { data: plansData } = await supabase
        .from('patients')
        .select('plano');

      // Planos inativos a serem excluídos
      const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];

      const planCounts: { [key: string]: number } = {};
      plansData?.forEach(patient => {
        const planName = patient.plano || 'Sem Plano';
        
        // Filtrar apenas planos ativos
        const isActivePlan = !inactivePlans.some(inactive => 
          planName.toUpperCase().includes(inactive.toUpperCase()) || 
          inactive.toUpperCase().includes(planName.toUpperCase())
        );
        
        if (isActivePlan) {
          planCounts[planName] = (planCounts[planName] || 0) + 1;
        }
      });

      // Função para obter cor do plano (mesma lógica das tags)
      const getPlanColor = (plano: string) => {
        const planColors: { [key: string]: string } = {
          // Planos ativos - cores vibrantes
          'BASIC': '#eab308', // yellow-500
          'PREMIUM': '#3b82f6', // blue-500
          
          // Planos inativos - cores mais escuras
          'INATIVO': '#64748b', // slate-500
          'CONGELADO': '#2563eb', // blue-600
          'RESCISÃO': '#dc2626', // red-600
          'PENDÊNCIA FINANCEIRA': '#ea580c', // orange-600
          'NEGATIVADO': '#b91c1c', // red-700
        };
        
        // Buscar por correspondência parcial para planos com emojis ou variações
        const normalizedPlano = plano.toUpperCase().trim();
        const matchingKey = Object.keys(planColors).find(key => 
          normalizedPlano.includes(key) || key.includes(normalizedPlano)
        );
        
        return matchingKey ? planColors[matchingKey] : '#64748b'; // slate-500 como padrão
      };

      const planDistribution = Object.entries(planCounts).map(([name, value]) => ({
        name,
        value,
        color: getPlanColor(name)
      }));

      return {
        monthlyData,
        planDistribution
      };
    } catch (error) {
      console.error('Erro ao buscar dados dos gráficos:', error);
      return {
        monthlyData: [],
        planDistribution: []
      };
    }
  }
};

// Exportar tipos para uso em outros arquivos
export type { Patient, PatientInsert, PatientUpdate };
export type { Plan, PlanInsert, PlanUpdate };
export type { Feedback, FeedbackInsert, FeedbackUpdate };
