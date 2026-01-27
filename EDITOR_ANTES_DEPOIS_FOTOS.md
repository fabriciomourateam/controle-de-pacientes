# 📸 Editor de Comparação Antes/Depois - Fotos Lado a Lado

## 🎯 O Que Foi Criado

Um novo editor visual que permite comparar e ajustar **duas fotos lado a lado** (Antes e Depois), com controles intuitivos de zoom e posicionamento através de **arrastar e soltar**.

## ✨ Funcionalidades

### 1. Seleção de Fotos
- **Dropdown "Foto ANTES"**: Escolha a foto inicial (baseline ou check-in antigo)
- **Dropdown "Foto DEPOIS"**: Escolha a foto final (check-in mais recente)
- Todas as fotos disponíveis aparecem nos dropdowns com data e peso

### 2. Visualização Lado a Lado
- **Duas fotos grandes** exibidas simultaneamente
- **Comparação visual direta** entre antes e depois
- **Containers de 500px de altura** para visualização confortável
- **Fundo cinza** para destacar as fotos

### 3. Controles de Zoom
- **Botões +/- (ZoomIn/ZoomOut)** para cada foto
- **Zoom independente** de 0.5x a 3.0x
- **Indicador visual** mostrando nível de zoom atual
- **Zoom suave** com transições

### 4. Arrastar e Posicionar
- **Clique e arraste** diretamente na foto para reposicionar
- **Cursor "move"** indica que pode arrastar
- **Movimento fluido** em tempo real
- **Posicionamento independente** para cada foto
- **Sem limites** - pode arrastar para qualquer direção

### 5. Controle de Visibilidade
- **Badge** mostrando se foto está visível/oculta
- **Botão toggle** para mostrar/ocultar cada foto
- **Feedback visual** com ícones Eye/EyeOff
- **Cores diferentes** (verde=visível, vermelho=oculta)

### 6. Botão Reset
- **Resetar zoom e posição** de cada foto individualmente
- **Volta ao padrão** (zoom 1x, posição centralizada)
- **Ícone RotateCcw** para clareza

### 7. Salvar Configurações
- **Botão "Salvar Configurações"** no footer
- **Salva ambas as fotos** de uma vez
- **Persistência no banco** de dados
- **Toast de confirmação** após salvar
- **Callback** para recarregar dados

## 🎨 Interface

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Editor de Comparação - Antes e Depois                  │
│  Selecione duas fotos, ajuste zoom e posição...         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Dropdown: Foto ANTES]    [Dropdown: Foto DEPOIS]      │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │  ANTES               │  │  DEPOIS              │    │
│  │  22/01/2025 • 80kg   │  │  26/01/2025 • 75kg   │    │
│  │  [Visível] [Ocultar] │  │  [Visível] [Ocultar] │    │
│  ├──────────────────────┤  ├──────────────────────┤    │
│  │                      │  │                      │    │
│  │   [FOTO GRANDE]      │  │   [FOTO GRANDE]      │    │
│  │   Zoom: 1.2x         │  │   Zoom: 1.5x         │    │
│  │   (arraste aqui)     │  │   (arraste aqui)     │    │
│  │                      │  │                      │    │
│  ├──────────────────────┤  ├──────────────────────┤    │
│  │  [-] [+]   [Reset]   │  │  [-] [+]   [Reset]   │    │
│  └──────────────────────┘  └──────────────────────┘    │
│                                                          │
│  💡 Dica: Clique e arraste as fotos para reposicionar   │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Cancelar]                    [Salvar Configurações]   │
└─────────────────────────────────────────────────────────┘
```

### Cores
- **Antes**: Borda azul/slate
- **Depois**: Borda azul/slate
- **Botão Antes/Depois**: Verde esmeralda (emerald)
- **Botão Configurar**: Azul
- **Visível**: Verde (default badge)
- **Oculta**: Vermelho (destructive badge)

## 🚀 Como Usar

### Para o Nutricionista:

1. **Abrir o Editor**
   - Vá para a página de evolução do paciente
   - Clique no botão **"Antes/Depois"** (verde) no header

2. **Selecionar Fotos**
   - Escolha a foto "ANTES" no dropdown esquerdo
   - Escolha a foto "DEPOIS" no dropdown direito

3. **Ajustar Zoom**
   - Clique nos botões **[-]** e **[+]** para zoom out/in
   - Ou use o botão **"Reset"** para voltar ao padrão

4. **Reposicionar Fotos**
   - **Clique e arraste** diretamente na foto
   - Mova para cima/baixo/esquerda/direita
   - Solte o mouse para fixar a posição

5. **Controlar Visibilidade**
   - Clique em **"Ocultar"** para esconder a foto do paciente
   - Clique em **"Mostrar"** para torná-la visível novamente

6. **Salvar**
   - Clique em **"Salvar Configurações"**
   - Aguarde a confirmação
   - As configurações serão aplicadas no portal do paciente

### Para o Paciente:

- Verá as fotos com zoom e posição ajustados
- Apenas fotos marcadas como "visíveis" aparecem
- Não tem acesso ao editor

## 🔧 Implementação Técnica

### Arquivo Criado
- `src/components/evolution/PhotoComparisonEditor.tsx`

### Arquivos Modificados
- `src/components/evolution/PhotoComparison.tsx`
  - Adicionado import do novo componente
  - Adicionado estado `showComparisonEditor`
  - Adicionado botão "Antes/Depois" no header
  - Renderizado o modal no final

### Tecnologias Usadas
- **React Hooks**: useState, useRef, useEffect
- **Drag & Drop**: Mouse events (onMouseDown, onMouseMove, onMouseUp)
- **Transform CSS**: scale() e translate() para zoom e posição
- **Shadcn/ui**: Dialog, Button, Select, Badge
- **Custom Hook**: usePhotoVisibility
- **TypeScript**: Tipagem forte

### Estados Gerenciados
```typescript
interface PhotoState {
  zoom: number;        // 0.5 a 3.0
  x: number;           // Posição X em pixels
  y: number;           // Posição Y em pixels
  isDragging: boolean; // Se está arrastando
  dragStart: { x, y }; // Ponto inicial do drag
}
```

### Lógica de Drag
1. **onMouseDown**: Captura posição inicial, ativa dragging
2. **onMouseMove**: Calcula nova posição baseada no movimento
3. **onMouseUp**: Desativa dragging, fixa posição
4. **onMouseLeave**: Desativa dragging se sair do container

### Salvamento
- Converte pixels para porcentagem (dividindo por 4)
- Salva zoom_level, position_x, position_y
- Usa `updateSetting()` do hook
- Salva ambas as fotos simultaneamente com Promise.all()

## 📊 Comparação com Modal Anterior

### Modal Anterior (PhotoVisibilityModal)
- ✅ Lista de todas as fotos
- ✅ Toggle individual de visibilidade
- ✅ Sliders de zoom e posição
- ✅ Preview pequeno
- ❌ Edita uma foto por vez
- ❌ Não permite arrastar
- ❌ Difícil comparar antes/depois

### Novo Editor (PhotoComparisonEditor)
- ✅ Duas fotos lado a lado
- ✅ Comparação visual direta
- ✅ Arrastar e soltar intuitivo
- ✅ Zoom com botões simples
- ✅ Preview grande (500px)
- ✅ Edita duas fotos simultaneamente
- ✅ Foco em antes/depois
- ❌ Não mostra lista completa

### Quando Usar Cada Um?

**Use o Editor Antes/Depois quando:**
- Quer criar uma comparação específica
- Precisa ajustar duas fotos juntas
- Quer ver o resultado lado a lado
- Foco em transformação visual

**Use o Modal de Configuração quando:**
- Quer gerenciar todas as fotos
- Precisa ocultar várias fotos
- Quer ajustes precisos com sliders
- Foco em controle granular

## 🎯 Benefícios

### Para o Nutricionista:
1. **Mais rápido**: Ajusta duas fotos de uma vez
2. **Mais intuitivo**: Arrastar é mais natural que sliders
3. **Melhor visualização**: Vê o resultado final lado a lado
4. **Foco em resultados**: Cria comparações impactantes

### Para o Paciente:
1. **Motivação**: Vê transformação clara
2. **Profissional**: Fotos bem ajustadas
3. **Impacto visual**: Antes/depois otimizado
4. **Confiança**: Resultados bem apresentados

## 🔄 Fluxo Completo

```
1. Nutricionista abre página de evolução
   ↓
2. Clica em "Antes/Depois" (botão verde)
   ↓
3. Modal abre com primeira e última foto
   ↓
4. Seleciona fotos específicas nos dropdowns
   ↓
5. Arrasta e ajusta zoom de cada foto
   ↓
6. Clica em "Salvar Configurações"
   ↓
7. Sistema salva no banco de dados
   ↓
8. Paciente vê fotos ajustadas no portal
   ↓
9. Impacto visual maximizado! 🎉
```

## 📝 Notas Técnicas

### Performance
- **Transições suaves**: CSS transitions apenas quando não está arrastando
- **Drag otimizado**: Usa transform ao invés de position
- **Imagens otimizadas**: object-contain para manter proporção
- **Lazy loading**: Fotos carregam sob demanda

### Acessibilidade
- **Cursor visual**: Muda para "move" ao passar sobre foto
- **Feedback visual**: Indicador de zoom sempre visível
- **Botões claros**: Ícones + texto descritivo
- **Cores contrastantes**: Fácil identificar estados

### Responsividade
- **Grid 2 colunas**: Lado a lado em desktop
- **Altura fixa**: 500px para consistência
- **Max-width**: 95vw para não ultrapassar tela
- **Scroll**: Ativa se necessário

## 🐛 Troubleshooting

### Foto não arrasta?
- Verifique se o cursor muda para "move"
- Tente clicar e segurar antes de arrastar
- Certifique-se que não está sobre um botão

### Zoom não funciona?
- Verifique se chegou no limite (0.5x ou 3.0x)
- Tente usar o botão Reset primeiro
- Recarregue a página se necessário

### Configurações não salvam?
- Verifique se executou o SQL da tabela
- Veja o console (F12) para erros
- Confirme que está logado

### Fotos não aparecem ajustadas no portal?
- Aguarde 1-2 minutos (cache)
- Recarregue o portal com Ctrl+F5
- Verifique se salvou as configurações

## 🎉 Resultado Final

Agora você tem **dois editores complementares**:

1. **Editor Antes/Depois** (NOVO)
   - Comparação lado a lado
   - Arrastar e soltar
   - Foco em transformação

2. **Modal de Configuração** (EXISTENTE)
   - Gerenciamento completo
   - Controle granular
   - Todas as fotos

**Use ambos conforme a necessidade!** 🚀

## 📚 Documentação Relacionada

- `IMPLEMENTACAO_ITENS_4_6_8_FOTOS.md` - Sistema completo de fotos
- `RESUMO_ALTERACOES_FOTOS_V2.md` - Alterações v2
- `EXECUTAR_AGORA_SQL_FOTOS.md` - Como executar SQL
- `CORRECAO_SQL_FOTOS.md` - Correção de erros

---

**Status:** ✅ Implementado e pronto para uso!
**Versão:** 1.0
**Data:** 26/01/2025
