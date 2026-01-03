import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRealtimeChanges } from '@/hooks/use-realtime-changes';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function ChangeNotification() {
  const { hasChanges, notifications, clearChanges } = useRealtimeChanges();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Atualização completa (forçar busca de tudo)
  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Atualização completa: invalidando todas as queries...');
      // Invalidar todas as queries para forçar refetch completo
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
        queryClient.invalidateQueries({ queryKey: ['checkins'] }),
        queryClient.invalidateQueries({ queryKey: ['checkin'] }),
      ]);
      clearChanges();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Atualização inteligente (merge com cache)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // ✅ ATUALIZAÇÃO INTELIGENTE: Buscar apenas dados novos e mesclar com cache
      
      // 1. Buscar checkins recentes (últimas 48h) - apenas os novos/atualizados
      const { checkinService } = await import('@/lib/checkin-service');
      const recentCheckins = await checkinService.getRecentWithPatient(48); // Últimas 48 horas COM dados do paciente
      
      // 2. Obter dados do cache atual (tentar diferentes chaves de query)
      // A chave correta é: ['checkins', 'list', 'with-patient', 'limit', X]
      const possibleCacheKeys = [
        ['checkins', 'list', 'with-patient', 'limit', 200],
        ['checkins', 'list', 'with-patient', 'limit', null],
        ['checkins', 'list', 'with-patient', 'limit', 500],
        ['checkins', 'list', 'with-patient', 'limit', 1000],
        ['checkins', 'list', 'with-patient', 'limit', 2000],
        ['checkins', 'list', 'with-patient'],
      ];
      
      let cachedCheckins: any[] | undefined;
      for (const key of possibleCacheKeys) {
        cachedCheckins = queryClient.getQueryData<any[]>(key);
        if (cachedCheckins && Array.isArray(cachedCheckins) && cachedCheckins.length > 0) {
          break; // Encontrou cache válido
        }
      }
      
      if (!cachedCheckins || !Array.isArray(cachedCheckins)) {
        cachedCheckins = [];
      }
      
      if (cachedCheckins.length > 0) {
        // 3. Mesclar: novos checkins + cache antigo (removendo duplicatas)
        const checkinMap = new Map();
        
        // Primeiro, adicionar checkins do cache (dados antigos)
        cachedCheckins.forEach(checkin => {
          if (checkin?.id) {
            checkinMap.set(checkin.id, checkin);
          }
        });
        
        // Depois, adicionar/atualizar com checkins recentes (dados novos)
        recentCheckins.forEach(checkin => {
          if (checkin?.id) {
            checkinMap.set(checkin.id, checkin); // Sobrescreve se já existe (atualiza)
          }
        });
        
        // Converter de volta para array e ordenar por data
        const mergedCheckins = Array.from(checkinMap.values()).sort((a, b) => {
          const dateA = new Date(a.data_checkin || a.data_preenchimento || 0);
          const dateB = new Date(b.data_checkin || b.data_preenchimento || 0);
          return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
        });
        
        // 4. Atualizar cache com dados mesclados (atualizar todas as chaves de query possíveis)
        possibleCacheKeys.forEach(key => {
          const existingData = queryClient.getQueryData<any[]>(key);
          if (existingData && Array.isArray(existingData)) {
            // Mesclar também para esta chave específica
            const keyMap = new Map();
            existingData.forEach(c => {
              if (c?.id) keyMap.set(c.id, c);
            });
            recentCheckins.forEach(c => {
              if (c?.id) keyMap.set(c.id, c); // Sobrescreve se já existe
            });
            const keyMerged = Array.from(keyMap.values()).sort((a, b) => {
              const dateA = new Date(a.data_checkin || a.data_preenchimento || 0);
              const dateB = new Date(b.data_checkin || b.data_preenchimento || 0);
              return dateB.getTime() - dateA.getTime();
            });
            queryClient.setQueryData(key, keyMerged);
          }
        });
        
        console.log('✅ Dados mesclados inteligentemente:', {
          antigos: cachedCheckins.length,
          novos: recentCheckins.length,
          total: mergedCheckins.length,
          economia: `${((cachedCheckins.length / mergedCheckins.length) * 100).toFixed(1)}% dos dados vieram do cache`
        });
      } else {
        // Se não há cache, invalidar e buscar tudo (fallback)
        console.log('⚠️ Nenhum cache encontrado, buscando tudo...');
        await queryClient.invalidateQueries({ queryKey: ['checkins'] });
      }
      
      // ✅ ATUALIZAÇÃO INTELIGENTE PARA PACIENTES: Buscar apenas pacientes recentes e mesclar com cache
      const { patientService } = await import('@/lib/supabase-services');
      const recentPatients = await patientService.getRecent(48); // Últimas 48 horas
      
      // Obter cache de pacientes (chave correta: ['patients', 'list', 'limit', X])
      const possiblePatientKeys = [
        ['patients', 'list', 'limit', 1000],
        ['patients', 'list', 'limit', 500],
        ['patients', 'list', 'limit', 200],
        ['patients', 'list', 'limit', null],
        ['patients', 'list'],
      ];
      
      let cachedPatients: any[] | undefined;
      for (const key of possiblePatientKeys) {
        cachedPatients = queryClient.getQueryData<any[]>(key);
        if (cachedPatients && Array.isArray(cachedPatients) && cachedPatients.length > 0) {
          break; // Encontrou cache válido
        }
      }
      
      if (!cachedPatients || !Array.isArray(cachedPatients)) {
        cachedPatients = [];
      }
      
      if (cachedPatients.length > 0) {
        // Mesclar pacientes: novos + cache antigo
        const patientMap = new Map();
        
        // Primeiro, adicionar pacientes do cache (dados antigos)
        cachedPatients.forEach(patient => {
          if (patient?.id) {
            patientMap.set(patient.id, patient);
          }
        });
        
        // Depois, adicionar/atualizar com pacientes recentes (dados novos)
        recentPatients.forEach(patient => {
          if (patient?.id) {
            patientMap.set(patient.id, patient); // Sobrescreve se já existe (atualiza)
          }
        });
        
        // Converter de volta para array e ordenar por data
        const mergedPatients = Array.from(patientMap.values()).sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime(); // Mais recente primeiro
        });
        
        // Atualizar cache com dados mesclados
        possiblePatientKeys.forEach(key => {
          const existingData = queryClient.getQueryData<any[]>(key);
          if (existingData && Array.isArray(existingData)) {
            // Mesclar também para esta chave específica
            const keyMap = new Map();
            existingData.forEach(p => {
              if (p?.id) keyMap.set(p.id, p);
            });
            recentPatients.forEach(p => {
              if (p?.id) keyMap.set(p.id, p); // Sobrescreve se já existe
            });
            const keyMerged = Array.from(keyMap.values()).sort((a, b) => {
              const dateA = new Date(a.created_at || a.updated_at || 0);
              const dateB = new Date(b.created_at || b.updated_at || 0);
              return dateB.getTime() - dateA.getTime();
            });
            queryClient.setQueryData(key, keyMerged);
          }
        });
        
        console.log('✅ Pacientes mesclados inteligentemente:', {
          antigos: cachedPatients.length,
          novos: recentPatients.length,
          total: mergedPatients.length,
          economia: `${((cachedPatients.length / mergedPatients.length) * 100).toFixed(1)}% dos dados vieram do cache`
        });
      } else {
        // Se não há cache, invalidar e buscar tudo (fallback)
        console.log('⚠️ Nenhum cache de pacientes encontrado, buscando tudo...');
        await queryClient.invalidateQueries({ queryKey: ['patients'] });
      }
      
      // Para feedbacks, invalidar normalmente (são menores e mudam menos)
      await queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      
      clearChanges();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      // Fallback: invalidar tudo se houver erro
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['feedbacks'] }),
        queryClient.invalidateQueries({ queryKey: ['checkins'] }),
        queryClient.invalidateQueries({ queryKey: ['checkin'] }),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!hasChanges) return null;

  const latestNotification = notifications[notifications.length - 1];
  const actionText = {
    'INSERT': 'adicionado',
    'UPDATE': 'atualizado',
    'DELETE': 'removido'
  }[latestNotification.action] || 'alterado';

  const typeText = latestNotification.type === 'patient' ? 'paciente' : 'check-in';

  return (
    <Card className="fixed top-20 right-4 z-[100] bg-orange-500/20 border-orange-500/50 shadow-lg animate-in slide-in-from-top max-w-md backdrop-blur-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">
              Dados atualizados!
            </p>
            <p className="text-xs text-slate-300">
              {notifications.length} {notifications.length === 1 ? 'alteração' : 'alterações'} detectada{notifications.length === 1 ? '' : 's'}
              {notifications.length === 1 && ` (${typeText} ${actionText})`}
            </p>
            {notifications.length > 1 && (
              <p className="text-xs text-slate-400 mt-1">
                Última: {typeText} {actionText}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearChanges}
            className="text-slate-400 hover:text-white h-6 w-6 p-0 flex-shrink-0"
            title="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-orange-500 hover:bg-orange-600 text-white flex-1 min-w-[120px]"
            title="Atualização inteligente: busca apenas dados novos e mescla com cache"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleFullRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 flex-1 min-w-[100px]"
            title="Atualização completa: busca todos os dados novamente"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Tudo
          </Button>
        </div>
      </div>
    </Card>
  );
}
