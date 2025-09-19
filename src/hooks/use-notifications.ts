import { useState, useMemo } from 'react';
import { useSupabaseData } from './use-supabase-data';

export interface Notification {
  id: string;
  type: 'checkin' | 'alert' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  url?: string;
}

export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const { checkins, patients } = useSupabaseData();

  const notifications = useMemo(() => {
    const notifs: Notification[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Notificações de checkins recentes (últimas 24h)
    checkins?.forEach(checkin => {
      const checkinDate = new Date(checkin.created_at);
      if (checkinDate >= yesterday) {
        notifs.push({
          id: `checkin-${checkin.id}`,
          type: 'checkin',
          title: 'Novo Check-in',
          message: `${checkin.patient_name || 'Paciente'} fez um check-in`,
          timestamp: checkinDate,
          read: readNotifications.has(`checkin-${checkin.id}`),
          priority: 'medium',
          url: `/checkins?highlight=${checkin.id}`
        });
      }
    });

    // Alertas de pacientes sem checkin há muito tempo
    patients?.forEach(patient => {
      const lastCheckin = checkins?.find(c => c.patient_id === patient.id);
      if (lastCheckin) {
        const lastCheckinDate = new Date(lastCheckin.created_at);
        const daysSinceLastCheckin = Math.floor((now.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCheckin >= 7) {
          notifs.push({
            id: `alert-${patient.id}`,
            type: 'alert',
            title: 'Paciente inativo',
            message: `${patient.name || 'Paciente'} não faz check-in há ${daysSinceLastCheckin} dias`,
            timestamp: lastCheckinDate,
            read: readNotifications.has(`alert-${patient.id}`),
            priority: daysSinceLastCheckin >= 14 ? 'high' : 'medium',
            url: `/patients?highlight=${patient.id}`
          });
        }
      }
    });

    // Notificação de sistema
    notifs.push({
      id: 'system-welcome',
      type: 'system',
      title: 'Sistema atualizado',
      message: 'Nova versão do dashboard com melhorias de performance',
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
      read: readNotifications.has('system-welcome'),
      priority: 'low'
    });

    // Ordenar por timestamp (mais recente primeiro)
    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [checkins, patients, readNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead
  };
}
