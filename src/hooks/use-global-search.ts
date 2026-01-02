import { useState, useMemo } from 'react';
import { usePatients } from './use-supabase-data';
import { usePlans } from './use-supabase-data';
import { useCheckinSearch } from './use-checkin-data';

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
  
  // OTIMIZADO: Busca de checkins agora é server-side
  // Só faz a chamada quando o usuário digita 2+ caracteres
  const { data: searchedCheckins = [], isLoading: isSearchingCheckins } = useCheckinSearch(searchTerm);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Buscar pacientes (client-side - dados já carregados)
    patients?.forEach(patient => {
      const nome = patient.nome?.toLowerCase() || '';
      const apelido = patient.apelido?.toLowerCase() || '';
      const telefone = patient.telefone?.toLowerCase() || '';
      const plano = patient.plano?.toLowerCase() || '';
      
      if (nome.includes(term) || apelido.includes(term) || telefone.includes(term) || plano.includes(term)) {
        // Usar telefone para navegar para a página de evolução
        const patientTelefone = patient.telefone || '';
        results.push({
          id: patient.id,
          type: 'patient',
          title: patient.nome || patient.apelido || 'Sem nome',
          subtitle: patient.telefone || patient.plano || '',
          url: patientTelefone ? `/checkins/evolution/${patientTelefone}` : `/patients/${patient.id}`,
          data: patient
        });
      }
    });

    // Buscar planos (client-side - dados já carregados)
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

    // Buscar checkins (server-side - dados buscados sob demanda)
    // Os resultados vêm do hook useCheckinSearch que faz a busca no banco
    searchedCheckins?.forEach(checkin => {
      results.push({
        id: checkin.id,
        type: 'checkin',
        title: `Check-in de ${checkin.telefone || 'Paciente'}`,
        subtitle: checkin.objetivo?.substring(0, 50) + (checkin.objetivo && checkin.objetivo.length > 50 ? '...' : '') || 
                  checkin.dificuldades?.substring(0, 50) + (checkin.dificuldades && checkin.dificuldades.length > 50 ? '...' : '') || 
                  '',
        url: `/checkins?highlight=${checkin.id}`,
        data: checkin
      });
    });

    return results.slice(0, 15); // Limitar a 15 resultados
  }, [searchTerm, patients, plans, searchedCheckins]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isOpen,
    setIsOpen,
    isSearching: isSearchingCheckins // Indicador de busca em andamento
  };
}
