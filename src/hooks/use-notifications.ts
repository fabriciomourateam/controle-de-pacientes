import { useState, useMemo, useEffect } from 'react';
import { usePatients } from './use-supabase-data';
import { useCheckins } from './use-checkin-data';
import { userPreferencesService } from '@/lib/user-preferences-service';

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
  const [loading, setLoading] = useState(true);
  const { patients } = usePatients();
  const { checkins } = useCheckins();

  // Carregar notificações lidas do Supabase na inicialização
  useEffect(() => {
    const loadReadNotifications = async () => {
      try {
        const readNotificationIds = await userPreferencesService.getReadNotifications();
        setReadNotifications(new Set(readNotificationIds));
      } catch (error) {
        console.error('Erro ao carregar notificações lidas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReadNotifications();
  }, []);

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
          message: `Paciente ${checkin.telefone || 'desconhecido'} fez um check-in`,
          timestamp: checkinDate,
          read: readNotifications.has(`checkin-${checkin.id}`),
          priority: 'medium',
          url: `/checkins?highlight=${checkin.id}`
        });
      }
    });

    // Alertas de pacientes sem checkin há muito tempo
    patients?.forEach(patient => {
      const lastCheckin = checkins?.find(c => c.telefone === patient.telefone);
      if (lastCheckin) {
        const lastCheckinDate = new Date(lastCheckin.created_at);
        const daysSinceLastCheckin = Math.floor((now.getTime() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastCheckin >= 7) {
          notifs.push({
            id: `alert-${patient.id}`,
            type: 'alert',
            title: 'Paciente inativo',
            message: `${patient.nome || patient.apelido || 'Paciente'} não faz check-in há ${daysSinceLastCheckin} dias`,
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

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Atualizar estado local imediatamente para responsividade
      setReadNotifications(prev => new Set([...prev, notificationId]));
      
      // Salvar na nuvem
      await userPreferencesService.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Reverter estado local em caso de erro
      setReadNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    
    try {
      // Atualizar estado local imediatamente
      setReadNotifications(new Set(allIds));
      
      // Salvar na nuvem
      await userPreferencesService.markMultipleNotificationsAsRead(allIds);
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      // Recarregar do servidor em caso de erro
      const readNotificationIds = await userPreferencesService.getReadNotifications();
      setReadNotifications(new Set(readNotificationIds));
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    isOpen,
    setIsOpen,
    markAsRead,
    markAllAsRead
  };
}
