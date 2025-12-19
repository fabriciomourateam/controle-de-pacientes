import { jsPDF } from 'jspdf';

interface PatientData {
  nome: string;
  data_nascimento?: string | null;
  telefone?: string;
  peso_inicial?: number | string | null;
  altura_inicial?: number | string | null;
  created_at?: string;
}

interface CheckinData {
  data_checkin: string;
  peso?: string;
  medida?: string;
  treino?: string;
  cardio?: string;
  agua?: string;
  sono?: string;
  pontuacao_total?: number;
}

interface BodyCompositionData {
  date?: string;
  data_avaliacao?: string;
  bodyFat?: number | null;
  percentual_gordura?: number | null;
  muscleMass?: number | null;
  massa_muscular?: number | null;
  visceralFat?: number | null;
  gordura_visceral?: number | null;
}

interface EvolutionReportData {
  patient: PatientData;
  checkins: CheckinData[];
  bodyCompositions?: BodyCompositionData[];
}

export class EvolutionPDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  
  // Cores do tema
  private colors = {
    primary: '#10B981', // Verde esmeralda
    secondary: '#3B82F6', // Azul
    accent: '#F59E0B', // Amarelo/Dourado
    dark: '#1F2937',
    light: '#F3F4F6',
    white: '#FFFFFF',
    success: '#22C55E',
    warning: '#EAB308',
    danger: '#EF4444',
  };

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private setColor(hex: string) {
    const rgb = this.hexToRgb(hex);
    this.pdf.setTextColor(rgb.r, rgb.g, rgb.b);
  }

  private setFillColor(hex: string) {
    const rgb = this.hexToRgb(hex);
    this.pdf.setFillColor(rgb.r, rgb.g, rgb.b);
  }

  private setDrawColor(hex: string) {
    const rgb = this.hexToRgb(hex);
    this.pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
  }

  private checkPageBreak(neededHeight: number) {
    if (this.currentY + neededHeight > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string) {
    this.setFillColor(fill);
    if (stroke) {
      this.setDrawColor(stroke);
      this.pdf.roundedRect(x, y, w, h, r, r, 'FD');
    } else {
      this.pdf.roundedRect(x, y, w, h, r, r, 'F');
    }
  }

  private calcularIdade(dataNascimento: string | null | undefined): number | null {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private drawHeader(patient: PatientData) {
    // Background do header
    this.drawRoundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 35, 3, this.colors.primary);
    
    // Emoji e título
    this.pdf.setFontSize(20);
    this.setColor(this.colors.white);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📊 Relatório de Evolução', this.margin + 10, this.currentY + 15);
    
    // Nome do paciente
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(patient.nome || 'Paciente', this.margin + 10, this.currentY + 25);
    
    // Data de geração
    this.pdf.setFontSize(10);
    const dataGeracao = new Date().toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    this.pdf.text(`Gerado em ${dataGeracao}`, this.pageWidth - this.margin - 60, this.currentY + 25);
    
    this.currentY += 45;
  }

  private drawMetricCard(x: number, y: number, width: number, title: string, value: string, subtitle: string, color: string) {
    // Card background
    this.drawRoundedRect(x, y, width, 28, 2, this.colors.light);
    
    // Barra lateral colorida
    this.drawRoundedRect(x, y, 3, 28, 1, color);
    
    // Título
    this.pdf.setFontSize(8);
    this.setColor(this.colors.dark);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(title, x + 8, y + 8);
    
    // Valor
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.setColor(color);
    this.pdf.text(value, x + 8, y + 18);
    
    // Subtítulo
    this.pdf.setFontSize(7);
    this.setColor('#6B7280');
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(subtitle, x + 8, y + 24);
  }

  private drawMetricsSection(patient: PatientData, checkins: CheckinData[]) {
    this.checkPageBreak(50);
    
    // Título da seção
    this.pdf.setFontSize(14);
    this.setColor(this.colors.dark);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📈 Métricas Principais', this.margin, this.currentY);
    this.currentY += 8;
    
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 3;
    const idade = this.calcularIdade(patient.data_nascimento);
    
    // Linha 1: Check-ins, Idade, Altura
    this.drawMetricCard(
      this.margin, 
      this.currentY, 
      cardWidth, 
      'Check-ins', 
      checkins.length.toString(), 
      'Total de avaliações',
      this.colors.secondary
    );
    
    if (idade) {
      this.drawMetricCard(
        this.margin + cardWidth + 5, 
        this.currentY, 
        cardWidth, 
        'Idade', 
        `${idade} anos`, 
        'Idade atual',
        '#06B6D4'
      );
    }
    
    if (patient.altura_inicial) {
      this.drawMetricCard(
        this.margin + 2 * (cardWidth + 5), 
        this.currentY, 
        cardWidth, 
        'Altura', 
        `${patient.altura_inicial}m`, 
        'Altura',
        '#8B5CF6'
      );
    }
    
    this.currentY += 35;
    
    // Linha 2: Peso Inicial, Peso Atual, Variação
    const pesoInicial = patient.peso_inicial ? parseFloat(patient.peso_inicial.toString()) : null;
    const ultimoCheckin = checkins[0];
    const pesoAtual = ultimoCheckin?.peso ? parseFloat(ultimoCheckin.peso.replace(',', '.')) : null;
    const variacao = pesoInicial && pesoAtual ? (pesoAtual - pesoInicial).toFixed(1) : null;
    
    if (pesoInicial) {
      this.drawMetricCard(
        this.margin, 
        this.currentY, 
        cardWidth, 
        'Peso Inicial', 
        `${pesoInicial.toFixed(1)}kg`, 
        patient.created_at ? this.formatDate(patient.created_at) : '',
        this.colors.success
      );
    }
    
    if (pesoAtual) {
      this.drawMetricCard(
        this.margin + cardWidth + 5, 
        this.currentY, 
        cardWidth, 
        'Peso Atual', 
        `${pesoAtual.toFixed(1)}kg`, 
        ultimoCheckin?.data_checkin ? this.formatDate(ultimoCheckin.data_checkin) : '',
        this.colors.secondary
      );
    }
    
    if (variacao) {
      const variacaoNum = parseFloat(variacao);
      const variacaoColor = variacaoNum < 0 ? this.colors.success : variacaoNum > 0 ? this.colors.warning : '#6B7280';
      const variacaoLabel = variacaoNum < 0 ? 'Perda de peso' : variacaoNum > 0 ? 'Ganho de peso' : 'Sem variação';
      
      this.drawMetricCard(
        this.margin + 2 * (cardWidth + 5), 
        this.currentY, 
        cardWidth, 
        'Variação', 
        `${variacaoNum > 0 ? '+' : ''}${variacao}kg`, 
        variacaoLabel,
        variacaoColor
      );
    }
    
    this.currentY += 40;
  }

  private drawBodyCompositionSection(bodyCompositions: BodyCompositionData[]) {
    if (!bodyCompositions || bodyCompositions.length === 0) return;
    
    this.checkPageBreak(60);
    
    // Título da seção
    this.pdf.setFontSize(14);
    this.setColor(this.colors.dark);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('🏋️ Composição Corporal', this.margin, this.currentY);
    this.currentY += 8;
    
    const lastComposition = bodyCompositions[0];
    const cardWidth = (this.pageWidth - 2 * this.margin - 10) / 3;
    
    const bodyFat = lastComposition.bodyFat || lastComposition.percentual_gordura;
    const muscleMass = lastComposition.muscleMass || lastComposition.massa_muscular;
    const visceralFat = lastComposition.visceralFat || lastComposition.gordura_visceral;
    
    if (bodyFat) {
      this.drawMetricCard(
        this.margin, 
        this.currentY, 
        cardWidth, 
        '% Gordura Corporal', 
        `${bodyFat.toFixed(1)}%`, 
        'Última avaliação',
        this.colors.warning
      );
    }
    
    if (muscleMass) {
      this.drawMetricCard(
        this.margin + cardWidth + 5, 
        this.currentY, 
        cardWidth, 
        'Massa Muscular', 
        `${muscleMass.toFixed(1)}kg`, 
        'Última avaliação',
        this.colors.success
      );
    }
    
    if (visceralFat) {
      this.drawMetricCard(
        this.margin + 2 * (cardWidth + 5), 
        this.currentY, 
        cardWidth, 
        'Gordura Visceral', 
        visceralFat.toString(), 
        'Nível',
        this.colors.danger
      );
    }
    
    this.currentY += 40;
  }

  private drawWeightEvolutionTable(checkins: CheckinData[], patient: PatientData) {
    if (checkins.length === 0) return;
    
    this.checkPageBreak(80);
    
    // Título da seção
    this.pdf.setFontSize(14);
    this.setColor(this.colors.dark);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📊 Histórico de Peso', this.margin, this.currentY);
    this.currentY += 10;
    
    // Cabeçalho da tabela
    const colWidths = [40, 35, 35, 60];
    const headers = ['Data', 'Peso', 'Variação', 'Observação'];
    
    this.drawRoundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 1, this.colors.primary);
    
    this.pdf.setFontSize(9);
    this.setColor(this.colors.white);
    this.pdf.setFont('helvetica', 'bold');
    
    let xPos = this.margin + 5;
    headers.forEach((header, i) => {
      this.pdf.text(header, xPos, this.currentY + 5.5);
      xPos += colWidths[i];
    });
    
    this.currentY += 10;
    
    // Dados da tabela (últimos 10 registros)
    const weightData: { date: string; peso: number; variacao: string }[] = [];
    
    // Adicionar peso inicial
    if (patient.peso_inicial) {
      weightData.push({
        date: patient.created_at ? this.formatDate(patient.created_at) : 'Início',
        peso: parseFloat(patient.peso_inicial.toString()),
        variacao: '-'
      });
    }
    
    // Adicionar check-ins (do mais antigo ao mais recente)
    const sortedCheckins = [...checkins].reverse();
    sortedCheckins.forEach((checkin, index) => {
      if (checkin.peso) {
        const pesoAtual = parseFloat(checkin.peso.replace(',', '.'));
        const pesoAnterior = weightData.length > 0 ? weightData[weightData.length - 1].peso : pesoAtual;
        const variacao = pesoAtual - pesoAnterior;
        
        weightData.push({
          date: this.formatDate(checkin.data_checkin),
          peso: pesoAtual,
          variacao: variacao === 0 ? '0.0kg' : `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}kg`
        });
      }
    });
    
    // Mostrar últimos 8 registros
    const recentData = weightData.slice(-8);
    
    recentData.forEach((row, index) => {
      this.checkPageBreak(10);
      
      const bgColor = index % 2 === 0 ? this.colors.white : this.colors.light;
      this.drawRoundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 0, bgColor);
      
      this.pdf.setFontSize(9);
      this.setColor(this.colors.dark);
      this.pdf.setFont('helvetica', 'normal');
      
      xPos = this.margin + 5;
      this.pdf.text(row.date, xPos, this.currentY + 5.5);
      xPos += colWidths[0];
      
      this.pdf.text(`${row.peso.toFixed(1)}kg`, xPos, this.currentY + 5.5);
      xPos += colWidths[1];
      
      // Cor da variação
      if (row.variacao.includes('+')) {
        this.setColor(this.colors.warning);
      } else if (row.variacao.includes('-')) {
        this.setColor(this.colors.success);
      } else {
        this.setColor(this.colors.dark);
      }
      this.pdf.text(row.variacao, xPos, this.currentY + 5.5);
      xPos += colWidths[2];
      
      this.setColor(this.colors.dark);
      const obs = index === recentData.length - 1 ? 'Peso atual' : index === 0 ? 'Peso inicial' : '';
      this.pdf.text(obs, xPos, this.currentY + 5.5);
      
      this.currentY += 8;
    });
    
    this.currentY += 10;
  }

  private drawCheckinsHistory(checkins: CheckinData[]) {
    if (checkins.length === 0) return;
    
    this.checkPageBreak(60);
    
    // Título da seção
    this.pdf.setFontSize(14);
    this.setColor(this.colors.dark);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('📋 Últimos Check-ins', this.margin, this.currentY);
    this.currentY += 10;
    
    // Mostrar últimos 5 check-ins
    const recentCheckins = checkins.slice(0, 5);
    
    recentCheckins.forEach((checkin, index) => {
      this.checkPageBreak(25);
      
      // Card do check-in
      this.drawRoundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 20, 2, this.colors.light);
      
      // Data
      this.pdf.setFontSize(10);
      this.setColor(this.colors.primary);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(this.formatDate(checkin.data_checkin), this.margin + 5, this.currentY + 7);
      
      // Métricas em linha
      this.pdf.setFontSize(8);
      this.setColor(this.colors.dark);
      this.pdf.setFont('helvetica', 'normal');
      
      let metricsText = '';
      if (checkin.peso) metricsText += `Peso: ${checkin.peso}kg  `;
      if (checkin.treino) metricsText += `Treino: ${checkin.treino}  `;
      if (checkin.agua) metricsText += `Água: ${checkin.agua}L  `;
      if (checkin.sono) metricsText += `Sono: ${checkin.sono}h`;
      
      this.pdf.text(metricsText, this.margin + 5, this.currentY + 14);
      
      // Pontuação (se houver)
      if (checkin.pontuacao_total) {
        this.pdf.setFontSize(12);
        this.setColor(this.colors.primary);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(`${checkin.pontuacao_total} pts`, this.pageWidth - this.margin - 25, this.currentY + 12);
      }
      
      this.currentY += 25;
    });
    
    this.currentY += 5;
  }

  private drawFooter() {
    const footerY = this.pageHeight - 15;
    
    // Linha separadora
    this.setDrawColor(this.colors.light);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Texto do footer
    this.pdf.setFontSize(8);
    this.setColor('#9CA3AF');
    this.pdf.setFont('helvetica', 'normal');
    
    const footerText = 'Relatório gerado automaticamente pelo sistema Grow Nutri';
    this.pdf.text(footerText, this.margin, footerY);
    
    // Número da página
    const pageNum = `Página ${this.pdf.getCurrentPageInfo().pageNumber}`;
    this.pdf.text(pageNum, this.pageWidth - this.margin - 20, footerY);
  }

  public async generate(data: EvolutionReportData): Promise<void> {
    const { patient, checkins, bodyCompositions } = data;
    
    // Header
    this.drawHeader(patient);
    
    // Métricas principais
    this.drawMetricsSection(patient, checkins);
    
    // Composição corporal
    if (bodyCompositions && bodyCompositions.length > 0) {
      this.drawBodyCompositionSection(bodyCompositions);
    }
    
    // Tabela de evolução de peso
    this.drawWeightEvolutionTable(checkins, patient);
    
    // Histórico de check-ins
    this.drawCheckinsHistory(checkins);
    
    // Footer em todas as páginas
    const totalPages = this.pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.pdf.setPage(i);
      this.drawFooter();
    }
    
    // Salvar
    const fileName = `evolucao-${patient.nome?.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'paciente'}-${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(fileName);
  }
}

// Função helper para uso direto
export async function generateEvolutionPDF(
  patient: PatientData,
  checkins: CheckinData[],
  bodyCompositions?: BodyCompositionData[]
): Promise<void> {
  const generator = new EvolutionPDFGenerator();
  await generator.generate({ patient, checkins, bodyCompositions });
}