# Solução Alternativa - dom-to-image

## Problema Persistente

Mesmo sem canvas visíveis, o html2canvas continua falhando. Isso indica que o problema pode estar em:
- Elementos SVG ocultos
- Imagens de fundo com problemas
- Elementos do Recharts que não são canvas diretos
- Problemas de CORS ou segurança

## Nova Solução Implementada

### 1. **dom-to-image como Primeira Opção**
```typescript
// Mais confiável que html2canvas
dataURL = await domtoimage.toPng(portalRef.current, {
  quality: 0.8,
  bgcolor: '#0f172a',
  filter: (element) => {
    // Filtrar elementos problemáticos
    if (element.tagName === 'CANVAS') {
      const canvas = element as HTMLCanvasElement;
      if (canvas.width === 0 || canvas.height === 0) {
        return false; // Não incluir
      }
    }
    return true; // Incluir
  }
});
```

### 2. **Fallback Triplo**
- **Tentativa 1:** dom-to-image (mais confiável)
- **Tentativa 2:** html2canvas básico (sem SVG/canvas)
- **Tentativa 3:** html2canvas ultra-simples (só texto)

### 3. **Teste Simples**
- Botão "Teste Simples" que captura apenas o header
- Verifica se a biblioteca funciona no ambiente

## Como Testar

### 1. **Teste Básico**
1. Clique em "Teste Simples"
2. Deve baixar "teste-header.png"
3. Se funcionar = biblioteca OK

### 2. **Teste Completo**
1. Clique em "Baixar Evolução PNG"
2. Observe os logs:
   ```
   🎯 Tentativa 1: dom-to-image...
   ✅ dom-to-image funcionou!
   ✅ Imagem gerada com sucesso!
   📏 Tamanho da imagem: 245 KB
   ```

### 3. **Se Falhar**
```
❌ dom-to-image falhou, tentando html2canvas...
🎯 Tentativa 2: html2canvas básico...
✅ html2canvas funcionou como fallback!
```

## Vantagens do dom-to-image

✅ **Mais confiável** com elementos complexos
✅ **Melhor suporte** a SVG e CSS
✅ **Menos problemas** com canvas
✅ **API mais simples** de usar
✅ **Melhor qualidade** de renderização

## Configurações Atuais

### dom-to-image:
```typescript
{
  quality: 0.8,        // Boa qualidade
  bgcolor: '#0f172a',  // Fundo escuro
  filter: (element) => // Filtro customizado
}
```

### html2canvas (fallback):
```typescript
{
  scale: 0.5,          // Qualidade reduzida
  ignoreElements: (element) => {
    return element.tagName === 'CANVAS' || 
           element.tagName === 'SVG' ||
           element.classList.contains('recharts-wrapper');
  }
}
```

## Próximos Passos

1. **Teste a nova solução**
2. **Se funcionar:** Melhorar qualidade e filtros
3. **Se falhar:** Implementar captura por seções
4. **Customizar conteúdo** conforme necessário

## Troubleshooting

**Se dom-to-image falhar:**
- Pode ser problema de segurança/CORS
- Tentar com configurações diferentes
- Usar html2canvas como fallback

**Se ambos falharem:**
- Implementar captura manual por seções
- Usar screenshot server-side
- Simplificar ainda mais o conteúdo

**Para debug adicional:**
```javascript
// Testar dom-to-image manualmente
import * as domtoimage from 'dom-to-image-more';

const element = document.querySelector('h1');
domtoimage.toPng(element)
  .then(dataUrl => console.log('Sucesso:', dataUrl.length))
  .catch(error => console.error('Erro:', error));
```