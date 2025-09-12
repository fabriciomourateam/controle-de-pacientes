import { supabase } from '@/integrations/supabase/client';
import type { PatientInsert } from '@/integrations/supabase/types';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  errors: string[];
  warnings: string[];
}

export interface CSVRow {
  [key: string]: string;
}

export class CSVImportService {
  // Mapear colunas do CSV para campos do banco
  private static fieldMapping: { [key: string]: string } = {
    'Nome': 'nome',
    'NOME': 'nome',
    'NOME E SOBRENOME': 'nome',
    'Telefone': 'telefone',
    'Vencimento': 'vencimento',
    'Plano': 'plano',
    'Tempo de Acompanhamento': 'tempo_acompanhamento',
    'Vencimento (nº dias)': 'dias_para_vencer',
    'Quantos dias pra vencer': 'dias_para_vencer',
    'Valor': 'valor',
    'Ticket Médio': 'ticket_medio',
    'Rescisão: 30%': 'rescisao_30_percent',
    'Pagamento': 'pagamento',
    'Observação': 'observacao',
    'Início': 'inicio_acompanhamento',
    'Indicações': 'indicacoes',
    'Gênero': 'genero',
    'Lembrete': 'lembrete',
    'Apelido': 'apelido',
    'CPF': 'cpf',
    'Email': 'email',
    'Telefone (Filtro)': 'telefone_filtro',
    'Data de Nascimento': 'data_nascimento',
    'Antes e Depois': 'antes_depois',
    'Janeiro': 'janeiro',
    'Fevereiro': 'fevereiro',
    'Março': 'marco',
    'Abril': 'abril',
    'Maio': 'maio',
    'Junho': 'junho',
    'Julho': 'julho',
    'Agosto': 'agosto',
    'Setembro': 'setembro',
    'Outubro': 'outubro',
    'Novembro': 'novembro',
    'Dezembro': 'dezembro',
    'PESO': 'peso',
    'MEDIDA': 'medida',
    'TREINO': 'treino',
    'CARDIO': 'cardio',
    'ÁGUA': 'agua',
    'SONO': 'sono',
    'REF. LIVRE': 'ref_livre',
    'BELISC.': 'beliscos',
    'OQ COMEU NA REF LIVRE': 'oq_comeu_ref_livre',
    'OQ BELISCOU': 'oq_beliscou',
    'COMEU MENOS?': 'comeu_menos',
    'FOME ALGUM HORÁRIO': 'fome_algum_horario',
    'ALIMENTO P/ INCLUIR': 'alimento_para_incluir',
    'MELHORA VISUAL': 'melhora_visual',
    'QUAIS PONTOS?': 'quais_pontos',
    'OBJETIVO': 'objetivo',
    'DIFICULDADES': 'dificuldades',
    'STRESS': 'stress',
    'LIBIDO': 'libido',
    'TEMPO': 'tempo',
    'DESCANSO': 'descanso',
    'TEMPO DE CARDIO': 'tempo_cardio',
    'FOTO 1': 'foto_1',
    'FOTO 2': 'foto_2',
    'FOTO 3': 'foto_3',
    'FOTO 4': 'foto_4',
    'TELEFONE CHECKIN': 'telefone_checkin',
    'PONTOS TREINOS': 'pontos_treinos',
    'PONTOS CARDIOS': 'pontos_cardios',
    'PONTOS DESCANSO ENTRE SÉRIES': 'pontos_descanso_entre_series',
    'PONTOS REFEIÇÃO LIVRE': 'pontos_refeicao_livre',
    'PONTOS BELISCOS': 'pontos_beliscos',
    'PONTOS AGUA': 'pontos_agua',
    'PONTOS SONO': 'pontos_sono',
    'PONTOS QUALIDADE DO SONO': 'pontos_qualidade_sono',
    'PONTOS ESTRESS': 'pontos_stress',
    'PONTOS LIBIDO': 'pontos_libido',
    'TOTAL DE PONTUAÇÃO': 'total_pontuacao',
    '% APROVEITAMENTO': 'percentual_aproveitamento',
    'TOTAL DE PONTUAÇÃO_1': 'total_pontuacao',
    'TOTAL DE PONTUAÇÃO_2': 'total_pontuacao',
    // Mapeamentos alternativos
    'NOME COMPLETO': 'nome',
    'NOME DO PACIENTE': 'nome',
    'PACIENTE': 'nome'
  };

  // Converter string CSV para array de objetos
  static parseCSV(csvText: string): CSVRow[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Melhor parsing para CSV com aspas e vírgulas
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
      const row: CSVRow = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      rows.push(row);
    }

    return rows;
  }

  // Converter linha CSV para objeto PatientInsert
  static convertRowToPatient(row: CSVRow): PatientInsert {
    const patient: PatientInsert = {};

    // Tratamento especial para nome (prioridade)
    const nomeFields = ['Nome', 'NOME', 'NOME E SOBRENOME'];
    for (const field of nomeFields) {
      if (row[field] && row[field].trim() !== '' && row[field].trim() !== 'null' && row[field].trim() !== 'NULL') {
        patient.nome = row[field].trim();
        break;
      }
    }

    // Mapear campos básicos
    Object.keys(this.fieldMapping).forEach(csvField => {
      const dbField = this.fieldMapping[csvField];
      const value = row[csvField];

      // Pular nome se já foi processado
      if (dbField === 'nome') return;

      if (value && value.trim() !== '' && value.trim() !== 'null' && value.trim() !== 'NULL') {
        // Converter tipos específicos
        switch (dbField) {
          case 'peso':
          case 'medida':
          case 'valor':
          case 'ticket_medio':
          case 'rescisao_30_percent':
          case 'percentual_aproveitamento':
            const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(numValue)) {
              (patient as any)[dbField] = numValue;
            }
            break;
          
          case 'tempo_acompanhamento':
          case 'dias_para_vencer':
          case 'pontos_treinos':
          case 'pontos_cardios':
          case 'pontos_descanso_entre_series':
          case 'pontos_refeicao_livre':
          case 'pontos_beliscos':
          case 'pontos_agua':
          case 'pontos_sono':
          case 'pontos_qualidade_sono':
          case 'pontos_stress':
          case 'pontos_libido':
          case 'total_pontuacao':
            const intValue = parseInt(value.replace(/[^\d]/g, ''));
            if (!isNaN(intValue)) {
              (patient as any)[dbField] = intValue;
            }
            break;
          
          case 'vencimento':
          case 'inicio_acompanhamento':
          case 'data_nascimento':
            // Converter datas
            if (value) {
              const date = new Date(value);
              if (!isNaN(date.getTime())) {
                (patient as any)[dbField] = date.toISOString();
              }
            }
            break;
          
          default:
            (patient as any)[dbField] = value;
        }
      }
    });

    return patient;
  }

  // Validar dados do paciente
  static validatePatient(patient: PatientInsert): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Apenas nome é obrigatório
    if (!patient.nome || patient.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }

    // Validações opcionais (apenas se o campo estiver preenchido)
    if (patient.email && patient.email.trim() !== '' && !this.isValidEmail(patient.email)) {
      errors.push('Email inválido');
    }

    if (patient.cpf && patient.cpf.trim() !== '' && !this.isValidCPF(patient.cpf)) {
      errors.push('CPF inválido');
    }

    if (patient.telefone && patient.telefone.trim() !== '' && !this.isValidPhone(patient.telefone)) {
      errors.push('Telefone inválido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validar email
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar CPF
  private static isValidCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    return cleanCPF.length === 11;
  }

  // Validar telefone
  private static isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  // Importar CSV para Supabase
  static async importCSV(csvText: string): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: 0,
      importedRows: 0,
      errors: [],
      warnings: []
    };

    try {
      // Parse do CSV
      const rows = this.parseCSV(csvText);
      result.totalRows = rows.length;

      if (rows.length === 0) {
        result.errors.push('Nenhuma linha de dados encontrada no CSV');
        return result;
      }

      // Processar cada linha
      const patients: PatientInsert[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const patient = this.convertRowToPatient(rows[i]);
          const validation = this.validatePatient(patient);

          if (validation.isValid) {
            patients.push(patient);
          } else {
            // Adicionar como warning em vez de erro
            warnings.push(`Linha ${i + 2}: ${validation.errors.join(', ')} - Dados serão importados mesmo assim`);
            patients.push(patient); // Importar mesmo com warnings
          }
        } catch (error) {
          errors.push(`Linha ${i + 2}: Erro ao processar - ${error}`);
        }
      }

      if (patients.length === 0) {
        result.errors = errors;
        return result;
      }

      // Inserir no Supabase em lotes
      const batchSize = 100;
      let importedCount = 0;

      for (let i = 0; i < patients.length; i += batchSize) {
        const batch = patients.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('patients')
          .insert(batch)
          .select('id');

        if (error) {
          errors.push(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        } else {
          importedCount += data?.length || 0;
        }
      }

      result.importedRows = importedCount;
      result.errors = errors;
      result.warnings = warnings;
      result.success = importedCount > 0;

      if (importedCount < patients.length) {
        result.warnings.push(`${patients.length - importedCount} registros não foram importados devido a erros`);
      }

      // Adicionar informações de debug
      result.warnings.push(`Total de linhas processadas: ${rows.length}`);
      result.warnings.push(`Pacientes válidos: ${patients.length}`);
      result.warnings.push(`Pacientes importados: ${importedCount}`);
      result.warnings.push(`Registros não importados: ${rows.length - importedCount}`);
      
      // Mostrar alguns exemplos de nomes encontrados
      const nomesEncontrados = patients.slice(0, 5).map(p => p.nome).filter(n => n);
      if (nomesEncontrados.length > 0) {
        result.warnings.push(`Exemplos de nomes: ${nomesEncontrados.join(', ')}`);
      }

    } catch (error) {
      result.errors.push(`Erro geral: ${error}`);
    }

    return result;
  }

  // Limpar dados existentes (usar com cuidado!)
  static async clearAllPatients(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todos

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
