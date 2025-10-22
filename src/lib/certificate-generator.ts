// Gerador de Certificado de Conquista
import html2pdf from 'html2pdf.js';

export interface CertificateData {
  patientName: string;
  achievement: string; // ex: "Perdeu 10kg"
  startDate: string;
  endDate: string;
  weightLost?: number;
  bodyFatLost?: number;
  totalWeeks: number;
  coachName?: string;
  coachTitle?: string;
}

export async function generateCertificate(data: CertificateData) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600;700&display=swap');
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Montserrat', sans-serif;
        }
        
        .certificate {
          width: 1000px;
          height: 707px;
          padding: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          position: relative;
          box-sizing: border-box;
        }
        
        .certificate-inner {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 20px;
          padding: 50px;
          box-sizing: border-box;
          position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .border-decoration {
          position: absolute;
          top: 30px;
          left: 30px;
          right: 30px;
          bottom: 30px;
          border: 3px solid #667eea;
          border-radius: 15px;
          pointer-events: none;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .trophy {
          font-size: 80px;
          margin-bottom: 15px;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 700;
          color: #667eea;
          margin: 0;
          letter-spacing: 2px;
        }
        
        .subtitle {
          font-size: 20px;
          color: #764ba2;
          margin: 5px 0 0 0;
          font-weight: 600;
        }
        
        .content {
          text-align: center;
          margin: 40px 0;
        }
        
        .intro {
          font-size: 18px;
          color: #555;
          margin-bottom: 20px;
        }
        
        .recipient-name {
          font-family: 'Playfair Display', serif;
          font-size: 56px;
          font-weight: 700;
          color: #333;
          margin: 20px 0;
          text-decoration: underline;
          text-decoration-color: #667eea;
          text-underline-offset: 10px;
        }
        
        .achievement {
          font-size: 22px;
          color: #555;
          margin: 30px 0;
          line-height: 1.6;
        }
        
        .achievement strong {
          color: #667eea;
          font-weight: 700;
          font-size: 26px;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin: 35px 0;
        }
        
        .stat {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
          border-radius: 15px;
          min-width: 140px;
        }
        
        .stat-value {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          opacity: 0.95;
        }
        
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .date-section {
          text-align: left;
        }
        
        .signature-section {
          text-align: right;
        }
        
        .date-label, .signature-label {
          font-size: 13px;
          color: #888;
          margin-bottom: 5px;
        }
        
        .date-value {
          font-size: 16px;
          color: #333;
          font-weight: 600;
        }
        
        .signature-line {
          width: 250px;
          height: 2px;
          background: #667eea;
          margin-bottom: 5px;
        }
        
        .signature-name {
          font-size: 18px;
          color: #333;
          font-weight: 700;
        }
        
        .signature-title {
          font-size: 14px;
          color: #666;
        }
        
        .watermark {
          position: absolute;
          bottom: 15px;
          right: 20px;
          font-size: 11px;
          color: #bbb;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-inner">
          <div class="border-decoration"></div>
          
          <div class="header">
            <div class="trophy">🏆</div>
            <h1 class="title">CERTIFICADO</h1>
            <p class="subtitle">DE CONQUISTA</p>
          </div>
          
          <div class="content">
            <p class="intro">Certificamos que</p>
            
            <h2 class="recipient-name">${data.patientName}</h2>
            
            <p class="achievement">
              completou com sucesso sua jornada de transformação,<br>
              alcançando a conquista de<br>
              <strong>${data.achievement}</strong>
            </p>
            
            <div class="stats">
              ${data.weightLost ? `
              <div class="stat">
                <div class="stat-value">${data.weightLost.toFixed(1)}kg</div>
                <div class="stat-label">Peso Perdido</div>
              </div>
              ` : ''}
              
              ${data.bodyFatLost ? `
              <div class="stat">
                <div class="stat-value">${data.bodyFatLost.toFixed(1)}%</div>
                <div class="stat-label">Gordura Reduzida</div>
              </div>
              ` : ''}
              
              <div class="stat">
                <div class="stat-value">${data.totalWeeks}</div>
                <div class="stat-label">Semanas</div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div class="date-section">
              <div class="date-label">Período</div>
              <div class="date-value">
                ${data.startDate} - ${data.endDate}
              </div>
            </div>
            
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-name">
                ${data.coachName || 'Equipe de Treinamento'}
              </div>
              <div class="signature-title">
                ${data.coachTitle || 'Personal Trainer'}
              </div>
            </div>
          </div>
          
          <div class="watermark">
            Gerado em ${new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const options = {
    margin: 0,
    filename: `certificado-${data.patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: null
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'landscape',
      compress: true
    }
  };

  try {
    await html2pdf().set(options).from(htmlContent).save();
    return true;
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    throw error;
  }
}

// Função auxiliar para verificar se o usuário merece um certificado
export function checkCertificateEligibility(
  weightLost: number,
  totalWeeks: number,
  bodyFatLost?: number
): { eligible: boolean; achievement?: string } {
  // Perdeu 10kg ou mais
  if (weightLost >= 10) {
    return {
      eligible: true,
      achievement: `Perdeu ${weightLost.toFixed(1)}kg em ${totalWeeks} semanas`
    };
  }

  // Perdeu 5% ou mais de gordura
  if (bodyFatLost && bodyFatLost >= 5) {
    return {
      eligible: true,
      achievement: `Reduziu ${bodyFatLost.toFixed(1)}% de gordura corporal`
    };
  }

  // Completou 12 semanas com progresso
  if (totalWeeks >= 12 && weightLost >= 5) {
    return {
      eligible: true,
      achievement: `Completou ${totalWeeks} semanas de transformação`
    };
  }

  return { eligible: false };
}

