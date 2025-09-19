import { useState, useMemo } from 'react';
import { useSupabaseData } from './use-supabase-data';

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
  const { patients, plans, checkins } = useSupabaseData();

  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Buscar pacientes
    patients?.forEach(patient => {
      const name = patient.name?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';
      const phone = patient.phone?.toLowerCase() || '';
      
      if (name.includes(term) || email.includes(term) || phone.includes(term)) {
        results.push({
          id: patient.id,
          type: 'patient',
          title: patient.name || 'Sem nome',
          subtitle: patient.email || patient.phone || '',
          url: `/patients?highlight=${patient.id}`,
          data: patient
        });
      }
    });

    // Buscar planos
    plans?.forEach(plan => {
      const name = plan.name?.toLowerCase() || '';
      const description = plan.description?.toLowerCase() || '';
      
      if (name.includes(term) || description.includes(term)) {
        results.push({
          id: plan.id,
          type: 'plan',
          title: plan.name || 'Sem nome',
          subtitle: plan.description || `R$ ${plan.price || 0}`,
          url: `/plans?highlight=${plan.id}`,
          data: plan
        });
      }
    });

    // Buscar checkins
    checkins?.forEach(checkin => {
      const patientName = checkin.patient_name?.toLowerCase() || '';
      const message = checkin.message?.toLowerCase() || '';
      
      if (patientName.includes(term) || message.includes(term)) {
        results.push({
          id: checkin.id,
          type: 'checkin',
          title: `Check-in de ${checkin.patient_name || 'Paciente'}`,
          subtitle: checkin.message?.substring(0, 50) + '...' || '',
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
