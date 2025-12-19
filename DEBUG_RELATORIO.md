# Debug do Relatório de Evolução

## Passos para Debug

### 1. Teste Básico
1. Abra o portal do paciente
2. Abra o console (F12)
3. Clique no menu (⋮) no canto superior direito
4. Clique em "Teste Debug"
5. Verifique se aparece no console:
   ```
   🧪 TESTE: Verificando elementos...
   Patient: {nome: "Lucas de Jesus Torres", ...}
   Portal ref: <div>...</div>
   Portal dimensions: {width: 1200, height: 800}
   ```

### 2. Teste de Captura
1. Clique em "Baixar Evolução PNG"
2. Verifique se aparece no console:
   ```
   🔥 Botão PNG clicado!
   🎯 Função handleExportEvolutionImage chamada
   🚀 Iniciando captura de imagem...
   👤 Paciente: Lucas de Jesus Torres
   📱 Portal ref: <div>...</div>
   ⏳ Aguardando 3 segundos...
   📸 Iniciando html2canvas...
   📏 Dimensões do elemento: {width: 1200, height: 800, ...}
   ```

### 3. Possíveis Problemas

**Se não aparecer nada no console:**
- O JavaScript pode estar sendo bloqueado
- Verifique se há erros na aba Console
- Tente recarregar a página

**Se aparecer erro de html2canvas:**
- Pode ser problema com imagens externas
- Pode ser problema com elementos SVG
- Pode ser problema de memória

**Se o canvas for 0x0:**
- Elementos não estão visíveis
- Problema de CSS ou layout
- Aguardar mais tempo para carregamento

### 4. Configurações Atuais

```typescript
// Configuração mais básica possível
const canvas = await html2canvas(portalRef.current, {
  scale: 0.8,           // Qualidade reduzida
  logging: true,        // Logs detalhados
  useCORS: false,       // Sem CORS
  allowTaint: false,    // Sem elementos "tainted"
  backgroundColor: '#0f172a'
});
```

### 5. Próximos Passos

**Se o teste básico funcionar:**
- ✅ Aumentar qualidade (scale)
- ✅ Adicionar filtros de conteúdo
- ✅ Melhorar tratamento de erros

**Se ainda der erro:**
- 🔧 Testar com html2canvas mais antigo
- 🔧 Testar com dom-to-image
- 🔧 Implementar captura manual

### 6. Alternativas

Se html2canvas não funcionar, podemos:
1. Usar dom-to-image
2. Usar puppeteer (server-side)
3. Implementar captura manual por seções
4. Usar API de screenshot do navegador

## Comandos de Debug

Execute no console para debug manual:

```javascript
// Verificar se html2canvas está disponível
console.log('html2canvas:', typeof html2canvas);

// Testar captura básica
const element = document.querySelector('[data-testid="portal-content"]');
if (element) {
  html2canvas(element, {scale: 0.5, logging: true})
    .then(canvas => console.log('Canvas:', canvas.width, 'x', canvas.height))
    .catch(err => console.error('Erro:', err));
}
```