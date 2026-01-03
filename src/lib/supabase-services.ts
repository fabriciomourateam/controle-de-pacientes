import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserId } from '@/lib/auth-helpers';
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
    
    // Normalizar para meia-noite para comparação precisa
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  },

  // Buscar todos os pacientes
  // Otimizado: aceita limite opcional para reduzir egress
  // Para buscar todos os pacientes sem limite, passe undefined ou null
  async getAll(limit?: number | null) {
    let query = supabase
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
        updated_at,
        ultimo_contato,
        data_cancelamento,
        data_congelamento
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar limite apenas se fornecido e for um número válido
    // Se limit for null ou undefined, busca todos os registros
    if (limit !== null && limit !== undefined && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Atualizar days_to_expiration para todos os pacientes
    const updatedData = data?.map(patient => {
      const diasParaVencer = this.calculateDaysToExpiration(patient.vencimento);
      
      return {
        ...patient,
        dias_para_vencer: diasParaVencer
      };
    });

    return updatedData;
  },

  // Buscar pacientes recentes (últimas X horas) - para merge inteligente
  async getRecent(hours: number = 48) {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    let query = supabase
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
        updated_at,
        ultimo_contato,
        data_cancelamento,
        data_congelamento
      `)
      .gte('updated_at', cutoffDate.toISOString()) // Pacientes atualizados ou criados recentemente
      .order('updated_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Atualizar days_to_expiration para todos os pacientes
    const updatedData = data?.map(patient => {
      const diasParaVencer = this.calculateDaysToExpiration(patient.vencimento);
      
      return {
        ...patient,
        dias_para_vencer: diasParaVencer
      };
    }) || [];
    
    return updatedData;
  },

  // Buscar apenas planos únicos (otimizado - não carrega todos os pacientes)
  async getUniquePlans(): Promise<string[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('plano')
      .not('plano', 'is', null);

    if (error) throw error;
    
    // Extrair planos únicos e ordenar
    const uniquePlans = [...new Set(data?.map(p => p.plano).filter(Boolean))];
    return uniquePlans.sort();
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
    // Obter user_id do usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login para criar pacientes.');
    }

    // Verificar limite de pacientes antes de criar
    const { subscriptionService } = await import('./subscription-service');
    const limitCheck = await subscriptionService.canAddPatient();
    
    if (!limitCheck.canAdd) {
      throw new Error(limitCheck.reason || 'Limite de pacientes atingido. Faça upgrade do seu plano.');
    }

    // Calcular dias_para_vencer se vencimento for fornecido
    const patientData = {
      ...patient,
      user_id: user.id, // Garantir que user_id seja definido (trigger também faz isso, mas é bom garantir)
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
    const updatedData = data?.map(patient => {
      const diasParaVencer = this.calculateDaysToExpiration(patient.vencimento);
      
      return {
        ...patient,
        dias_para_vencer: diasParaVencer
      };
    }).filter(patient => {
      // Apenas pacientes ativos (não inativos/negativados)
      const diasParaVencer = patient.dias_para_vencer;
      
      // Excluir pacientes inativos/negativados
      if (diasParaVencer === null) return false;
      // Removido: if (diasParaVencer < 0) return false; // Agora inclui vencidos
      
      // Excluir planos específicos que não devem aparecer no card "Ação Necessária"
      const planosExcluidos = [
        'INATIVO',
        'CONGELADO', 
        'RESCISÃO',
        '⚠️ Pendência Financeira',
        '⛔ Negativado'
      ];
      
      if (planosExcluidos.includes(patient.plano)) return false;
      
      // Incluir pacientes vencidos (dias_para_vencer < 0) e que vencem nos próximos X dias
      return diasParaVencer <= days;
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
      updated_at,
      ultimo_contato,
      data_cancelamento,
      data_congelamento
    `);

    // Aplicar filtros
    // Busca por nome, apelido ou telefone (case-insensitive, busca desde o início)
    if (filters.search && filters.search.trim().length > 0) {
      const searchTerm = filters.search.trim();
      // Busca que funciona desde as primeiras letras (ilike com % no início e fim)
      query = query.or(`nome.ilike.%${searchTerm}%,apelido.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%`);
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
    } else {
      // Ordenação padrão se não especificada
      query = query.order('created_at', { ascending: false });
    }

    // Não aplicar limite aqui - deixar o componente controlar a paginação
    // Isso permite que filtros funcionem corretamente
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Atualizar days_to_expiration para todos os pacientes retornados
    const updatedData = data?.map(patient => {
      const diasParaVencer = this.calculateDaysToExpiration(patient.vencimento);
      
      return {
        ...patient,
        dias_para_vencer: diasParaVencer
      };
    }) || [];
    
    return updatedData;
  }
};

// ===== PLANOS =====
export const planService = {
  // Buscar todos os planos (RLS já filtra por user_id automaticamente)
  async getAll(includeInactive: boolean = false) {
    let query = supabase
      .from('plans')
      .select('*')
      .order('name', { ascending: true });
    
    if (!includeInactive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;
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

  // Buscar pacientes que usam um plano específico
  async getPatientsByPlan(planName: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, nome, telefone, plano')
      .eq('plano', planName);

    if (error) throw error;
    return data || [];
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

  // Atualizar plano e sincronizar com pacientes
  async update(id: string, updates: PlanUpdate) {
    // Buscar o plano antigo para comparar o nome
    const oldPlan = await this.getById(id);
    const oldName = oldPlan.name;
    
    // Atualizar o plano
    const { data, error } = await supabase
      .from('plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Se o nome do plano mudou, atualizar todos os pacientes que usam esse plano
    if (updates.name && updates.name !== oldName) {
      try {
        const { error: updateError } = await supabase
          .from('patients')
          .update({ plano: updates.name })
          .eq('plano', oldName);

        if (updateError) {
          console.error('Erro ao atualizar pacientes ao renomear plano:', updateError);
          // Não lançar erro, apenas logar, pois o plano foi atualizado com sucesso
        } else {
          console.log(`✅ Plano renomeado: "${oldName}" → "${updates.name}". Pacientes atualizados.`);
        }
      } catch (syncError) {
        console.error('Erro ao sincronizar pacientes com novo nome do plano:', syncError);
      }
    }

    return data;
  },

  // Deletar plano (com verificação de pacientes usando)
  async delete(id: string) {
    // Verificar se há pacientes usando esse plano
    const plan = await this.getById(id);
    const patients = await this.getPatientsByPlan(plan.name);
    
    if (patients.length > 0) {
      throw new Error(`Não é possível deletar o plano "${plan.name}" pois ${patients.length} paciente(s) estão usando ele. Remova o plano dos pacientes primeiro.`);
    }

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
  // Otimizado: usa campos específicos e limite para reduzir egress
  // Para buscar todos os pacientes sem limite, passe null ou undefined
  async getAll(limit: number | null = 1000) {
    let query = supabase
      .from('patients')
      .select(`
        id,
        nome,
        apelido,
        telefone,
        plano,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    // Aplicar limite apenas se fornecido e for um número válido
    if (limit !== null && limit !== undefined && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;

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
      // Obter user_id do usuário autenticado
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Usuário não autenticado. Faça login para visualizar as métricas.');
      }

      console.log('🔍 Buscando dados para gráfico usando mesma lógica da página de métricas...');

      // Usar a mesma lógica da página de métricas - buscar dados da tabela dashboard_dados
      // FILTRAR POR USER_ID para garantir isolamento de dados
      const { data: dashboardDados, error: dadosError } = await supabase
        .from('dashboard_dados')
        .select('*')
        .eq('user_id', userId) // FILTRAR POR USER_ID
        .order('ano', { ascending: true })
        .order('mes_numero', { ascending: true });

      if (dadosError) {
        console.error('❌ Erro ao buscar dashboard_dados:', dadosError);
        throw new Error(`Tabela dashboard_dados: ${dadosError.message}`);
      }

      // Verificar se há dados
      if (!dashboardDados || dashboardDados.length === 0) {
        console.log('⚠️ Tabela dashboard_dados está vazia para este usuário. Retornando dados vazios.');
        // Retornar dados vazios em vez de simulados para novos usuários
        return {
          monthlyData: [],
          planDistribution: []
        };
      }

      console.log('✅ Dashboard dados carregados para gráfico:', dashboardDados?.length || 0);

      // Processar dados usando a mesma lógica da página de métricas
      const monthlyData = [];
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      // Pegar os últimos 6 meses de dados
      const recentData = dashboardDados.slice(-6);

      recentData.forEach((item, index) => {
        try {
          // Função para converter valores que podem vir como string
          const parseNumber = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') return parseFloat(value) || 0;
            return 0;
          };

          const mesNumero = parseNumber(item.mes_numero);
          const ativosInicioMes = parseNumber(item.ativos_total_inicio_mes);
          const entraram = parseNumber(item.entraram);
          const sairam = parseNumber(item.sairam);
          let percentualChurn = parseNumber(item.percentual_churn);
          let percentualRenovacao = parseNumber(item.percentual_renovacao);

          // Converter valores: se for decimal (0-1), multiplicar por 100; se já for percentual (0-100), usar direto
          if (percentualRenovacao > 0 && percentualRenovacao < 1) {
            percentualRenovacao = percentualRenovacao * 100;
          }
          if (percentualChurn > 0 && percentualChurn < 1) {
            percentualChurn = percentualChurn * 100;
          }

          // Usar o mês real dos dados em vez de calcular pelo índice
          let monthName = '';
          
          // Mapear nomes completos para abreviados
          const monthMap: { [key: string]: string } = {
            'Janeiro': 'Jan', 'Fevereiro': 'Fev', 'Março': 'Mar', 'Abril': 'Abr',
            'Maio': 'Mai', 'Junho': 'Jun', 'Julho': 'Jul', 'Agosto': 'Ago',
            'Setembro': 'Set', 'Outubro': 'Out', 'Novembro': 'Nov', 'Dezembro': 'Dez'
          };
          
          if (item.mes) {
            // Se o mês já está no formato abreviado, usar direto
            if (months.includes(item.mes)) {
              monthName = item.mes;
            } else if (monthMap[item.mes]) {
              // Se está no formato completo, converter para abreviado
              monthName = monthMap[item.mes];
            } else {
              // Tentar encontrar correspondência parcial
              const found = Object.keys(monthMap).find(key => 
                key.toLowerCase().includes(item.mes.toLowerCase()) || 
                item.mes.toLowerCase().includes(key.toLowerCase())
              );
              monthName = found ? monthMap[found] : item.mes.substring(0, 3);
            }
          }
          
          // Se não tiver o nome do mês, usar o número do mês
          if (!monthName && mesNumero) {
            const monthIndex = Math.max(0, Math.min(11, mesNumero - 1));
            monthName = months[monthIndex];
          }
          
          // Se ainda não tiver, usar o índice como fallback
          if (!monthName) {
            const date = new Date();
            date.setMonth(date.getMonth() - (5 - index));
            monthName = months[date.getMonth()];
          }

          monthlyData.push({
            month: monthName,
            novos: entraram, // Pacientes que entraram
            feedbacks: entraram, // Usar mesmo valor para feedbacks
            renovacao: percentualRenovacao, // Já está em formato percentual (0-100)
            churn: percentualChurn // Já está em formato percentual (0-100)
          });

          console.log(`📊 Gráfico - ${monthName}:`, {
            novos: entraram,
            renovacao: percentualRenovacao.toFixed(1) + '%',
            churn: percentualChurn.toFixed(1) + '%'
          });

        } catch (e) {
          console.log(`❌ Erro ao processar dados do gráfico para período ${item.mes_numero}:`, e);
        }
      });

      // Distribuição de planos (apenas ativos)
      // FILTRAR POR USER_ID para garantir isolamento de dados
      const { data: plansData } = await supabase
        .from('patients')
        .select('plano')
        .eq('user_id', userId); // FILTRAR POR USER_ID

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
