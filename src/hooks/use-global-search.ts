import { useState, useMemo } from 'react';
import { usePatients } from './use-supabase-data';
import { usePlans } from './use-supabase-data';
import { useCheckins } from './use-checkin-data';

export interface SearchResult {
  id: string;
  type: 'patient' | 'plan' | 'checkin';
  title: string;
  subtitle?: string;
  url: string;
  data: any;
}

export function useGlobalSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { patients } = usePatients();
  const { plans } = usePlans();
  const { checkins } = useCheckins();

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Buscar pacientes
    patients?.forEach(patient => {
      const nome = patient.nome?.toLowerCase() || '';
      const apelido = patient.apelido?.toLowerCase() || '';
      const telefone = patient.telefone?.toLowerCase() || '';
      const plano = patient.plano?.toLowerCase() || '';
      
      if (nome.includes(term) || apelido.includes(term) || telefone.includes(term) || plano.includes(term)) {
        results.push({
          id: patient.id,
          type: 'patient',
          title: patient.nome || patient.apelido || 'Sem nome',
          subtitle: patient.telefone || patient.plano || '',
          url: `/patients?highlight=${patient.id}`,
          data: patient
        });
      }
    });

    // Buscar planos
    plans?.forEach(plan => {
      const nome = plan.nome?.toLowerCase() || '';
      const descricao = plan.descricao?.toLowerCase() || '';
      
      if (nome.includes(term) || descricao.includes(term)) {
        results.push({
          id: plan.id,
          type: 'plan',
          title: plan.nome || 'Sem nome',
          subtitle: plan.descricao || `R$ ${plan.preco || 0}`,
          url: `/plans?highlight=${plan.id}`,
          data: plan
        });
      }
    });

    // Buscar checkins
    checkins?.forEach(checkin => {
      const telefone = checkin.telefone?.toLowerCase() || '';
      const objetivo = checkin.objetivo?.toLowerCase() || '';
      const dificuldades = checkin.dificuldades?.toLowerCase() || '';
      
      if (telefone.includes(term) || objetivo.includes(term) || dificuldades.includes(term)) {
        results.push({
          id: checkin.id,
          type: 'checkin',
          title: `Check-in de ${checkin.telefone || 'Paciente'}`,
          subtitle: checkin.objetivo?.substring(0, 50) + '...' || checkin.dificuldades?.substring(0, 50) + '...' || '',
          url: `/checkins?highlight=${checkin.id}`,
          data: checkin
        });
      }
    });

    return results.slice(0, 10); // Limitar a 10 resultados
  }, [searchTerm, patients, plans, checkins]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isOpen,
    setIsOpen
  };
}
