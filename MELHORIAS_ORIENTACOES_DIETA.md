# Melhorias na Aba de Orientações - Plano de Dieta

## Mudanças Implementadas

### 1. ✅ Removido campo "Tipo de Orientação"

O campo de seleção "Tipo de Orientação" foi removido da interface. Agora todas as orientações são criadas com o tipo "general" por padrão.

**Antes:**
- Campo Select com opções: Geral, Hidratação, Suplementação, Horários, Preparação
- Usuário precisava selecionar o tipo manualmente

**Depois:**
- Campo removido da interface
- Tipo definido automaticamente como "general"
- Schema do Zod atualizado para tornar o campo opcional com valor padrão

### 2. ✅ Editor de Texto Rico com Visual Limpo

Implementado editor de texto rico para os campos "Título" e "Conteúdo" das orientações com visual profissional.

**Design:**
- **Caixa de texto branca**: Fundo branco (#ffffff) para melhor legibilidade
- **Ícones pretos**: Botões da toolbar com ícones pretos para contraste
- **Bordas cinzas**: Bordas sutis em cinza para aparência limpa

**Recursos do Editor:**
- **Negrito**: Botão para aplicar negrito no texto selecionado (Ctrl+B)
- **Itálico**: Botão para aplicar itálico no texto selecionado (Ctrl+I)
- **Cores**: Seletor de cores com 8 opções:
  - Preto (#000000)
  - Vermelho (#ef4444)
  - Laranja (#f97316)
  - Amarelo (#eab308)
  - Verde (#22c55e)
  - Azul (#3b82f6)
  - Roxo (#a855f7)
  - Rosa (#ec4899)
- **Links Clicáveis**: Botão para inserir links com:
  - Campo para texto do link (opcional)
  - Campo para URL (obrigatório)
  - Links abrem em nova aba
  - Estilo azul com sublinhado

**Implementação:**
- Novo componente: `RichTextEditor.tsx`
- Usa `contentEditable` do HTML5
- Comandos nativos do navegador (`document.execCommand`)
- Toolbar com botões de formatação
- Popover para seleção de cores
- Dialog para inserção de links

### 3. ✅ Campo de Conteúdo Redimensionável

O campo de conteúdo agora pode ser redimensionado verticalmente pelo usuário.

**Funcionalidade:**
- Arraste o canto inferior direito para aumentar/diminuir
- Altura mínima: 120px
- Altura máxima: 500px
- Scroll automático quando necessário
- Propriedade CSS `resize-y` aplicada

### 4. ✅ Título Dinâmico no Header do Card

O header do card agora exibe o título digitado pelo usuário ao invés de "Orientação 1", "Orientação 2", etc.

**Comportamento:**
- **Com título**: Exibe o texto digitado (sem formatação HTML)
- **Sem título**: Exibe "Orientação X" como fallback
- Atualização em tempo real conforme o usuário digita
- Extração de texto puro do HTML para exibição limpa

**Exemplo:**
```
Antes: "Orientação 1"
Depois: "Hidratação Diária" (se o usuário digitou isso no título)
```

### 5. ✅ Manter Usuário na Mesma Aba Após Salvar

Quando o usuário salva uma orientação em modo de edição, ele permanece na mesma aba ao invés de ser redirecionado.

**Comportamento Anterior:**
- Ao salvar, o modal fechava
- Usuário era redirecionado para outra página
- Perdia o contexto de edição

**Comportamento Novo:**
- **Modo Edição**: Ao salvar, o modal permanece aberto na mesma aba
  - Dados são recarregados automaticamente
  - Usuário pode continuar editando
  - Callback `onSaveSuccess` é chamado (se existir)
  
- **Modo Criação**: Ao salvar, o modal fecha normalmente
  - Comportamento mantido para novos planos
  - Usuário é redirecionado após criar

## Arquivos Modificados

### 1. `src/components/diets/RichTextEditor.tsx`
**Mudanças:**
- Adicionado botão de link com ícone `LinkIcon`
- Adicionado estado para dialog de link (`linkDialogOpen`, `linkUrl`, `linkText`)
- Função `insertLink()` para criar links HTML
- Popover com formulário para inserir links
- Propriedade `resizable` para permitir redimensionamento
- Visual atualizado: fundo branco, ícones pretos, bordas cinzas
- Estilos CSS para links clicáveis (azul, sublinhado, hover)

### 2. `src/components/diets/DietPlanForm.tsx`
**Mudanças:**
- Importado `RichTextEditor`
- Removido campo `guideline_type` da interface
- Substituído `Input` e `Textarea` por `RichTextEditor` nos campos de orientação
- Modificado `onSubmit` para manter usuário na mesma aba ao editar
- Atualizado schema do Zod para tornar `guideline_type` opcional
- Adicionada função `getTitleText()` para extrair texto puro do HTML
- Header do card agora usa `form.watch()` para exibir título dinâmico
- Propriedade `resizable={true}` no editor de conteúdo

**Linhas modificadas:**
- Import do RichTextEditor (linha ~45)
- Schema do Zod (linha ~157)
- Função onSubmit (linha ~1180)
- Renderização da aba de orientações (linha ~2178)

## Como Usar

### Adicionar Orientação com Formatação

1. Acesse a aba "Orientações" no formulário de dieta
2. Clique em "Adicionar Orientação"
3. No campo "Título":
   - Digite o texto (ex: "Hidratação Diária")
   - O header do card será atualizado automaticamente
   - Selecione o texto que deseja formatar
   - Clique em **B** para negrito ou **I** para itálico
   - Clique no ícone de paleta para escolher uma cor
4. No campo "Conteúdo":
   - Digite o texto
   - Formate com negrito, itálico ou cores
   - Clique no ícone de link para inserir um link:
     - Digite o texto do link (opcional)
     - Digite a URL (obrigatório)
     - Clique em "Inserir"
   - Arraste o canto inferior direito para aumentar o campo
5. Clique em "Salvar"

### Inserir Links Clicáveis

1. No editor de texto, clique no ícone de link (🔗)
2. Preencha os campos:
   - **Texto do link**: O que será exibido (ex: "Clique aqui")
   - **URL**: O endereço do link (ex: "https://exemplo.com")
3. Clique em "Inserir"
4. O link aparecerá em azul com sublinhado
5. Ao visualizar, o link será clicável e abrirá em nova aba

### Redimensionar Campo de Conteúdo

1. Posicione o cursor no canto inferior direito do campo de conteúdo
2. O cursor mudará para indicar redimensionamento
3. Arraste para cima ou para baixo
4. O campo se ajustará à altura desejada

### Editar Orientação Existente

1. Abra um plano de dieta existente
2. Vá para a aba "Orientações"
3. O header mostrará o título da orientação
4. Edite o título ou conteúdo usando o editor rico
5. Clique em "Salvar"
6. **Você permanecerá na mesma aba** para continuar editando

## Compatibilidade

### Orientações Antigas

Orientações criadas antes desta atualização:
- ✅ Continuam funcionando normalmente
- ✅ Texto simples é exibido corretamente
- ✅ Podem ser editadas e formatadas com o novo editor
- ✅ Tipo de orientação é preservado no banco de dados
- ✅ Título é extraído corretamente para exibição no header

### Armazenamento

- Formatação é salva como HTML no banco de dados
- Campos `title` e `content` armazenam HTML válido
- Links são salvos com atributos `target="_blank"` e `rel="noopener noreferrer"`
- Compatível com visualização em qualquer navegador moderno

## Benefícios

1. **Interface Mais Limpa**: Visual profissional com fundo branco e ícones pretos
2. **Formatação Rica**: Orientações mais claras e organizadas
3. **Links Clicáveis**: Referências externas diretas para o paciente
4. **Flexibilidade de Tamanho**: Campo redimensionável para textos longos
5. **Melhor UX**: Usuário não perde contexto ao salvar
6. **Título Dinâmico**: Header do card mostra o conteúdo real
7. **Cores e Estilos**: Destaque de informações importantes
8. **Produtividade**: Edição mais rápida sem sair da página

## Notas Técnicas

### Editor de Texto Rico

- Usa `contentEditable` nativo do HTML5
- Comandos de formatação via `document.execCommand`
- Suporte a atalhos de teclado (Ctrl+B, Ctrl+I)
- HTML sanitizado automaticamente pelo navegador
- Links com `target="_blank"` para segurança

### Redimensionamento

- Propriedade CSS `resize: vertical`
- Altura mínima: 100px (título) / 120px (conteúdo)
- Altura máxima: 500px
- Overflow automático com scroll

### Extração de Título

- Função `getTitleText()` remove tags HTML
- Usa `textContent` e `innerText` para compatibilidade
- Fallback para "Orientação X" se vazio
- Atualização reativa com `form.watch()`

### Persistência de Dados

- HTML é salvo diretamente no banco de dados
- Não há processamento adicional no backend
- Renderização direta no frontend
- Links mantêm atributos de segurança

### Performance

- Editor leve e rápido
- Sem dependências externas pesadas
- Renderização instantânea
- Redimensionamento suave

## Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

1. **Mais Opções de Formatação**:
   - Sublinhado
   - Listas (ordenadas e não ordenadas)
   - Tamanho de fonte
   - Alinhamento de texto

2. **Templates de Orientações**:
   - Orientações pré-formatadas
   - Biblioteca de orientações comuns

3. **Preview**:
   - Visualização de como ficará para o paciente
   - Modo de visualização vs modo de edição

4. **Histórico de Versões**:
   - Rastrear mudanças nas orientações
   - Desfazer/refazer alterações

5. **Validação de Links**:
   - Verificar se URL é válida
   - Preview do link antes de inserir
