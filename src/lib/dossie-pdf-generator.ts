import html2pdf from 'html2pdf.js';
import { Chart, registerables } from 'chart.js';
import type { Database } from '@/integrations/supabase/types';

// Registrar componentes do Chart.js
Chart.register(...registerables);

type Checkin = Database['public']['Tables']['checkin']['Row'];

interface PatientInfo {
  nome: string;
  telefone: string;
  email?: string;
  plano?: string;
}

// Função auxiliar para criar gráfico e converter para base64
async function createChartImage(config: any): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    canvas.style.display = 'none'; // Ocultar canvas
    
    // Anexar ao DOM (necessário para renderização em alguns navegadores)
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      document.body.removeChild(canvas);
      resolve('');
      return;
    }

    const chart = new Chart(ctx, config);
    
    // Aguardar render completo e converter para base64
    setTimeout(() => {
      try {
        const base64 = canvas.toDataURL('image/png', 1.0);
        chart.destroy();
        document.body.removeChild(canvas);
        resolve(base64);
      } catch (error) {
        console.error('Erro ao gerar gráfico:', error);
        chart.destroy();
        document.body.removeChild(canvas);
        resolve('');
      }
    }, 500); // Aumentar timeout para garantir render completo
  });
}

export async function generateDossiePDF(
  patient: PatientInfo,
  checkins: Checkin[],
  bodyCompositions?: any[]
) {
  // IMPORTANTE: checkins vem DESC (mais recente primeiro), reverter para ordem cronológica
  const checkinsOrdenados = [...checkins].reverse();

  // Preparar dados
  const weightData = checkinsOrdenados
    .filter(c => c.peso)
    .map(c => ({
      date: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      peso: parseFloat(c.peso || '0')
    }));

  const firstWeight = weightData[0]?.peso || 0;
  const lastWeight = weightData[weightData.length - 1]?.peso || 0;
  const weightChange = (lastWeight - firstWeight).toFixed(1);

  const avgScore = checkinsOrdenados.length > 0
    ? (checkinsOrdenados.reduce((acc, c) => acc + parseFloat(c.total_pontuacao || '0'), 0) / checkinsOrdenados.length).toFixed(1)
    : '0';

  // Gerar gráficos
  console.log('🎨 Iniciando geração de gráficos para o PDF...');
  let weightChartImage = '';
  let scoresChartImage = '';
  let radarChartImage = '';
  let bodyFatChartImage = '';

  // Gráfico de Peso
  if (weightData.length > 0) {
    console.log('📊 Gerando gráfico de peso...');
    weightChartImage = await createChartImage({
      type: 'line',
      data: {
        labels: weightData.map(d => d.date),
        datasets: [{
          label: 'Peso (kg)',
          data: weightData.map(d => d.peso),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Evolução do Peso', font: { size: 16 } }
        },
        scales: {
          y: { beginAtZero: false, title: { display: true, text: 'Peso (kg)' } }
        }
      }
    });
    console.log('✅ Gráfico de peso gerado:', weightChartImage ? 'OK' : 'FALHOU');
  }

  // Gráfico de Pontuações
  if (checkinsOrdenados.length > 0) {
    console.log('📊 Gerando gráfico de pontuações...');
    const scoresData = checkinsOrdenados.map(c => ({
      date: new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      treino: parseFloat(c.pontos_treinos || '0'),
      cardio: parseFloat(c.pontos_cardios || '0'),
      sono: parseFloat(c.pontos_sono || '0'),
      agua: parseFloat(c.pontos_agua || '0'),
      stress: parseFloat(c.pontos_stress || '0')
    }));

    scoresChartImage = await createChartImage({
      type: 'line',
      data: {
        labels: scoresData.map(d => d.date),
        datasets: [
          { label: 'Treino', data: scoresData.map(d => d.treino), borderColor: '#3b82f6', borderWidth: 2, tension: 0.4 },
          { label: 'Cardio', data: scoresData.map(d => d.cardio), borderColor: '#10b981', borderWidth: 2, tension: 0.4 },
          { label: 'Sono', data: scoresData.map(d => d.sono), borderColor: '#8b5cf6', borderWidth: 2, tension: 0.4 },
          { label: 'Água', data: scoresData.map(d => d.agua), borderColor: '#06b6d4', borderWidth: 2, tension: 0.4 },
          { label: 'Stress', data: scoresData.map(d => d.stress), borderColor: '#f59e0b', borderWidth: 2, tension: 0.4 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Evolução das Pontuações', font: { size: 16 } }
        },
        scales: {
          y: { min: 0, max: 10, title: { display: true, text: 'Pontos' } }
        }
      }
    });

    console.log('✅ Gráfico de pontuações gerado:', scoresChartImage ? 'OK' : 'FALHOU');

    // Gráfico Radar (último check-in)
    console.log('📊 Gerando gráfico radar...');
    const latestCheckin = checkinsOrdenados[checkinsOrdenados.length - 1];
    radarChartImage = await createChartImage({
      type: 'radar',
      data: {
        labels: ['Treino', 'Cardio', 'Água', 'Sono', 'Stress', 'Libido'],
        datasets: [{
          label: 'Última Avaliação',
          data: [
            parseFloat(latestCheckin.pontos_treinos || '0'),
            parseFloat(latestCheckin.pontos_cardios || '0'),
            parseFloat(latestCheckin.pontos_agua || '0'),
            parseFloat(latestCheckin.pontos_sono || '0'),
            parseFloat(latestCheckin.pontos_stress || '0'),
            parseFloat(latestCheckin.pontos_libido || '0')
          ],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Perfil Atual', font: { size: 16 } }
        },
        scales: {
          r: { min: 0, max: 10, ticks: { stepSize: 2 } }
        }
      }
    });
    console.log('✅ Gráfico radar gerado:', radarChartImage ? 'OK' : 'FALHOU');
  }

  // Gráfico de % Gordura
  if (bodyCompositions && bodyCompositions.length > 0) {
    console.log('📊 Gerando gráfico de % gordura...');
    const bodyFatData = [...bodyCompositions].reverse().map(bc => ({
      date: new Date(bc.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      gordura: bc.percentual_gordura
    }));

    bodyFatChartImage = await createChartImage({
      type: 'line',
      data: {
        labels: bodyFatData.map(d => d.date),
        datasets: [{
          label: '% Gordura',
          data: bodyFatData.map(d => d.gordura),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Evolução do % de Gordura Corporal', font: { size: 16 } }
        },
        scales: {
          y: { beginAtZero: false, title: { display: true, text: '% Gordura' } }
        }
      }
    });
    console.log('✅ Gráfico de % gordura gerado:', bodyFatChartImage ? 'OK' : 'FALHOU');
  }

  // Resumo dos gráficos gerados
  const graficosGerados = [weightChartImage, scoresChartImage, radarChartImage, bodyFatChartImage].filter(img => img).length;
  console.log(`✅ Total de gráficos gerados: ${graficosGerados}/4`);
  console.log('Tamanho das imagens:', {
    peso: weightChartImage.substring(0, 50) + '...',
    pontuacoes: scoresChartImage.substring(0, 50) + '...',
    radar: radarChartImage.substring(0, 50) + '...',
    gordura: bodyFatChartImage.substring(0, 50) + '...'
  });

  // Criar HTML para o PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          color: #1e293b;
          background: #fff;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3b82f6;
        }
        
        .header h1 {
          color: #1e40af;
          font-size: 32px;
          margin-bottom: 10px;
        }
        
        .header p {
          color: #64748b;
          font-size: 14px;
        }
        
        .patient-info {
          background: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .patient-info h2 {
          color: #1e40af;
          font-size: 24px;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          color: #64748b;
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #1e293b;
          font-size: 16px;
          font-weight: bold;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .summary-card.green {
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        }
        
        .summary-card.purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
        }
        
        .summary-card.orange {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }
        
        .summary-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 8px;
        }
        
        .summary-value {
          font-size: 28px;
          font-weight: bold;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #1e40af;
          font-size: 20px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .checkin-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .checkin-table th {
          background: #3b82f6;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
        }
        
        .checkin-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        
        .checkin-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .score-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 10px;
        }
        
        .score-excellent {
          background: #d1fae5;
          color: #047857;
        }
        
        .score-good {
          background: #fef3c7;
          color: #d97706;
        }
        
        .score-poor {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .observation-box {
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .observation-date {
          color: #1e40af;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .observation-text {
          color: #475569;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
        }
        
        @media print {
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <!-- Cabeçalho -->
      <div class="header">
        <h1>📊 DOSSIÊ DE EVOLUÇÃO</h1>
        <p>Relatório Completo de Progresso e Performance</p>
      </div>
      
      <!-- Informações do Paciente -->
      <div class="patient-info">
        <h2>${patient.nome}</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Telefone</span>
            <span class="info-value">${patient.telefone}</span>
          </div>
          ${patient.email ? `
          <div class="info-item">
            <span class="info-label">E-mail</span>
            <span class="info-value">${patient.email}</span>
          </div>
          ` : ''}
          ${patient.plano ? `
          <div class="info-item">
            <span class="info-label">Plano</span>
            <span class="info-value">${patient.plano}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <span class="info-label">Período</span>
            <span class="info-value">${new Date(checkinsOrdenados[0]?.data_checkin).toLocaleDateString('pt-BR')} - ${new Date(checkinsOrdenados[checkinsOrdenados.length - 1]?.data_checkin).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>
      
      <!-- Resumo Executivo -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">Check-ins</div>
          <div class="summary-value">${checkinsOrdenados.length}</div>
        </div>
        <div class="summary-card green">
          <div class="summary-label">Peso Inicial</div>
          <div class="summary-value">${firstWeight.toFixed(1)} kg</div>
        </div>
        <div class="summary-card purple">
          <div class="summary-label">Peso Atual</div>
          <div class="summary-value">${lastWeight.toFixed(1)} kg</div>
        </div>
        <div class="summary-card orange">
          <div class="summary-label">Variação</div>
          <div class="summary-value">${parseFloat(weightChange) > 0 ? '+' : ''}${weightChange} kg</div>
        </div>
      </div>
      
      <!-- Composição Corporal (Bioimpedância) -->
      ${bodyCompositions && bodyCompositions.length > 0 ? `
      <div class="section">
        <h3 class="section-title">📊 Análise de Composição Corporal</h3>
        <table class="checkin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>% Gordura</th>
              <th>Peso</th>
              <th>Massa Gorda</th>
              <th>Massa Magra</th>
              <th>IMC</th>
              <th>TMB (kcal)</th>
            </tr>
          </thead>
          <tbody>
            ${[...bodyCompositions].reverse().map(bc => `
              <tr>
                <td>${new Date(bc.data_avaliacao).toLocaleDateString('pt-BR')}</td>
                <td><strong>${bc.percentual_gordura}%</strong></td>
                <td>${bc.peso} kg</td>
                <td>${bc.massa_gorda} kg</td>
                <td>${bc.massa_magra} kg</td>
                <td>${bc.imc}</td>
                <td>${bc.tmb}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${bodyCompositions[0].classificacao ? `
        <div class="observation-box">
          <p class="observation-text"><strong>Última Avaliação:</strong> ${bodyCompositions[0].classificacao}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Gráficos de Evolução -->
      ${(weightChartImage || scoresChartImage || radarChartImage || bodyFatChartImage) ? `
      <div class="section page-break">
        <h3 class="section-title">📈 Gráficos de Evolução</h3>
        ${weightChartImage ? `
        <div style="margin-bottom: 30px; text-align: center;">
          <img src="${weightChartImage}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Gráfico de Peso" />
        </div>
        ` : ''}
        ${bodyFatChartImage ? `
        <div style="margin-bottom: 30px; text-align: center;">
          <img src="${bodyFatChartImage}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Gráfico de % Gordura" />
        </div>
        ` : ''}
        ${scoresChartImage ? `
        <div style="margin-bottom: 30px; text-align: center; page-break-before: always;">
          <img src="${scoresChartImage}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="Gráfico de Pontuações" />
        </div>
        ` : ''}
        ${radarChartImage ? `
        <div style="margin-bottom: 30px; text-align: center;">
          <img src="${radarChartImage}" style="max-width: 60%; height: auto; border-radius: 8px; margin: 0 auto;" alt="Gráfico Radar" />
        </div>
        ` : ''}
      </div>
      ` : ''}
      
      <!-- Tabela de Evolução -->
      <div class="section page-break">
        <h3 class="section-title">📈 Evolução Detalhada</h3>
        <table class="checkin-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Peso</th>
              <th>Treino</th>
              <th>Cardio</th>
              <th>Sono</th>
              <th>Água</th>
              <th>Total</th>
              <th>Aproveitamento</th>
            </tr>
          </thead>
          <tbody>
            ${checkinsOrdenados.map(c => {
              const score = parseFloat(c.total_pontuacao || '0');
              const scoreClass = score >= 8 ? 'score-excellent' : score >= 6 ? 'score-good' : 'score-poor';
              return `
                <tr>
                  <td>${new Date(c.data_checkin).toLocaleDateString('pt-BR')}</td>
                  <td>${c.peso || 'N/A'}</td>
                  <td>${c.pontos_treinos || 'N/A'}</td>
                  <td>${c.pontos_cardios || 'N/A'}</td>
                  <td>${c.pontos_sono || 'N/A'}</td>
                  <td>${c.pontos_agua || 'N/A'}</td>
                  <td><span class="score-badge ${scoreClass}">${c.total_pontuacao || 'N/A'}</span></td>
                  <td>${c.percentual_aproveitamento || 'N/A'}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Observações e Dificuldades -->
      ${checkinsOrdenados.some(c => c.dificuldades || c.objetivo || c.melhora_visual) ? `
      <div class="section page-break">
        <h3 class="section-title">📝 Observações e Feedback</h3>
        ${checkinsOrdenados.filter(c => c.dificuldades || c.objetivo || c.melhora_visual).map(c => `
          <div class="observation-box">
            <div class="observation-date">${new Date(c.data_checkin).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            ${c.objetivo ? `<p class="observation-text"><strong>Objetivo:</strong> ${c.objetivo}</p>` : ''}
            ${c.dificuldades ? `<p class="observation-text"><strong>Dificuldades:</strong> ${c.dificuldades}</p>` : ''}
            ${c.melhora_visual ? `<p class="observation-text"><strong>Melhora Visual:</strong> ${c.melhora_visual}</p>` : ''}
            ${c.quais_pontos ? `<p class="observation-text"><strong>Pontos Melhorados:</strong> ${c.quais_pontos}</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <!-- Rodapé -->
      <div class="footer">
        <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Sistema de Controle de Pacientes - Dossiê de Evolução</p>
      </div>
    </body>
    </html>
  `;

  // Criar elemento temporário
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  document.body.appendChild(tempDiv);

  // Configurações do PDF
  const options = {
    margin: [10, 10, 10, 10],
    filename: `dossie-evolucao-${patient.nome.replace(/\s+/g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait' 
    }
  };

  try {
    // Gerar PDF
    await html2pdf().set(options).from(tempDiv).save();
  } finally {
    // Remover elemento temporário
    document.body.removeChild(tempDiv);
  }
}

