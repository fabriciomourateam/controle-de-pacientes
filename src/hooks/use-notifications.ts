import { useState, useMemo, useEffect } from 'react';
import { usePatients } from './use-supabase-data';
import { useRecentCheckins, useLastCheckinPerPatient } from './use-checkin-data';
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
  
  // OTIMIZADO: Usar hooks específicos em vez de carregar todos os checkins
  // useRecentCheckins: Busca apenas checkins das últimas 48h para notificações
  // useLastCheckinPerPatient: Busca apenas o último checkin de cada paciente para alertas
  const { data: recentCheckins = [] } = useRecentCheckins(48); // últimas 48 horas
  const { data: lastCheckinPerPatient = [] } = useLastCheckinPerPatient();

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
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Notificações de checkins recentes (últimas 24h)
    // Usa recentCheckins que já vem filtrado do banco (últimas 48h)
    recentCheckins?.forEach(checkin => {
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

    // Criar mapa de último checkin por telefone para busca rápida
    const lastCheckinByPhone = new Map<string, typeof lastCheckinPerPatient[0]>();
    lastCheckinPerPatient?.forEach(checkin => {
      if (checkin.telefone) {
        lastCheckinByPhone.set(checkin.telefone, checkin);
      }
    });

    // Alertas de pacientes sem checkin há muito tempo
    patients?.forEach(patient => {
      if (!patient.telefone) return;
      
      const lastCheckin = lastCheckinByPhone.get(patient.telefone);
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
  }, [recentCheckins, lastCheckinPerPatient, patients, readNotifications]);

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
