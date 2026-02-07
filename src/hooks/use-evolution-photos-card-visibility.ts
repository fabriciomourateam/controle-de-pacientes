import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CARD_KEY_EVOLUTION_PHOTOS = 'evolution_photos';

export function useEvolutionPhotosCardVisibility(patientTelefone: string | null | undefined) {
  const [visible, setVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!patientTelefone) {
      setVisible(true);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('portal_card_visibility')
        .select('id, visible')
        .eq('patient_telefone', patientTelefone)
        .eq('card_key', CARD_KEY_EVOLUTION_PHOTOS)
        .maybeSingle();

      if (error) throw error;
      setRecordId(data?.id ?? null);
      setVisible(data?.visible !== false);
    } catch (err) {
      console.error('Erro ao carregar visibilidade do card Evolução Fotográfica:', err);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }, [patientTelefone]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVisibility = useCallback(async () => {
    if (!patientTelefone) return;

    const newVisible = !visible;
    try {
      if (recordId) {
        const { error } = await (supabase as any)
          .from('portal_card_visibility')
          .update({ visible: newVisible })
          .eq('id', recordId);

        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any)
          .from('portal_card_visibility')
          .insert({
            patient_telefone: patientTelefone,
            card_key: CARD_KEY_EVOLUTION_PHOTOS,
            visible: newVisible,
          })
          .select('id')
          .single();

        if (error) throw error;
        setRecordId(data?.id ?? null);
      }
      setVisible(newVisible);
      toast({
        title: newVisible ? 'Card visível no portal' : 'Card oculto do portal',
        description: newVisible
          ? 'O card Evolução Fotográfica será exibido na página pública do paciente.'
          : 'O card Evolução Fotográfica foi ocultado da página pública.',
      });
    } catch (err: any) {
      console.error('Erro ao alterar visibilidade:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a visibilidade do card.',
        variant: 'destructive',
      });
    }
  }, [patientTelefone, visible, recordId, toast]);

  return { visible, loading, toggleVisibility, refetch: load };
}
