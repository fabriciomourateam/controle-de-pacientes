# Instruções - Relatório de Evolução (PDF/PNG)

## Mudanças Implementadas

### 1. Correção do Erro do html2canvas

**Problema anterior:**
```
InvalidStateError: Failed to execute 'createPattern' on 'CanvasRenderingContext2D': 
The image argument is a canvas element with a width or height of 0.
```

**Solução implementada:**
- Adicionada função `waitForChartsToLoad()` que aguarda todos os gráficos carregarem antes de capturar
- Aumentado o tempo de espera de 2s para 3s para garantir renderização completa
- Adicionado filtro para ignorar canvas com largura/altura 0
- Melhorada a lógica de captura com verificação de elementos válidos

### 2. Conteúdo Incluído no Relatório

O relatório agora inclui apenas as seções essenciais:

✅ **Incluído:**
- 📊 Header "Meu Acompanhamento"
- 👤 Informações do paciente (nome, idade, check-ins)
- ⚖️ Cards de métricas (Peso Inicial, Peso Atual, Variação)
- 📈 Gráfico "Evolução do Peso"
- 🎯 Card "Composição Corporal Atual" (se houver bioimpedância)
- 📊 Gráfico "Evolução do % de Gordura Corporal" (se houver)
- 🎯 Gráfico "Evolução das Pontuações" (radar de categorias)

❌ **Excluído do relatório:**
- Botões de ação (Instalar PWA, Registrar Peso, Menu)
- Elementos interativos
- Frase motivacional do rodapé
- Componentes de dieta (se houver)
- Timeline e outros elementos extras

### 3. Classes CSS para Controle

Foram adicionadas classes CSS para controlar o que aparece no relatório:

- `.hide-in-export` - Oculta o elemento no PDF/PNG
- `.hide-in-pdf` - Oculta apenas no PDF (mantém no PNG)

**Exemplo de uso:**
```tsx
<div className="hide-in-export">
  {/* Este conteúdo não aparecerá no relatório */}
  <Button>Ação Interativa</Button>
</div>
```

## Como Testar

### 1. Teste Local (Desenvolvimento)

1. Acesse a página de evolução de um paciente
2. Clique em "Baixar Evolução" (PNG) ou "Baixar Evolução (PDF)"
3. Aguarde a geração (3-5 segundos)
4. Verifique se o arquivo foi baixado corretamente
5. Abra o arquivo e confirme que contém apenas as seções desejadas

### 2. Verificar Console

Durante a geração, o console mostrará:
```
🎯 Auto-download PNG detectado! Iniciando captura...
Tentativa 1: 3/3 canvas válidos
✅ Todos os gráficos carregados ou timeout atingido
📸 Capturando portal como PNG...
✅ Download iniciado! Fechando aba em 3 segundos...
```

### 3. Solução de Problemas

**Se ainda houver erro de canvas:**
1. Verifique se todos os gráficos estão visíveis na tela
2. Aguarde mais tempo antes de clicar em baixar
3. Verifique o console para ver quais canvas têm dimensões 0
4. Aumente o tempo de espera em `waitForChartsToLoad()` se necessário

**Se faltar conteúdo no relatório:**
1. Verifique se os componentes têm a classe `.hide-in-export`
2. Remova a classe dos elementos que devem aparecer
3. Adicione a classe aos elementos que devem ser ocultados

**Se o PDF/PNG estiver cortado:**
1. Ajuste o `windowWidth` em `html2canvas` (atualmente 1200px)
2. Ajuste o `scale` para melhor qualidade (atualmente 2)

## Customização Adicional

### Para adicionar mais conteúdo ao relatório:

1. Remova a classe `hide-in-export` do elemento desejado
2. Ou modifique a renderização condicional no PatientPortal.tsx

### Para melhorar a qualidade:

```typescript
const canvas = await html2canvas(portalRef.current, {
  scale: 3, // Aumentar para melhor qualidade (mais pesado)
  // ... outras opções
});
```

### Para ajustar o tamanho do PDF:

```typescript
const pdfWidth = 210; // A4 width in mm
const pdfHeight = 297; // A4 height in mm (se quiser página fixa)
```

## Arquivos Modificados

1. `src/pages/PatientPortal.tsx`
   - Adicionada função `waitForChartsToLoad()`
   - Adicionada função `handleExportEvolutionImage()`
   - Melhorada função `handleExportEvolutionPDF()`
   - Adicionadas classes `hide-in-export` nos botões

## Próximos Passos (Opcional)

- [ ] Adicionar logo da empresa no cabeçalho do relatório
- [ ] Incluir data de geração do relatório
- [ ] Adicionar rodapé com informações de contato
- [ ] Permitir escolher quais seções incluir (checkbox)
- [ ] Adicionar marca d'água personalizada
- [ ] Gerar relatório em múltiplas páginas A4 (ao invés de página contínua)

## Suporte

Se encontrar problemas:
1. Verifique o console do navegador para erros
2. Teste com diferentes pacientes (com e sem dados)
3. Verifique se os gráficos estão carregando corretamente
4. Aumente o tempo de espera se necessário
