import { NotionService } from './notion-service';
import { supabase } from '@/integrations/supabase/client';

interface AutoSyncConfig {
  apiKey: string;
  databaseId: string;
  intervalMinutes: number;
  enabled: boolean;
}

class AutoSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;
  private isRunning = false;

  // Iniciar sincronização automática
  async startAutoSync(config: AutoSyncConfig) {
    if (this.isRunning) {
      console.log('Auto-sync já está rodando');
      return;
    }

    if (!config.enabled) {
      console.log('Auto-sync desabilitado');
      return;
    }

    console.log(`Iniciando auto-sync com intervalo de ${config.intervalMinutes} minutos`);
    
    // Executar sincronização imediata
    await this.performSync(config);
    
    // Configurar intervalo
    this.intervalId = setInterval(async () => {
      await this.performSync(config);
    }, config.intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  // Parar sincronização automática
  stopAutoSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Auto-sync parado');
  }

  // Executar sincronização
  private async performSync(config: AutoSyncConfig) {
    try {
      console.log('🔄 Iniciando sincronização automática...');
      
      const notionService = new NotionService(config.apiKey);
      
      // Buscar dados do Notion
      let notionData;
      try {
        notionData = await notionService.fetchAllDataProxy(config.databaseId);
      } catch (error) {
        console.error('Erro ao buscar dados do Notion:', error);
        return;
      }

      console.log(`📊 Encontrados ${notionData.length} registros no Notion`);

      // Mapear e inserir/atualizar no Supabase
      const mappedData = notionData.map(page => notionService.mapNotionToSupabase(page));
      
      let inserted = 0;
      let updated = 0;
      let errors = 0;

      for (const patient of mappedData) {
        try {
          // Verificar se paciente já existe (por nome)
          const { data: existing } = await supabase
            .from('patients')
            .select('id')
            .eq('nome', patient.nome)
            .single();

          if (existing) {
            // Atualizar paciente existente
            await supabase
              .from('patients')
              .update(patient)
              .eq('id', existing.id);
            updated++;
          } else {
            // Inserir novo paciente
            await supabase
              .from('patients')
              .insert(patient);
            inserted++;
          }
        } catch (error) {
          console.error(`Erro ao processar paciente ${patient.nome}:`, error);
          errors++;
        }
      }

      this.lastSyncTime = new Date();
      
      console.log(`✅ Sincronização concluída:`);
      console.log(`   📥 Inseridos: ${inserted}`);
      console.log(`   🔄 Atualizados: ${updated}`);
      console.log(`   ❌ Erros: ${errors}`);
      console.log(`   ⏰ Próxima sincronização em ${config.intervalMinutes} minutos`);

      // Salvar status da última sincronização
      await this.saveSyncStatus({
        lastSync: this.lastSyncTime,
        inserted,
        updated,
        errors,
        totalRecords: notionData.length
      });

    } catch (error) {
      console.error('Erro na sincronização automática:', error);
    }
  }

  // Salvar status da sincronização
  private async saveSyncStatus(status: any) {
    try {
      // Aqui você pode salvar em localStorage ou em uma tabela do Supabase
      localStorage.setItem('autoSyncStatus', JSON.stringify({
        ...status,
        isRunning: this.isRunning
      }));
    } catch (error) {
      console.error('Erro ao salvar status:', error);
    }
  }

  // Obter status da sincronização
  getSyncStatus() {
    try {
      const status = localStorage.getItem('autoSyncStatus');
      return status ? JSON.parse(status) : null;
    } catch (error) {
      console.error('Erro ao obter status:', error);
      return null;
    }
  }

  // Verificar se está rodando
  isAutoSyncRunning() {
    return this.isRunning;
  }

  // Obter última sincronização
  getLastSyncTime() {
    return this.lastSyncTime;
  }
}

export const autoSyncService = new AutoSyncService();

