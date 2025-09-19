import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/lib/supabase-services';

export interface ReportFilter {
  period: string;
  startDate: string;
  endDate: string;
  patients: string[];
  metrics: string[];
}

export interface ReportData {
  id: string;
  title: string;
  description: string;
  type: 'chart' | 'table' | 'summary';
  category: string;
  data: any;
  generatedAt: string;
}

class ReportsService {
  // Calcular datas baseadas no período selecionado
  private getDateRange(period: string): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate: string;

    switch (period) {
      case 'last-7-days':
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = last7Days.toISOString().split('T')[0];
        break;
      case 'last-30-days':
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = last30Days.toISOString().split('T')[0];
        break;
      case 'last-3-months':
        const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        startDate = last3Months.toISOString().split('T')[0];
        break;
      case 'last-6-months':
        const last6Months = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        startDate = last6Months.toISOString().split('T')[0];
        break;
      case 'last-year':
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        startDate = lastYear.toISOString().split('T')[0];
        break;
      default:
        startDate = endDate;
    }

    return { startDate, endDate };
  }

  // Buscar pacientes filtrados por período
  private async getFilteredPatients(filters: ReportFilter): Promise<Patient[]> {
    const { startDate, endDate } = filters.startDate && filters.endDate 
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : this.getDateRange(filters.period);

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pacientes filtrados:', error);
      return [];
    }
  }

  // Gerar relatório de detalhes dos pacientes
  async generatePatientDetailsReport(filters: ReportFilter): Promise<ReportData> {
    const patients = await this.getFilteredPatients(filters);
    
    const reportData = patients.map(patient => ({
      id: patient.id,
      nome: patient.nome || 'N/A',
      apelido: patient.apelido || 'N/A',
      telefone: patient.telefone || 'N/A',
      email: patient.email || 'N/A',
      plano: patient.plano || 'N/A',
      status: this.getPatientStatus(patient),
      dataVencimento: patient.data_vencimento || 'N/A',
      dataCriacao: patient.created_at ? new Date(patient.created_at).toLocaleDateString('pt-BR') : 'N/A',
      observacoes: patient.observacoes || 'N/A'
    }));

    return {
      id: 'patient-details',
      title: 'Detalhes dos Pacientes',
      description: `Lista completa de ${reportData.length} pacientes`,
      type: 'table',
      category: 'Pacientes',
      data: reportData,
      generatedAt: new Date().toISOString()
    };
  }

  // Determinar status do paciente
  private getPatientStatus(patient: Patient): string {
    if (!patient.plano) return 'Sem Plano';
    
    const inactivePlans = ['⛔ Negativado', 'NOVO', 'RESCISÃO', 'INATIVO'];
    const planUpper = patient.plano.toUpperCase();
    
    if (inactivePlans.some(inactive => planUpper.includes(inactive.toUpperCase()))) {
      return 'Inativo';
    }

    // Verificar vencimento
    if (patient.data_vencimento) {
      const vencimento = new Date(patient.data_vencimento);
      const hoje = new Date();
      const diasRestantes = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diasRestantes < 0) return 'Vencido';
      if (diasRestantes <= 7) return 'Expirando';
    }

    return 'Ativo';
  }

  // Gerar relatório de crescimento
  async generateGrowthReport(filters: ReportFilter): Promise<ReportData> {
    const patients = await this.getFilteredPatients(filters);
    
    // Agrupar por mês
    const monthlyData = patients.reduce((acc, patient) => {
      if (!patient.created_at) return acc;
      
      const date = new Date(patient.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, count: 0, patients: [] };
      }
      
      acc[monthKey].count++;
      acc[monthKey].patients.push(patient);
      
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));

    return {
      id: 'patient-growth',
      title: 'Crescimento de Pacientes',
      description: `Análise de crescimento com ${patients.length} pacientes`,
      type: 'chart',
      category: 'Crescimento',
      data: chartData,
      generatedAt: new Date().toISOString()
    };
  }

  // Exportar relatório como CSV
  exportToCSV(reportData: ReportData): void {
    if (reportData.type !== 'table' || !Array.isArray(reportData.data)) {
      console.error('Relatório não é do tipo tabela');
      return;
    }

    const headers = Object.keys(reportData.data[0] || {});
    const csvContent = [
      headers.join(','),
      ...reportData.data.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, `${reportData.title}.csv`, 'text/csv');
  }

  // Exportar relatório como Excel (simulado como CSV com extensão .xlsx)
  exportToExcel(reportData: ReportData): void {
    if (reportData.type !== 'table' || !Array.isArray(reportData.data)) {
      console.error('Relatório não é do tipo tabela');
      return;
    }

    // Para uma implementação completa, use uma biblioteca como xlsx
    const headers = Object.keys(reportData.data[0] || {});
    const csvContent = [
      headers.join('\t'),
      ...reportData.data.map(row => 
        headers.map(header => `${row[header] || ''}`).join('\t')
      )
    ].join('\n');

    this.downloadFile(csvContent, `${reportData.title}.xlsx`, 'application/vnd.ms-excel');
  }

  // Exportar relatório como PDF (simulado)
  exportToPDF(reportData: ReportData): void {
    // Para implementação completa, use uma biblioteca como jsPDF
    const content = `
RELATÓRIO: ${reportData.title}
DESCRIÇÃO: ${reportData.description}
GERADO EM: ${new Date(reportData.generatedAt).toLocaleString('pt-BR')}

${reportData.type === 'table' && Array.isArray(reportData.data) 
  ? reportData.data.map(row => 
      Object.entries(row).map(([key, value]) => `${key}: ${value}`).join('\n')
    ).join('\n\n')
  : 'Dados não disponíveis para exportação em PDF'
}
    `;

    this.downloadFile(content, `${reportData.title}.txt`, 'text/plain');
    console.log('PDF simulado exportado como TXT. Para PDF real, implemente jsPDF.');
  }

  // Função auxiliar para download
  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Gerar visualização do relatório
  async generateReportPreview(reportId: string, filters: ReportFilter): Promise<ReportData> {
    switch (reportId) {
      case 'patient-details':
        return await this.generatePatientDetailsReport(filters);
      case 'patient-growth':
        return await this.generateGrowthReport(filters);
      default:
        throw new Error(`Relatório ${reportId} não implementado`);
    }
  }
}

export const reportsService = new ReportsService();
