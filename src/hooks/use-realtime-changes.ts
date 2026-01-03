import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChangeNotification {
  type: 'patient' | 'checkin';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  id: string;
  timestamp: Date;
}

/**
 * Hook para detectar mudanças em tempo real usando Supabase Realtime
 * Monitora alterações nas tabelas 'patients' e 'checkin'
 */
export function useRealtimeChanges() {
  const [hasChanges, setHasChanges] = useState(false);
  const [notifications, setNotifications] = useState<ChangeNotification[]>([]);

  useEffect(() => {
    let patientsChannel: RealtimeChannel | null = null;
    let checkinsChannel: RealtimeChannel | null = null;

    // Canal para pacientes
    patientsChannel = supabase
      .channel('patients-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em patients:', payload);
          setHasChanges(true);
          setNotifications(prev => {
            const newNotification: ChangeNotification = {
              type: 'patient',
              action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              id: (payload.new as any)?.id || (payload.old as any)?.id || '',
              timestamp: new Date()
            };
            // Manter apenas as últimas 10 notificações
            return [...prev.slice(-9), newNotification];
          });
        }
      )
      .subscribe();

    // Canal para checkins
    checkinsChannel = supabase
      .channel('checkins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checkin'
        },
        (payload) => {
          console.log('🔄 Mudança detectada em checkins:', payload);
          setHasChanges(true);
          setNotifications(prev => {
            const newNotification: ChangeNotification = {
              type: 'checkin',
              action: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              id: (payload.new as any)?.id || (payload.old as any)?.id || '',
              timestamp: new Date()
            };
            // Manter apenas as últimas 10 notificações
            return [...prev.slice(-9), newNotification];
          });
        }
      )
      .subscribe();

    return () => {
      if (patientsChannel) {
        patientsChannel.unsubscribe();
      }
      if (checkinsChannel) {
        checkinsChannel.unsubscribe();
      }
    };
  }, []);

  const clearChanges = () => {
    setHasChanges(false);
    setNotifications([]);
  };

  return {
    hasChanges,
    notifications,
    clearChanges
  };
}
