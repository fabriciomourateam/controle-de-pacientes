import { DashboardNotionService } from './dashboard-notion-service';

interface DashboardAutoSyncConfig {
  apiKey: string;
  databaseId: string;
  intervalMinutes: number;
  enabled: boolean;
}

class DashboardAutoSyncService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;
  private isRunning = false;

  // Iniciar sincronização automática de métricas
  async startAutoSync(config: DashboardAutoSyncConfig) {
    if (this.isRunning) {
      console.log('Auto-sync de métricas já está rodando');
      return;
    }

    if (!config.enabled) {
      console.log('Auto-sync de métricas desabilitado');
      return;
    }

    console.log(`🔄 Iniciando auto-sync de métricas com intervalo de ${config.intervalMinutes} minutos`);
    
    // Executar sincronização imediata
    await this.performMetricsSync(config);
    
    // Configurar intervalo
    this.intervalId = setInterval(async () => {
      await this.performMetricsSync(config);
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
    console.log('Auto-sync de métricas parado');
  }

  // Executar sincronização de métricas
  private async performMetricsSync(config: DashboardAutoSyncConfig) {
    try {
      console.log('📊 Iniciando sincronização automática de métricas...');
      
      const dashboardService = new DashboardNotionService(config.apiKey);
      
      // Processar dados do Notion para métricas
      const result = await dashboardService.processNotionDataForMetrics(config.databaseId);

      this.lastSyncTime = new Date();
      
      console.log(`✅ Sincronização de métricas concluída:`);
      console.log(`   📥 Inseridos: ${result.inserted}`);
      console.log(`   🔄 Atualizados: ${result.updated}`);
      console.log(`   ❌ Erros: ${result.errors.length}`);
      console.log(`   ⏰ Próxima sincronização em ${config.intervalMinutes} minutos`);

      // Salvar status da última sincronização
      await this.saveSyncStatus({
        lastSync: this.lastSyncTime,
        inserted: result.inserted,
        updated: result.updated,
        errors: result.errors.length,
        totalRecords: result.total
      });

    } catch (error) {
      console.error('Erro na sincronização automática de métricas:', error);
    }
  }

  // Salvar status da sincronização
  private async saveSyncStatus(status: any) {
    try {
      localStorage.setItem('dashboardAutoSyncStatus', JSON.stringify({
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
      const status = localStorage.getItem('dashboardAutoSyncStatus');
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

export const dashboardAutoSyncService = new DashboardAutoSyncService();
