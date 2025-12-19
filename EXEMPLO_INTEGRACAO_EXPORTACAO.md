# 🔧 Exemplo de Integração: Exportação de Evolução

## 📝 Como Integrar no Portal do Paciente

### 1. Atualizar PatientPortal.tsx

```typescript
// Adicionar imports
import { ExportableEvolutionView } from '@/components/evolution/ExportableEvolutionView';
import { useRef } from 'react';

export default function PatientPortal() {
  // ... código existente ...
  
  // Adicionar ref para o container de exportação
  const evolutionRef = useRef<HTMLDivElement>(null);
  
  // ... resto do código ...
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ... header existente ... */}
      
      {/* Substituir a seção de evolução por: */}
      {patient && checkins.length > 0 && (
        <ExportableEvolutionView
          ref={evolutionRef}
          patient={patient}
          checkins={checkins}
          bodyCompositions={bodyCompositions}
          achievements={achievements}
          refreshTrigger={chartsRefreshTrigger}
          showExportButton={true}
        />
      )}
      
      {/* ... resto do código ... */}
    </div>
  );
}
```

### 2. Atualizar PatientEvolutionTab.tsx

```typescript
// Adicionar no componente PatientEvolutionTab
import { ExportableEvolutionView } from '@/components/evolution/ExportableEvolutionView';
import { useRef } from 'react';

export function PatientEvolutionTab({ ... }) {
  const evolutionRef = useRef<HTMLDivElement>(null);
  
  // ... código existente ...
  
  return (
    <ExportableEvolutionView
      ref={evolutionRef}
      patient={patient}
      checkins={checkins}
      bodyCompositions={bodyCompositions}
      achievements={achievements}
      refreshTrigger={refreshTrigger}
      showExportButton={true}
    />
  );
}
```

### 3. CSS Adicional (globals.css)

```css
/* Otimizações para exportação */
.export-container {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-attachment: fixed;
}

/* Ocultar elementos na exportação */
.hide-in-export {
  display: block;
}

@media print {
  .hide-in-export {
    display: none !important;
  }
}

/* Garantir renderização de canvas */
canvas {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* Melhorar qualidade de gradientes */
.gradient-export {
  background-attachment: fixed;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
```

## 🎯 Funcionalidades Implementadas

### ✅ Formatos de Exportação
1. **📸 Screenshot Nativo** (Recomendado)
   - Máxima qualidade possível
   - Usa API nativa do navegador
   - Resolução Full HD (1920x1080)

2. **🖼️ PNG Alta Qualidade**
   - Preserva transparências e gradientes
   - Escala 2x para telas Retina
   - Fallback automático se screenshot nativo falhar

3. **📄 PDF Profissional**
   - Formato A4 otimizado
   - Ideal para impressão
   - Mantém proporções originais

4. **📱 JPEG Comprimido**
   - Otimizado para WhatsApp/redes sociais
   - Menor tamanho de arquivo
   - Boa qualidade visual

### ✅ Elementos Exportados
- ✅ Header com título e descrição
- ✅ Card de informações do paciente
- ✅ Grid de métricas (Check-ins, Idade, Pesos, Variação)
- ✅ Composição corporal (se disponível)
- ✅ Gráficos de evolução do peso
- ✅ Gráfico de % gordura corporal
- ✅ Análise inteligente com IA
- ✅ Footer com data/hora de geração
- ✅ Background com gradientes preservados

### ✅ Otimizações
- ✅ Aguarda renderização completa dos gráficos
- ✅ Remove elementos interativos automaticamente
- ✅ Múltiplas estratégias de captura (fallbacks)
- ✅ Nomes de arquivo inteligentes com data
- ✅ Feedback visual durante exportação
- ✅ Tratamento de erros robusto

## 🚀 Como Usar

### Para o Paciente:
1. Acessa o portal do paciente
2. Vai na aba "Minha Evolução"
3. Clica no botão "Exportar"
4. Escolhe o formato desejado:
   - **Screenshot Nativo**: Para máxima qualidade
   - **PNG**: Para uso digital
   - **PDF**: Para impressão/relatórios
   - **JPEG**: Para WhatsApp/redes sociais

### Para o Nutricionista:
1. Pode gerar relatórios para enviar aos pacientes
2. Usar em consultas presenciais
3. Anexar em prontuários digitais
4. Compartilhar progresso com outros profissionais

## 📊 Exemplo de Resultado

O arquivo exportado terá:
- **Nome**: `evolucao-joao-silva-2024-12-18.png`
- **Qualidade**: HD (1920x1080 ou superior)
- **Conteúdo**: Layout idêntico ao portal
- **Tamanho**: 2-5MB (PNG), 500KB-1MB (JPEG), 1-3MB (PDF)

## 🔧 Personalização Avançada

### Adicionar Marca D'água
```typescript
// No ExportableEvolutionView.tsx
<div className="absolute bottom-4 right-4 opacity-30">
  <img src="/logo.png" alt="Logo" className="w-16 h-16" />
</div>
```

### Temas Personalizados
```typescript
const exportThemes = {
  dark: { background: '#0f172a', text: '#ffffff' },
  light: { background: '#ffffff', text: '#1f2937' },
  print: { background: '#ffffff', text: '#000000' }
};
```

### Resolução Customizada
```typescript
// Para diferentes qualidades
const resolutions = {
  hd: { width: 1920, height: 1080, scale: 2 },
  fullhd: { width: 2560, height: 1440, scale: 2.5 },
  uhd: { width: 3840, height: 2160, scale: 3 }
};
```

## 🎯 Próximos Passos

1. **Testar em diferentes navegadores**
2. **Otimizar para mobile**
3. **Adicionar opções de personalização**
4. **Implementar cache de imagens**
5. **Adicionar analytics de uso**

---

**Resultado**: Portal do paciente com exportação profissional de relatórios de evolução, mantendo layout idêntico e qualidade máxima para todos os formatos.