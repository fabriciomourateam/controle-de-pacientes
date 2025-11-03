import { Client } from '@notionhq/client';
import { supabase } from '@/integrations/supabase/client';
import { fetchNotionData } from './notion-proxy';

export class NotionService {
  private notion: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    try {
      this.notion = new Client({ auth: apiKey });
      this.apiKey = apiKey;
    } catch (error) {
      console.error('Erro ao inicializar cliente Notion:', error);
      throw error;
    }
  }

  // Buscar todos os dados do Notion
  async fetchAllData(databaseId: string) {
    try {
      // Verificar se o cliente está inicializado
      if (!this.notion || !this.notion.databases) {
        throw new Error('Cliente Notion não inicializado corretamente');
      }

      const response = await this.notion.databases.query({
        database_id: databaseId,
        page_size: 100
      });

      return response.results;
    } catch (error) {
      console.error('Erro ao buscar dados do Notion:', error);
      throw error;
    }
  }

  // Buscar dados usando o proxy (contorna CORS) com paginação
  async fetchAllDataProxy(databaseId: string) {
    try {
      let allResults = [];
      let hasMore = true;
      let startCursor = undefined;
      let pageCount = 0;
      const maxPages = 50; // Limite de segurança para evitar loops infinitos

      while (hasMore && pageCount < maxPages) {
        pageCount++;
        const requestBody = {
          page_size: 100,
          ...(startCursor && { start_cursor: startCursor })
        };

        console.log(`🔍 Buscando página ${pageCount}... (${allResults.length} registros até agora)`);
        
        // Usar apenas o proxy (mais confiável)
        const data = await fetchNotionData(this.apiKey, databaseId, requestBody);
        
        if (!data.results || data.results.length === 0) {
          console.log('⚠️ Página sem resultados, finalizando...');
          break;
        }

        allResults = allResults.concat(data.results);
        hasMore = data.has_more;
        const newCursor = data.next_cursor;
        
        // Verificar se o cursor mudou para evitar loop infinito
        if (startCursor === newCursor && newCursor !== null) {
          console.log('⚠️ Cursor não mudou, possível loop detectado. Finalizando...');
          break;
        }
        
        startCursor = newCursor;
        
        console.log(`✅ Página ${pageCount}: +${data.results.length} registros (Total: ${allResults.length})`);
        
        // Se não há mais páginas, sair do loop
        if (!hasMore || !startCursor) {
          console.log('📋 Todas as páginas foram processadas');
          break;
        }
      }

      if (pageCount >= maxPages) {
        console.log('⚠️ Limite máximo de páginas atingido para evitar loop infinito');
      }

      console.log(`🎉 Total de registros encontrados: ${allResults.length} em ${pageCount} páginas`);
      return allResults;
    } catch (error) {
      console.error('Erro ao buscar dados do Notion via proxy:', error);
      throw error;
    }
  }

  // Mapear dados do Notion para formato do Supabase
  mapNotionToSupabase(notionPage: any) {
    const properties = notionPage.properties;
    const mapped: any = {};

    // Mapear campos básicos
    if (properties.Nome?.title?.[0]?.text?.content) {
      mapped.nome = properties.Nome.title[0].text.content;
    }

    // Mapear apelido com múltiplas variações e tipos
    if (properties.Apelido?.rich_text?.[0]?.text?.content) {
      mapped.apelido = properties.Apelido.rich_text[0].text.content;
      console.log('Apelido mapeado (Apelido - rich_text):', mapped.apelido);
    } else if (properties['Apelido']?.rich_text?.[0]?.text?.content) {
      mapped.apelido = properties['Apelido'].rich_text[0].text.content;
      console.log('Apelido mapeado (Apelido - rich_text):', mapped.apelido);
    } else if (properties.Apelido?.title?.[0]?.text?.content) {
      mapped.apelido = properties.Apelido.title[0].text.content;
      console.log('Apelido mapeado (Apelido - title):', mapped.apelido);
    } else if (properties['Apelido']?.title?.[0]?.text?.content) {
      mapped.apelido = properties['Apelido'].title[0].text.content;
      console.log('Apelido mapeado (Apelido - title):', mapped.apelido);
    } else if (properties.Apelido?.select?.name) {
      mapped.apelido = properties.Apelido.select.name;
      console.log('Apelido mapeado (Apelido - select):', mapped.apelido);
    } else if (properties['Apelido']?.select?.name) {
      mapped.apelido = properties['Apelido'].select.name;
      console.log('Apelido mapeado (Apelido - select):', mapped.apelido);
    } else if (properties.Apelido?.multi_select?.[0]?.name) {
      mapped.apelido = properties.Apelido.multi_select[0].name;
      console.log('Apelido mapeado (Apelido - multi_select):', mapped.apelido);
    } else if (properties['Apelido']?.multi_select?.[0]?.name) {
      mapped.apelido = properties['Apelido'].multi_select[0].name;
      console.log('Apelido mapeado (Apelido - multi_select):', mapped.apelido);
    } else if (properties.Apelido?.formula?.string) {
      mapped.apelido = properties.Apelido.formula.string;
      console.log('Apelido mapeado (Apelido - formula):', mapped.apelido);
    } else if (properties['Apelido']?.formula?.string) {
      mapped.apelido = properties['Apelido'].formula.string;
      console.log('Apelido mapeado (Apelido - formula):', mapped.apelido);
    } else if (properties.Apelido?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.apelido = properties.Apelido.rollup.array[0].rich_text[0].text.content;
      console.log('Apelido mapeado (Apelido - rollup):', mapped.apelido);
    } else if (properties['Apelido']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.apelido = properties['Apelido'].rollup.array[0].rich_text[0].text.content;
      console.log('Apelido mapeado (Apelido - rollup):', mapped.apelido);
    } else {
      console.log('Apelido não encontrado. Propriedades disponíveis:', Object.keys(properties));
      console.log('Propriedades com "apelido" ou "nickname":', Object.keys(properties).filter(key => 
        key.toLowerCase().includes('apelido') || 
        key.toLowerCase().includes('nickname') || 
        key.toLowerCase().includes('sobrenome')
      ));
      console.log('Estrutura do campo Apelido:', properties.Apelido);
    }

    if (properties.CPF?.rich_text?.[0]?.text?.content) {
      mapped.cpf = properties.CPF.rich_text[0].text.content;
    }

    // Mapear email com múltiplas variações e tipos
    if (properties.Email?.email) {
      mapped.email = properties.Email.email;
    } else if (properties['Email']?.email) {
      mapped.email = properties['Email'].email;
    } else if (properties['EMAIL']?.email) {
      mapped.email = properties['EMAIL'].email;
    } else if (properties['email']?.email) {
      mapped.email = properties['email'].email;
    } else if (properties.Email?.rich_text?.[0]?.text?.content) {
      mapped.email = properties.Email.rich_text[0].text.content;
    } else if (properties['Email']?.rich_text?.[0]?.text?.content) {
      mapped.email = properties['Email'].rich_text[0].text.content;
    } else if (properties['EMAIL']?.rich_text?.[0]?.text?.content) {
      mapped.email = properties['EMAIL'].rich_text[0].text.content;
    } else if (properties['email']?.rich_text?.[0]?.text?.content) {
      mapped.email = properties['email'].rich_text[0].text.content;
    }

    // Mapear telefone com múltiplas variações e tipos
    if (properties.Telefone?.phone_number) {
      mapped.telefone = properties.Telefone.phone_number;
    } else if (properties['Telefone']?.phone_number) {
      mapped.telefone = properties['Telefone'].phone_number;
    } else if (properties['TELEFONE']?.phone_number) {
      mapped.telefone = properties['TELEFONE'].phone_number;
    } else if (properties['telefone']?.phone_number) {
      mapped.telefone = properties['telefone'].phone_number;
    } else if (properties['Telefone (Filtro)']?.phone_number) {
      mapped.telefone = properties['Telefone (Filtro)'].phone_number;
    } else if (properties['Telefone Checkin']?.phone_number) {
      mapped.telefone = properties['Telefone Checkin'].phone_number;
    } else if (properties.Telefone?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties.Telefone.rich_text[0].text.content;
    } else if (properties['Telefone']?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties['Telefone'].rich_text[0].text.content;
    } else if (properties['TELEFONE']?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties['TELEFONE'].rich_text[0].text.content;
    } else if (properties['telefone']?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties['telefone'].rich_text[0].text.content;
    } else if (properties['Telefone (Filtro)']?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties['Telefone (Filtro)'].rich_text[0].text.content;
    } else if (properties['Telefone Checkin']?.rich_text?.[0]?.text?.content) {
      mapped.telefone = properties['Telefone Checkin'].rich_text[0].text.content;
    }

    if (properties['Gênero']?.select?.name) {
      mapped.genero = properties['Gênero'].select.name;
    }

    if (properties['Data de Nascimento']?.date?.start) {
      mapped.data_nascimento = properties['Data de Nascimento'].date.start;
    }

    if (properties.Início?.date?.start) {
      mapped.inicio_acompanhamento = properties.Início.date.start;
    }

    // Mapear Plano com múltiplas variações e tipos
    if (properties.Plano?.select?.name) {
      mapped.plano = properties.Plano.select.name;
    } else if (properties['Plano']?.select?.name) {
      mapped.plano = properties['Plano'].select.name;
    } else if (properties.PLANO?.select?.name) {
      mapped.plano = properties.PLANO.select.name;
    } else if (properties.plano?.select?.name) {
      mapped.plano = properties.plano.select.name;
    } else if (properties.Plano?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.Plano.rich_text[0].text.content;
    } else if (properties['Plano']?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties['Plano'].rich_text[0].text.content;
    } else if (properties.PLANO?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.PLANO.rich_text[0].text.content;
    } else if (properties.plano?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.plano.rich_text[0].text.content;
    } else if (properties.Plano?.title?.[0]?.text?.content) {
      mapped.plano = properties.Plano.title[0].text.content;
    } else if (properties['Plano']?.title?.[0]?.text?.content) {
      mapped.plano = properties['Plano'].title[0].text.content;
    } else if (properties.PLANO?.title?.[0]?.text?.content) {
      mapped.plano = properties.PLANO.title[0].text.content;
    } else if (properties.plano?.title?.[0]?.text?.content) {
      mapped.plano = properties.plano.title[0].text.content;
    } else if (properties.Plano?.multi_select?.[0]?.name) {
      mapped.plano = properties.Plano.multi_select[0].name;
    } else if (properties['Plano']?.multi_select?.[0]?.name) {
      mapped.plano = properties['Plano'].multi_select[0].name;
    } else if (properties.PLANO?.multi_select?.[0]?.name) {
      mapped.plano = properties.PLANO.multi_select[0].name;
    } else if (properties.plano?.multi_select?.[0]?.name) {
      mapped.plano = properties.plano.multi_select[0].name;
    } else if (properties.Plano?.formula?.string) {
      mapped.plano = properties.Plano.formula.string;
    } else if (properties['Plano']?.formula?.string) {
      mapped.plano = properties['Plano'].formula.string;
    } else if (properties.PLANO?.formula?.string) {
      mapped.plano = properties.PLANO.formula.string;
    } else if (properties.plano?.formula?.string) {
      mapped.plano = properties.plano.formula.string;
    } else if (properties.Plano?.rollup?.array?.[0]?.select?.name) {
      mapped.plano = properties.Plano.rollup.array[0].select.name;
    } else if (properties['Plano']?.rollup?.array?.[0]?.select?.name) {
      mapped.plano = properties['Plano'].rollup.array[0].select.name;
    } else if (properties.PLANO?.rollup?.array?.[0]?.select?.name) {
      mapped.plano = properties.PLANO.rollup.array[0].select.name;
    } else if (properties.plano?.rollup?.array?.[0]?.select?.name) {
      mapped.plano = properties.plano.rollup.array[0].select.name;
    } else if (properties.Plano?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.Plano.rollup.array[0].rich_text[0].text.content;
    } else if (properties['Plano']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties['Plano'].rollup.array[0].rich_text[0].text.content;
    } else if (properties.PLANO?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.PLANO.rollup.array[0].rich_text[0].text.content;
    } else if (properties.plano?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.plano = properties.plano.rollup.array[0].rich_text[0].text.content;
    } else {
      console.log('Plano não encontrado. Propriedades disponíveis:', Object.keys(properties));
      console.log('Propriedades com "plano":', Object.keys(properties).filter(key => 
        key.toLowerCase().includes('plano') || 
        key.toLowerCase().includes('plan') ||
        key.toLowerCase().includes('tipo')
      ));
      console.log('Estrutura do campo Plano:', properties.Plano || properties['Plano'] || properties.PLANO || properties.plano);
    }

    // Mapear Tempo de Acompanhamento com múltiplos tipos
    if (properties['Tempo de Acompanhamento']?.number) {
      mapped.tempo_acompanhamento = properties['Tempo de Acompanhamento'].number;
    } else if (properties['Tempo de Acompanhamento']?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].rich_text[0].text.content);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    } else if (properties['Tempo de Acompanhamento']?.title?.[0]?.text?.content) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].title[0].text.content);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    } else if (properties['Tempo de Acompanhamento']?.select?.name) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].select.name);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    } else if (properties['Tempo de Acompanhamento']?.multi_select?.[0]?.name) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].multi_select[0].name);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    } else if (properties['Tempo de Acompanhamento']?.formula?.number) {
      mapped.tempo_acompanhamento = properties['Tempo de Acompanhamento'].formula.number;
    } else if (properties['Tempo de Acompanhamento']?.formula?.string) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].formula.string);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    } else if (properties['Tempo de Acompanhamento']?.rollup?.array?.[0]?.number) {
      mapped.tempo_acompanhamento = properties['Tempo de Acompanhamento'].rollup.array[0].number;
    } else if (properties['Tempo de Acompanhamento']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Tempo de Acompanhamento'].rollup.array[0].rich_text[0].text.content);
      if (!isNaN(value)) mapped.tempo_acompanhamento = value;
    }

    if (properties.Vencimento?.date?.start) {
      mapped.vencimento = properties.Vencimento.date.start;
    }

    // Mapear Dias para Vencer com múltiplos tipos
    if (properties['Quantos dias pra vencer']?.number) {
      mapped.dias_para_vencer = properties['Quantos dias pra vencer'].number;
    } else if (properties['Quantos dias pra vencer']?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Quantos dias pra vencer'].rich_text[0].text.content);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    } else if (properties['Quantos dias pra vencer']?.title?.[0]?.text?.content) {
      const value = parseFloat(properties['Quantos dias pra vencer'].title[0].text.content);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    } else if (properties['Quantos dias pra vencer']?.select?.name) {
      const value = parseFloat(properties['Quantos dias pra vencer'].select.name);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    } else if (properties['Quantos dias pra vencer']?.multi_select?.[0]?.name) {
      const value = parseFloat(properties['Quantos dias pra vencer'].multi_select[0].name);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    } else if (properties['Quantos dias pra vencer']?.formula?.number) {
      mapped.dias_para_vencer = properties['Quantos dias pra vencer'].formula.number;
    } else if (properties['Quantos dias pra vencer']?.formula?.string) {
      const value = parseFloat(properties['Quantos dias pra vencer'].formula.string);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    } else if (properties['Quantos dias pra vencer']?.rollup?.array?.[0]?.number) {
      mapped.dias_para_vencer = properties['Quantos dias pra vencer'].rollup.array[0].number;
    } else if (properties['Quantos dias pra vencer']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Quantos dias pra vencer'].rollup.array[0].rich_text[0].text.content);
      if (!isNaN(value)) mapped.dias_para_vencer = value;
    }

    if (properties.Valor?.number) {
      mapped.valor = properties.Valor.number;
    }

    if (properties['Ticket Médio']?.number) {
      mapped.ticket_medio = properties['Ticket Médio'].number;
    }

    // Mapear Rescisão 30% com múltiplos tipos
    if (properties['Rescisão: 30%']?.number) {
      mapped.rescisao_30_percent = properties['Rescisão: 30%'].number;
    } else if (properties['Rescisão: 30%']?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Rescisão: 30%'].rich_text[0].text.content);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    } else if (properties['Rescisão: 30%']?.title?.[0]?.text?.content) {
      const value = parseFloat(properties['Rescisão: 30%'].title[0].text.content);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    } else if (properties['Rescisão: 30%']?.select?.name) {
      const value = parseFloat(properties['Rescisão: 30%'].select.name);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    } else if (properties['Rescisão: 30%']?.multi_select?.[0]?.name) {
      const value = parseFloat(properties['Rescisão: 30%'].multi_select[0].name);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    } else if (properties['Rescisão: 30%']?.formula?.number) {
      mapped.rescisao_30_percent = properties['Rescisão: 30%'].formula.number;
    } else if (properties['Rescisão: 30%']?.formula?.string) {
      const value = parseFloat(properties['Rescisão: 30%'].formula.string);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    } else if (properties['Rescisão: 30%']?.rollup?.array?.[0]?.number) {
      mapped.rescisao_30_percent = properties['Rescisão: 30%'].rollup.array[0].number;
    } else if (properties['Rescisão: 30%']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      const value = parseFloat(properties['Rescisão: 30%'].rollup.array[0].rich_text[0].text.content);
      if (!isNaN(value)) mapped.rescisao_30_percent = value;
    }

    // Mapear Pagamento com múltiplos tipos
    if (properties.Pagamento?.select?.name) {
      mapped.pagamento = properties.Pagamento.select.name;
    } else if (properties.Pagamento?.rich_text?.[0]?.text?.content) {
      mapped.pagamento = properties.Pagamento.rich_text[0].text.content;
    } else if (properties.Pagamento?.title?.[0]?.text?.content) {
      mapped.pagamento = properties.Pagamento.title[0].text.content;
    } else if (properties.Pagamento?.multi_select?.[0]?.name) {
      mapped.pagamento = properties.Pagamento.multi_select[0].name;
    } else if (properties.Pagamento?.formula?.string) {
      mapped.pagamento = properties.Pagamento.formula.string;
    } else if (properties.Pagamento?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.pagamento = properties.Pagamento.rollup.array[0].rich_text[0].text.content;
    } else if (properties.Pagamento?.rollup?.array?.[0]?.select?.name) {
      mapped.pagamento = properties.Pagamento.rollup.array[0].select.name;
    }

    if (properties['Observação']?.rich_text?.[0]?.text?.content) {
      mapped.observacao = properties['Observação'].rich_text[0].text.content;
    }

    // Mapear Indicações com múltiplos tipos
    if (properties['Indicações']?.rich_text?.[0]?.text?.content) {
      mapped.indicacoes = properties['Indicações'].rich_text[0].text.content;
    } else if (properties['Indicações']?.title?.[0]?.text?.content) {
      mapped.indicacoes = properties['Indicações'].title[0].text.content;
    } else if (properties['Indicações']?.select?.name) {
      mapped.indicacoes = properties['Indicações'].select.name;
    } else if (properties['Indicações']?.multi_select?.[0]?.name) {
      mapped.indicacoes = properties['Indicações'].multi_select[0].name;
    } else if (properties['Indicações']?.formula?.string) {
      mapped.indicacoes = properties['Indicações'].formula.string;
    } else if (properties['Indicações']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.indicacoes = properties['Indicações'].rollup.array[0].rich_text[0].text.content;
    } else if (properties['Indicações']?.rollup?.array?.[0]?.select?.name) {
      mapped.indicacoes = properties['Indicações'].rollup.array[0].select.name;
    }

    // Mapear Lembrete com múltiplos tipos
    if (properties.Lembrete?.rich_text?.[0]?.text?.content) {
      mapped.lembrete = properties.Lembrete.rich_text[0].text.content;
    } else if (properties.Lembrete?.title?.[0]?.text?.content) {
      mapped.lembrete = properties.Lembrete.title[0].text.content;
    } else if (properties.Lembrete?.select?.name) {
      mapped.lembrete = properties.Lembrete.select.name;
    } else if (properties.Lembrete?.multi_select?.[0]?.name) {
      mapped.lembrete = properties.Lembrete.multi_select[0].name;
    } else if (properties.Lembrete?.formula?.string) {
      mapped.lembrete = properties.Lembrete.formula.string;
    } else if (properties.Lembrete?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.lembrete = properties.Lembrete.rollup.array[0].rich_text[0].text.content;
    } else if (properties.Lembrete?.rollup?.array?.[0]?.select?.name) {
      mapped.lembrete = properties.Lembrete.rollup.array[0].select.name;
    }

    // Mapear Telefone (Filtro) com múltiplos tipos
    if (properties['Telefone (Filtro)']?.rich_text?.[0]?.text?.content) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].rich_text[0].text.content;
    } else if (properties['Telefone (Filtro)']?.title?.[0]?.text?.content) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].title[0].text.content;
    } else if (properties['Telefone (Filtro)']?.select?.name) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].select.name;
    } else if (properties['Telefone (Filtro)']?.multi_select?.[0]?.name) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].multi_select[0].name;
    } else if (properties['Telefone (Filtro)']?.formula?.string) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].formula.string;
    } else if (properties['Telefone (Filtro)']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].rollup.array[0].rich_text[0].text.content;
    } else if (properties['Telefone (Filtro)']?.rollup?.array?.[0]?.select?.name) {
      mapped.telefone_filtro = properties['Telefone (Filtro)'].rollup.array[0].select.name;
    }

    // Mapear Antes e Depois com múltiplos tipos
    if (properties['Antes e Depois']?.select?.name) {
      mapped.antes_depois = properties['Antes e Depois'].select.name;
    } else if (properties['Antes e Depois']?.rich_text?.[0]?.text?.content) {
      mapped.antes_depois = properties['Antes e Depois'].rich_text[0].text.content;
    } else if (properties['Antes e Depois']?.title?.[0]?.text?.content) {
      mapped.antes_depois = properties['Antes e Depois'].title[0].text.content;
    } else if (properties['Antes e Depois']?.multi_select?.[0]?.name) {
      mapped.antes_depois = properties['Antes e Depois'].multi_select[0].name;
    } else if (properties['Antes e Depois']?.formula?.string) {
      mapped.antes_depois = properties['Antes e Depois'].formula.string;
    } else if (properties['Antes e Depois']?.rollup?.array?.[0]?.rich_text?.[0]?.text?.content) {
      mapped.antes_depois = properties['Antes e Depois'].rollup.array[0].rich_text[0].text.content;
    } else if (properties['Antes e Depois']?.rollup?.array?.[0]?.select?.name) {
      mapped.antes_depois = properties['Antes e Depois'].rollup.array[0].select.name;
    }

    // Mapear Motivo de Cancelamento com múltiplos tipos
    if (properties['Motivo de Cancelamento']?.rich_text?.[0]?.text?.content) {
      mapped.motivo_cancelamento = properties['Motivo de Cancelamento'].rich_text[0].text.content;
    } else if (properties['Motivo Cancelamento']?.rich_text?.[0]?.text?.content) {
      mapped.motivo_cancelamento = properties['Motivo Cancelamento'].rich_text[0].text.content;
    } else if (properties['Motivo de Cancelamento']?.select?.name) {
      mapped.motivo_cancelamento = properties['Motivo de Cancelamento'].select.name;
    } else if (properties['Motivo Cancelamento']?.select?.name) {
      mapped.motivo_cancelamento = properties['Motivo Cancelamento'].select.name;
    } else if (properties['Motivo de Cancelamento']?.title?.[0]?.text?.content) {
      mapped.motivo_cancelamento = properties['Motivo de Cancelamento'].title[0].text.content;
    } else if (properties['Motivo Cancelamento']?.title?.[0]?.text?.content) {
      mapped.motivo_cancelamento = properties['Motivo Cancelamento'].title[0].text.content;
    }

    // Mapear Motivo de Congelamento com múltiplos tipos
    if (properties['Motivo de Congelamento']?.rich_text?.[0]?.text?.content) {
      mapped.motivo_congelamento = properties['Motivo de Congelamento'].rich_text[0].text.content;
    } else if (properties['Motivo Congelamento']?.rich_text?.[0]?.text?.content) {
      mapped.motivo_congelamento = properties['Motivo Congelamento'].rich_text[0].text.content;
    } else if (properties['Motivo de Congelamento']?.select?.name) {
      mapped.motivo_congelamento = properties['Motivo de Congelamento'].select.name;
    } else if (properties['Motivo Congelamento']?.select?.name) {
      mapped.motivo_congelamento = properties['Motivo Congelamento'].select.name;
    } else if (properties['Motivo de Congelamento']?.title?.[0]?.text?.content) {
      mapped.motivo_congelamento = properties['Motivo de Congelamento'].title[0].text.content;
    } else if (properties['Motivo Congelamento']?.title?.[0]?.text?.content) {
      mapped.motivo_congelamento = properties['Motivo Congelamento'].title[0].text.content;
    }

    // Campos mensais
    if (properties.Janeiro?.select?.name) {
      mapped.janeiro = properties.Janeiro.select.name;
    }

    if (properties.Fevereiro?.select?.name) {
      mapped.fevereiro = properties.Fevereiro.select.name;
    }

    if (properties.Março?.select?.name) {
      mapped.marco = properties.Março.select.name;
    }

    if (properties.Abril?.select?.name) {
      mapped.abril = properties.Abril.select.name;
    }

    if (properties.Maio?.select?.name) {
      mapped.maio = properties.Maio.select.name;
    }

    if (properties.Junho?.select?.name) {
      mapped.junho = properties.Junho.select.name;
    }

    if (properties.Julho?.select?.name) {
      mapped.julho = properties.Julho.select.name;
    }

    if (properties.Agosto?.select?.name) {
      mapped.agosto = properties.Agosto.select.name;
    }

    if (properties.Setembro?.select?.name) {
      mapped.setembro = properties.Setembro.select.name;
    }

    if (properties.Outubro?.select?.name) {
      mapped.outubro = properties.Outubro.select.name;
    }

    if (properties.Novembro?.select?.name) {
      mapped.novembro = properties.Novembro.select.name;
    }

    if (properties.Dezembro?.select?.name) {
      mapped.dezembro = properties.Dezembro.select.name;
    }

    return mapped;
  }

  // Sincronizar dados do Notion para Supabase
  async syncToSupabase(databaseId: string) {
    try {
      console.log('Iniciando sincronização do Notion...');
      
      // Buscar dados do Notion via proxy (mais confiável no browser)
      let notionData;
      try {
        notionData = await this.fetchAllDataProxy(databaseId);
        console.log('✅ Dados obtidos via proxy');
      } catch (error) {
        console.log('Proxy falhou, tentando SDK...');
        notionData = await this.fetchAllData(databaseId);
        console.log('✅ Dados obtidos via SDK');
      }
      
      console.log(`Encontrados ${notionData.length} registros no Notion`);

      // Mapear dados
      const mappedData = notionData.map(page => this.mapNotionToSupabase(page));
      console.log('Dados mapeados:', mappedData.length);
      
      // Debug: verificar se apelidos estão sendo mapeados
      const apelidosMapeados = mappedData.filter(p => p.apelido).length;
      console.log(`Pacientes com apelido mapeado: ${apelidosMapeados} de ${mappedData.length}`);
      console.log('Exemplos de apelidos mapeados:', mappedData.filter(p => p.apelido).slice(0, 3).map(p => ({ nome: p.nome, apelido: p.apelido })));

      // Debug: verificar se planos estão sendo mapeados
      const planosMapeados = mappedData.filter(p => p.plano).length;
      console.log(`Pacientes com plano mapeado: ${planosMapeados} de ${mappedData.length}`);
      console.log('Exemplos de planos mapeados:', mappedData.filter(p => p.plano).slice(0, 5).map(p => ({ nome: p.nome, plano: p.plano })));
      
      // Debug: verificar planos únicos encontrados
      const planosUnicos = [...new Set(mappedData.filter(p => p.plano).map(p => p.plano))];
      console.log('Planos únicos encontrados:', planosUnicos);
      
      // Debug: mostrar pacientes sem plano mapeado
      const semPlano = mappedData.filter(p => !p.plano);
      if (semPlano.length > 0) {
        console.log(`⚠️ Pacientes sem plano mapeado (${semPlano.length}):`, semPlano.slice(0, 3).map(p => ({ nome: p.nome, telefone: p.telefone })));
      }

      // Debug: verificar todos os campos mapeados
      const camposMapeados = Object.keys(mappedData[0] || {});
      console.log('📋 Campos sendo mapeados:', camposMapeados);
      
      // Debug: estatísticas de campos
      const estatisticas = {};
      camposMapeados.forEach(campo => {
        const preenchidos = mappedData.filter(p => p[campo] && p[campo] !== '').length;
        estatisticas[campo] = `${preenchidos}/${mappedData.length}`;
      });
      console.log('📊 Estatísticas de preenchimento:', estatisticas);

      // Processar cada registro individualmente para upsert
      let totalInserted = 0;
      let totalUpdated = 0;
      const errors = [];

      for (const patientData of mappedData) {
        try {
          // Verificar se o paciente já existe (por nome)
          const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('nome', patientData.nome)
            .single();

          if (existingPatient) {
            // Buscar dados atuais do paciente para comparar
            const { data: currentPatient } = await supabase
              .from('patients')
              .select('plano, telefone, email, vencimento')
              .eq('id', existingPatient.id)
              .single();

            // Atualizar paciente existente
            const { error: updateError } = await supabase
              .from('patients')
              .update(patientData)
              .eq('id', existingPatient.id);

            if (updateError) {
              console.error(`Erro ao atualizar paciente ${patientData.nome}:`, updateError);
              errors.push({ nome: patientData.nome, error: updateError.message });
            } else {
              totalUpdated++;
              
              // Log detalhado das mudanças
              const changes = [];
              if (currentPatient?.plano !== patientData.plano) {
                changes.push(`Plano: ${currentPatient?.plano || 'N/A'} → ${patientData.plano || 'N/A'}`);
              }
              if (currentPatient?.telefone !== patientData.telefone) {
                changes.push(`Telefone: ${currentPatient?.telefone || 'N/A'} → ${patientData.telefone || 'N/A'}`);
              }
              if (currentPatient?.email !== patientData.email) {
                changes.push(`Email: ${currentPatient?.email || 'N/A'} → ${patientData.email || 'N/A'}`);
              }
              if (currentPatient?.vencimento !== patientData.vencimento) {
                changes.push(`Vencimento: ${currentPatient?.vencimento || 'N/A'} → ${patientData.vencimento || 'N/A'}`);
              }
              
              if (changes.length > 0) {
                console.log(`✅ Paciente atualizado: ${patientData.nome}`);
                console.log(`   Mudanças: ${changes.join(', ')}`);
              } else {
                console.log(`ℹ️ Paciente sem mudanças: ${patientData.nome}`);
              }
            }
          } else {
            // Inserir novo paciente
            const { error: insertError } = await supabase
              .from('patients')
              .insert(patientData);

            if (insertError) {
              console.error(`Erro ao inserir paciente ${patientData.nome}:`, insertError);
              errors.push({ nome: patientData.nome, error: insertError.message });
            } else {
              totalInserted++;
              console.log(`Paciente inserido: ${patientData.nome}`);
            }
          }
        } catch (error) {
          console.error(`Erro ao processar paciente ${patientData.nome}:`, error);
          errors.push({ nome: patientData.nome, error: error.message });
        }
      }

      console.log(`Sincronização concluída: ${totalInserted} inseridos, ${totalUpdated} atualizados, ${errors.length} erros`);
      
      return {
        inserted: totalInserted,
        updated: totalUpdated,
        errors: errors,
        total: notionData.length
      };

    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }
}
