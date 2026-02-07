import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const PORTAL_CARD_KEYS = {
  EVOLUTION_PHOTOS: 'evolution_photos',
  SUMMARY_EVOLUTION: 'summary_evolution',   // Card "Sua Evolução"
  CONTINUE_JOURNEY: 'continue_journey',     // Card "Continue Sua Jornada de Transformação"
} as const;

export type PortalCardKey = typeof PORTAL_CARD_KEYS[keyof typeof PORTAL_CARD_KEYS];

const CARD_LABELS: Record<PortalCardKey, string> = {
  [PORTAL_CARD_KEYS.EVOLUTION_PHOTOS]: 'Evolução Fotográfica',
  [PORTAL_CARD_KEYS.SUMMARY_EVOLUTION]: 'Sua Evolução',
  [PORTAL_CARD_KEYS.CONTINUE_JOURNEY]: 'Continue Sua Jornada de Transformação',
};

export function usePortalCardVisibility(
  patientTelefone: string | null | undefined,
  cardKey: PortalCardKey
) {
  const [visible, setVisible] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);
  const { toast } = useToast();
  const label = CARD_LABELS[cardKey];

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
        .eq('card_key', cardKey)
        .maybeSingle();

      if (error) throw error;
      setRecordId(data?.id ?? null);
      setVisible(data?.visible !== false);
    } catch (err) {
      console.error(`Erro ao carregar visibilidade do card ${cardKey}:`, err);
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }, [patientTelefone, cardKey]);

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
            card_key: cardKey,
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
          ? `O card "${label}" será exibido na página pública do paciente.`
          : `O card "${label}" foi ocultado da página pública.`,
      });
    } catch (err: any) {
      console.error('Erro ao alterar visibilidade:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a visibilidade do card.',
        variant: 'destructive',
      });
    }
  }, [patientTelefone, visible, recordId, cardKey, label, toast]);

  return { visible, loading, toggleVisibility, refetch: load };
}
