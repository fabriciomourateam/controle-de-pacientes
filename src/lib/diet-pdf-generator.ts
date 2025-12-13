import { calcularTotaisPlano, calcularTotaisRefeicao } from '@/utils/diet-calculations';
import { ConfigService } from './config-service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface DietPlanForPDF {
  name: string;
  diet_meals?: Array<{
    meal_name: string;
    meal_order: number;
    suggested_time?: string | null;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
    instructions?: string | null;
    diet_foods?: Array<{
      food_name: string;
      quantity: number;
      unit: string;
      calories?: number | null;
      protein?: number | null;
      carbs?: number | null;
      fats?: number | null;
      notes?: string | null;
    }>;
  }>;
  diet_guidelines?: Array<{
    guideline_type: string;
    title: string;
    content: string;
  }>;
  total_calories?: number | null;
  total_protein?: number | null;
  total_carbs?: number | null;
  total_fats?: number | null;
}

export interface PatientForPDF {
  nome: string;
  [key: string]: any;
}

export type PDFTheme = 'light' | 'dark';

export class DietPDFGenerator {
  /**
   * Gerar PDF do plano alimentar com branding e opções de tema
   */
  static async generatePDF(
    plan: DietPlanForPDF,
    patient: PatientForPDF,
    options: {
      theme?: PDFTheme;
      showMacrosPerMeal?: boolean;
    } = {}
  ): Promise<void> {
    const { theme = 'light', showMacrosPerMeal = true } = options;

    // Buscar configurações de branding
    const branding = await ConfigService.getPDFBrandingConfig();

    // Calcular totais do plano
    const totais = calcularTotaisPlano(plan as any);
    const totalCalories = plan.total_calories || totais.calorias;
    const totalProtein = plan.total_protein || totais.proteinas;
    const totalCarbs = plan.total_carbs || totais.carboidratos;
    const totalFats = plan.total_fats || totais.gorduras;

    // Estilos baseados no tema
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f1f5f9' : '#222222';
    const cardBg = isDark ? '#334155' : '#F5F7FB';
    const borderColor = isDark ? '#475569' : '#E5E7EB';
    const secondaryText = isDark ? '#94a3b8' : '#777777';
    const primaryColor = branding.primary_color || '#00C98A';

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: ${textColor};
            background: ${bgColor};
            padding: 30px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 25px;
            border-bottom: 4px solid ${primaryColor};
          }
          .logo-container {
            margin-bottom: 15px;
          }
          .logo-container img {
            max-height: 60px;
            max-width: 200px;
          }
          .header h1 {
            color: ${primaryColor};
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .header .patient-name {
            font-size: 20px;
            color: ${textColor};
            font-weight: 600;
            margin-bottom: 5px;
          }
          .header .plan-name {
            font-size: 14px;
            color: ${secondaryText};
          }
          .company-name {
            font-size: 12px;
            color: ${secondaryText};
            margin-top: 10px;
          }
          .totals-summary {
            background: ${cardBg};
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          .total-item {
            text-align: center;
          }
          .total-label {
            font-size: 11px;
            color: ${secondaryText};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .total-value {
            font-size: 28px;
            font-weight: bold;
            color: ${primaryColor};
          }
          .total-unit {
            font-size: 12px;
            color: ${secondaryText};
            margin-left: 2px;
          }
          .meal-card {
            background: ${cardBg};
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .meal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid ${borderColor};
          }
          .meal-title {
            color: ${textColor};
            font-size: 22px;
            font-weight: bold;
          }
          .meal-time {
            color: ${secondaryText};
            font-size: 14px;
            font-style: italic;
          }
          ${showMacrosPerMeal ? `
          .meal-macros {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
            padding: 12px;
            background: ${isDark ? '#475569' : '#ffffff'};
            border-radius: 8px;
          }
          .meal-macro-item {
            text-align: center;
          }
          .meal-macro-label {
            font-size: 10px;
            color: ${secondaryText};
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .meal-macro-value {
            font-size: 16px;
            font-weight: bold;
            color: ${primaryColor};
          }
          ` : ''}
          .food-item {
            background: ${isDark ? '#475569' : '#FFFFFF'};
            border: 1px solid ${borderColor};
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .food-name {
            font-weight: 600;
            color: ${textColor};
            font-size: 15px;
          }
          .food-quantity {
            color: ${secondaryText};
            font-size: 14px;
            margin-left: 10px;
          }
          .food-calories {
            color: ${secondaryText};
            font-size: 13px;
            font-weight: 500;
          }
          .meal-instructions {
            background: ${isDark ? '#7c2d12' : '#FEF3C7'};
            border-left: 4px solid ${isDark ? '#ea580c' : '#F59E0B'};
            padding: 15px;
            margin-top: 15px;
            border-radius: 4px;
          }
          .meal-instructions strong {
            color: ${isDark ? '#fed7aa' : '#92400E'};
            display: block;
            margin-bottom: 8px;
          }
          .meal-instructions p {
            color: ${isDark ? '#ffedd5' : '#78350F'};
            line-height: 1.6;
            font-size: 14px;
          }
          .meal-total {
            text-align: right;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid ${borderColor};
            color: ${secondaryText};
            font-size: 13px;
            font-weight: 600;
          }
          .guidelines-section {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 3px solid ${borderColor};
            page-break-inside: avoid;
          }
          .guidelines-title {
            color: ${primaryColor};
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .guideline-card {
            background: ${cardBg};
            border: 2px solid ${borderColor};
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .guideline-title {
            color: ${textColor};
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .guideline-content {
            color: ${secondaryText};
            line-height: 1.8;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .guideline-type {
            display: inline-block;
            background: ${primaryColor};
            color: white;
            padding: 5px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid ${borderColor};
            text-align: center;
            color: ${secondaryText};
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${branding.show_logo && branding.logo_url ? `
            <div class="logo-container">
              <img src="${branding.logo_url}" alt="Logo" />
            </div>
          ` : ''}
          <h1>🥗 Plano Alimentar</h1>
          ${branding.show_company_name ? `<div class="company-name">${branding.company_name}</div>` : ''}
          <div class="patient-name">${patient.nome}</div>
          <div class="plan-name">${plan.name || 'Plano Alimentar'}</div>
        </div>

        <!-- Resumo de Totais -->
        <div class="totals-summary">
          <div class="total-item">
            <div class="total-label">Calorias</div>
            <div class="total-value">${totalCalories}<span class="total-unit">kcal</span></div>
          </div>
          <div class="total-item">
            <div class="total-label">Proteínas</div>
            <div class="total-value">${totalProtein}<span class="total-unit">g</span></div>
          </div>
          <div class="total-item">
            <div class="total-label">Carboidratos</div>
            <div class="total-value">${totalCarbs}<span class="total-unit">g</span></div>
          </div>
          <div class="total-item">
            <div class="total-label">Gorduras</div>
            <div class="total-value">${totalFats}<span class="total-unit">g</span></div>
          </div>
        </div>

        <!-- Refeições -->
        ${plan.diet_meals && plan.diet_meals.length > 0 ? plan.diet_meals
          .sort((a, b) => (a.meal_order || 0) - (b.meal_order || 0))
          .map((meal: any) => {
            const mealTotals = calcularTotaisRefeicao(meal);
            return `
              <div class="meal-card">
                <div class="meal-header">
                  <div class="meal-title">${meal.meal_name}</div>
                  ${meal.suggested_time ? `<div class="meal-time">${meal.suggested_time}</div>` : ''}
                </div>
                
                ${showMacrosPerMeal ? `
                  <div class="meal-macros">
                    <div class="meal-macro-item">
                      <div class="meal-macro-label">Cal</div>
                      <div class="meal-macro-value">${mealTotals.calorias}</div>
                    </div>
                    <div class="meal-macro-item">
                      <div class="meal-macro-label">Prot</div>
                      <div class="meal-macro-value">${mealTotals.proteinas}g</div>
                    </div>
                    <div class="meal-macro-item">
                      <div class="meal-macro-label">Carb</div>
                      <div class="meal-macro-value">${mealTotals.carboidratos}g</div>
                    </div>
                    <div class="meal-macro-item">
                      <div class="meal-macro-label">Gord</div>
                      <div class="meal-macro-value">${mealTotals.gorduras}g</div>
                    </div>
                  </div>
                ` : ''}

                ${meal.diet_foods && meal.diet_foods.length > 0 ? meal.diet_foods.map((food: any) => `
                  <div class="food-item">
                    <div>
                      <span class="food-name">${food.food_name}</span>
                      <span class="food-quantity">- ${food.quantity} ${food.unit}</span>
                    </div>
                    ${food.calories ? `<span class="food-calories">${food.calories} kcal</span>` : ''}
                  </div>
                `).join('') : '<p style="color: ' + secondaryText + '; padding: 15px;">Nenhum alimento adicionado</p>'}

                ${meal.instructions ? `
                  <div class="meal-instructions">
                    <strong>⚠️ Instruções:</strong>
                    <p>${meal.instructions}</p>
                  </div>
                ` : ''}

                <div class="meal-total">
                  Total da refeição: ${mealTotals.calorias} kcal
                </div>
              </div>
            `;
          }).join('') : '<p style="color: ' + secondaryText + '; padding: 30px; text-align: center;">Nenhuma refeição cadastrada</p>'}

        <!-- Orientações -->
        ${plan.diet_guidelines && plan.diet_guidelines.length > 0 ? `
          <div class="guidelines-section">
            <h2 class="guidelines-title">📚 Orientações</h2>
            ${plan.diet_guidelines.map((guideline: any) => `
              <div class="guideline-card">
                <h3 class="guideline-title">${guideline.title}</h3>
                <p class="guideline-content">${guideline.content}</p>
                <span class="guideline-type">${guideline.guideline_type}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Rodapé -->
        <div class="footer">
          <p>${branding.footer_text || 'Sistema de Controle de Pacientes'}</p>
          <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;

    // Criar elemento temporário
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.width = '800px';
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      // Capturar como imagem
      const canvas = await html2canvas(tempDiv, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: bgColor,
        windowWidth: 800,
        windowHeight: tempDiv.scrollHeight,
      });

      // Converter para PDF
      const imgData = canvas.toDataURL('image/png', 0.98);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210; // A4 width in mm
      const imgHeightMM = (imgHeight * pdfWidth) / imgWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, imgHeightMM]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMM, undefined, 'FAST');
      pdf.save(`plano-alimentar-${patient.nome.replace(/\s+/g, '-')}.pdf`);
    } finally {
      // Remover elemento temporário
      document.body.removeChild(tempDiv);
    }
  }
}





