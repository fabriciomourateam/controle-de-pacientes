# 📊 Guia Completo: Exportação da Evolução do Portal do Paciente

## 🎯 Objetivo
Implementar funcionalidade para exportar a página de evolução do portal do paciente com layout idêntico ao original, incluindo todos os elementos visuais e dados.

## 📋 Elementos a Serem Exportados

### 1. **Header do Acompanhamento**
- Título: "📊 Meu Acompanhamento"
- Subtítulo: "Acompanhe seu progresso e conquistas"

### 2. **Cards de Métricas Principais** (Grid responsivo)
- **Check-ins**: Total de avaliações realizadas
- **Idade**: Idade atual do paciente
- **Altura**: Altura do paciente
- **Peso Inicial**: Primeiro peso registrado + data
- **Peso Atual**: Último peso registrado + data
- **Variação**: Diferença de peso com indicador visual (cores)

### 3. **Composição Corporal Atual**
- Última avaliação de bioimpedância
- Métricas de gordura corporal, massa muscular, etc.

### 4. **Gráficos de Evolução**
- **Evolução do Peso**: Linha temporal com pontos
- **Evolução do % de Gordura Corporal**: Se disponível
- **Evolução das Pontuações**: Performance em categorias

### 5. **Análise Inteligente com IA**
- Insights automáticos sobre progresso
- Recomendações personalizadas

## 🎨 Melhores Formatos para Exportação

### 1. **PNG de Alta Qualidade** ⭐ RECOMENDADO
```typescript
// Configuração otimizada para PNG
const exportConfig = {
  format: 'png',
  quality: 1.0,
  scale: 2, // Dobrar resolução para qualidade HD
  backgroundColor: '#0f172a', // Fundo escuro do portal
  width: 1920, // Largura Full HD
  removeElements: ['.hide-in-export'], // Ocultar botões
}
```

**Vantagens:**
- ✅ Preserva gradientes e efeitos visuais
- ✅ Qualidade perfeita para gráficos
- ✅ Suporte a transparência
- ✅ Ideal para compartilhamento digital

### 2. **PDF Profissional** 📄
```typescript
// Configuração para PDF
const pdfConfig = {
  format: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  printBackground: true, // Preservar gradientes
  scale: 0.8, // Ajustar para caber na página
}
```

**Vantagens:**
- ✅ Formato profissional
- ✅ Fácil impressão
- ✅ Múltiplas páginas se necessário
- ✅ Padrão para relatórios médicos

### 3. **JPEG Comprimido** 📱
```typescript
// Para compartilhamento rápido
const jpegConfig = {
  format: 'jpeg',
  quality: 0.9,
  backgroundColor: '#0f172a',
  optimizeForMobile: true
}
```

## 🛠️ Implementação Técnica

### Estratégia 1: Screenshot Nativo (MELHOR QUALIDADE)
```typescript
async function exportEvolutionNative() {
  try {
    // 1. Preparar página para captura
    hideInteractiveElements();
    
    // 2. Usar API nativa do navegador
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { 
        mediaSource: 'screen',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });
    
    // 3. Capturar frame
    const canvas = await captureFrame(stream);
    
    // 4. Download automático
    downloadImage(canvas, 'evolucao-paciente.png');
    
  } catch (error) {
    fallbackToLibrary();
  }
}
```

### Estratégia 2: Biblioteca dom-to-image (FALLBACK)
```typescript
import * as domtoimage from 'dom-to-image-more';

async function exportEvolutionDomToImage() {
  const element = document.getElementById('evolution-container');
  
  const dataUrl = await domtoimage.toPng(element, {
    quality: 1.0,
    bgcolor: '#0f172a',
    width: element.offsetWidth * 2,
    height: element.offsetHeight * 2,
    style: {
      transform: 'scale(2)',
      transformOrigin: 'top left'
    }
  });
  
  downloadImage(dataUrl, 'evolucao-paciente.png');
}
```

### Estratégia 3: Geração PDF com jsPDF
```typescript
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

async function exportEvolutionPDF() {
  // 1. Capturar como canvas
  const canvas = await html2canvas(evolutionElement, {
    scale: 2,
    backgroundColor: '#0f172a',
    useCORS: true
  });
  
  // 2. Converter para PDF
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  
  // 3. Calcular dimensões
  const pdfWidth = 210; // A4
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  // 4. Adicionar imagem
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  // 5. Download
  pdf.save('evolucao-paciente.pdf');
}
```

## 🎯 Componente de Exportação Otimizado

### Estrutura do Container
```typescript
// Wrapper principal para exportação
<div 
  id="evolution-export-container"
  className="export-container"
  style={{
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    minHeight: '100vh',
    padding: '2rem',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}
>
  {/* Conteúdo da evolução */}
</div>
```

### CSS para Exportação
```css
/* Otimizações para exportação */
.export-container {
  /* Garantir renderização consistente */
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  
  /* Melhorar qualidade de texto */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Forçar renderização de gradientes */
  background-attachment: fixed;
}

/* Ocultar elementos interativos na exportação */
.hide-in-export {
  display: none !important;
}

/* Garantir que gráficos sejam renderizados */
canvas {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
```

## 📱 Responsividade na Exportação

### Layout Adaptativo
```typescript
const getExportLayout = () => {
  const isMobile = window.innerWidth < 768;
  
  return {
    containerWidth: isMobile ? '375px' : '1200px',
    gridCols: isMobile ? 2 : 6,
    fontSize: isMobile ? '14px' : '16px',
    padding: isMobile ? '1rem' : '2rem'
  };
};
```

## 🚀 Implementação no Portal

### 1. Adicionar Botão de Exportação
```typescript
// No header do portal
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="export-button">
      <Download className="w-4 h-4 mr-2" />
      Exportar Evolução
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={exportAsPNG}>
      📸 PNG Alta Qualidade
    </DropdownMenuItem>
    <DropdownMenuItem onClick={exportAsPDF}>
      📄 PDF Profissional
    </DropdownMenuItem>
    <DropdownMenuItem onClick={exportAsJPEG}>
      📱 JPEG Comprimido
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. Hook de Exportação
```typescript
const useEvolutionExport = () => {
  const [exporting, setExporting] = useState(false);
  
  const exportEvolution = async (format: 'png' | 'pdf' | 'jpeg') => {
    setExporting(true);
    
    try {
      switch (format) {
        case 'png':
          await exportAsPNG();
          break;
        case 'pdf':
          await exportAsPDF();
          break;
        case 'jpeg':
          await exportAsJPEG();
          break;
      }
      
      toast.success('Evolução exportada com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar evolução');
    } finally {
      setExporting(false);
    }
  };
  
  return { exportEvolution, exporting };
};
```

## 📊 Qualidade e Performance

### Otimizações de Qualidade
1. **Resolução 2x**: Dobrar escala para telas Retina
2. **Aguardar Renderização**: Delay para gráficos carregarem
3. **Filtrar Elementos**: Remover botões e elementos interativos
4. **Preservar Cores**: Manter gradientes e transparências

### Otimizações de Performance
1. **Lazy Loading**: Carregar bibliotecas sob demanda
2. **Debounce**: Evitar múltiplas exportações simultâneas
3. **Cleanup**: Limpar recursos após exportação
4. **Fallbacks**: Múltiplas estratégias de captura

## 🎨 Personalização Visual

### Temas de Exportação
```typescript
const exportThemes = {
  dark: {
    background: '#0f172a',
    text: '#ffffff',
    accent: '#00C98A'
  },
  light: {
    background: '#ffffff',
    text: '#1f2937',
    accent: '#059669'
  },
  print: {
    background: '#ffffff',
    text: '#000000',
    accent: '#374151'
  }
};
```

## 🔧 Troubleshooting

### Problemas Comuns
1. **Canvas com dimensões 0**: Aguardar renderização dos gráficos
2. **Gradientes não aparecem**: Usar `printBackground: true`
3. **Texto borrado**: Aumentar escala e usar antialiasing
4. **Elementos cortados**: Verificar overflow e dimensões

### Soluções
```typescript
// Aguardar gráficos carregarem
await new Promise(resolve => setTimeout(resolve, 2000));

// Verificar dimensões antes de capturar
const rect = element.getBoundingClientRect();
if (rect.width === 0 || rect.height === 0) {
  throw new Error('Elemento não renderizado');
}
```

## 📝 Próximos Passos

1. **Implementar componente de exportação**
2. **Adicionar botões no portal**
3. **Testar em diferentes dispositivos**
4. **Otimizar qualidade de gráficos**
5. **Adicionar opções de personalização**

---

**Resultado Final**: Portal do paciente com funcionalidade completa de exportação, mantendo layout idêntico e qualidade profissional para compartilhamento e impressão.