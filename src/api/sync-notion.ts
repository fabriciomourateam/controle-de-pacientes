import { NotionService } from '@/lib/notion-service';

export async function syncNotion(apiKey: string, databaseId: string) {
  try {
    if (!apiKey || !databaseId) {
      throw new Error('API Key e Database ID são obrigatórios');
    }

    const notionService = new NotionService(apiKey);
    const result = await notionService.syncToSupabase(databaseId);

    return result;
  } catch (error) {
    console.error('Erro na sincronização:', error);
    throw error;
  }
}
