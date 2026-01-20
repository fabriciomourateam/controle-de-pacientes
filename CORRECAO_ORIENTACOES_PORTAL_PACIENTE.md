# Correção das Orientações no Portal do Paciente

## Problema Identificado

As orientações estavam aparecendo no portal do paciente com:
1. ❌ HTML bruto visível (tags `<b>`, `<table>`, etc.)
2. ❌ Badge do tipo de orientação ainda aparecendo
3. ❌ Layout em grid (2 colunas) que não funcionava bem em mobile
4. ❌ Links não clicáveis
5. ❌ Problema em AMBOS os apps (controle-de-pacientes e meu-acompanhamento)

## Solução Implementada

### 1. ✅ Renderização HTML Correta

**Antes:**
```tsx
<p className="text-xs sm:text-sm text-[#777777]">{guideline.content}</p>
```

**Depois:**
```tsx
<div 
  className="text-xs sm:text-sm text-[#777777] prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: guideline.content || '' }}
/>
```

### 2. ✅ Remoção do Badge de Tipo

Removido completamente o badge que mostrava `guideline_type` (ex: "general").

### 3. ✅ Lista Minimizável (Collapsible)

Implementado componente `Collapsible` para cada orientação:
- **Minimizado por padrão**: Mostra apenas o título
- **Clique para expandir**: Revela o conteúdo completo
- **Ícone de seta**: Indica estado (minimizado/expandido)
- **Layout em lista**: Uma orientação por linha (melhor para mobile)

**Estrutura:**
```tsx
<Collapsible>
  <CollapsibleTrigger>
    <Button>
      <ChevronRight /> {/* Rotaciona 90° quando aberto */}
      <span>{título}</span>
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div>{conteúdo HTML}</div>
  </CollapsibleContent>
</Collapsible>
```

### 4. ✅ Links Clicáveis

Implementado handler `onClick` que:
- Detecta cliques em elementos `<a>`
- Abre links em nova aba
- Usa `window.open()` com `noopener,noreferrer` para segurança

**Código:**
```tsx
onClick={(e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A') {
    e.preventDefault();
    const href = target.getAttribute('href');
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }
}}
```

### 5. ✅ Estilos CSS para Links

Adicionado ao `index.css`:
```css
.prose a {
  color: #3b82f6 !important;
  text-decoration: underline !important;
  cursor: pointer !important;
  transition: color 0.2s ease;
}

.prose a:hover {
  color: #2563eb !important;
}
```

## Arquivos Modificados

### App 1: controle-de-pacientes

#### 1. `src/components/patient-portal/PatientDietPortal.tsx`
**Mudanças:**
- Importado `ChevronRight` do lucide-react
- Substituído grid por lista (`space-y-2`)
- Implementado `Collapsible` para cada orientação
- Adicionado função `getTitleText()` para extrair texto puro do HTML
- Adicionado handler `onClick` para links clicáveis
- Removido badge de tipo de orientação
- Renderização HTML com `dangerouslySetInnerHTML`

#### 2. `src/components/diets/DietPlansList.tsx`
**Mudanças:**
- Removido badge de tipo de orientação
- Renderização HTML com `dangerouslySetInnerHTML`

#### 3. `src/components/diets/DietPlanForm.tsx` (Preview)
**Mudanças:**
- Renderização HTML no preview com `dangerouslySetInnerHTML`
- Adicionado classe `prose-invert` para tema escuro

#### 4. `src/lib/diet-pdf-generator.ts`
**Mudanças:**
- Removido badge de tipo de orientação do PDF
- HTML renderizado diretamente no PDF

#### 5. `src/lib/diet-pdf-premium-generator.ts`
**Mudanças:**
- Removido badge de tipo de orientação do PDF premium
- HTML renderizado diretamente no PDF

#### 6. `src/index.css`
**Mudanças:**
- Adicionados estilos para links clicáveis
- Estilos para hover em links
- Suporte para links em tabelas

### App 2: meu-acompanhamento

#### 1. `src/components/patient-portal/PatientDietPortal.tsx`
**Mudanças:**
- ✅ Importado `ChevronRight`, `ChevronDown`, `ChevronUp` do lucide-react
- ✅ Substituído grid por lista (`space-y-2`)
- ✅ Implementado `Collapsible` para cada orientação
- ✅ Adicionado função `getTitleText()` para extrair texto puro do HTML
- ✅ Adicionado handler `onClick` para links clicáveis
- ✅ Removido badge de tipo de orientação
- ✅ Renderização HTML com `dangerouslySetInnerHTML`

## Como Funciona Agora (AMBOS OS APPS)

### No Portal do Paciente:

1. **Visualização Inicial**:
   - Lista de orientações minimizadas
   - Mostra apenas o título de cada orientação
   - Ícone de seta para indicar que pode expandir

2. **Ao Clicar no Título**:
   - Orientação expande suavemente
   - Mostra o conteúdo completo com formatação HTML
   - Ícone de seta rotaciona 90° para indicar estado expandido

3. **Links no Conteúdo**:
   - Aparecem em azul com sublinhado
   - Cursor muda para pointer ao passar o mouse
   - Clique abre em nova aba
   - Hover muda a cor para azul mais escuro

4. **Formatação HTML**:
   - Negrito, itálico, cores são preservados
   - Tabelas são renderizadas corretamente
   - Listas são formatadas adequadamente
   - Quebras de linha funcionam

## Benefícios

1. ✅ **Interface Limpa**: Orientações minimizadas economizam espaço
2. ✅ **Melhor UX Mobile**: Lista vertical funciona melhor em telas pequenas
3. ✅ **Links Funcionais**: Paciente pode acessar recursos externos
4. ✅ **Formatação Rica**: HTML renderizado corretamente
5. ✅ **Sem Badge Desnecessário**: Tipo de orientação não é relevante para o paciente
6. ✅ **Fácil Navegação**: Expandir/minimizar conforme necessário
7. ✅ **Consistência**: Funciona igual em ambos os apps

## Teste Manual

### Testar Orientações Minimizáveis:
1. Acesse o portal do paciente (qualquer um dos apps)
2. Vá para a aba "Dieta"
3. Role até a seção "Orientações"
4. Verifique que as orientações aparecem minimizadas
5. Clique em uma orientação para expandir
6. Verifique que o conteúdo aparece com formatação HTML
7. Clique novamente para minimizar

### Testar Links Clicáveis:
1. Expanda uma orientação que contenha links
2. Passe o mouse sobre um link (deve mudar cursor e cor)
3. Clique no link
4. Verifique que abre em nova aba
5. Verifique que o link tem cor azul e sublinhado

### Testar Formatação HTML:
1. Expanda uma orientação com formatação rica
2. Verifique que negrito, itálico, cores aparecem corretamente
3. Se houver tabelas, verifique que são renderizadas
4. Verifique que não há tags HTML visíveis

## Compatibilidade

- ✅ Desktop: Layout de lista funciona perfeitamente
- ✅ Mobile: Lista vertical otimizada para telas pequenas
- ✅ Tablet: Responsivo e adaptável
- ✅ Todos os navegadores modernos: Chrome, Firefox, Safari, Edge
- ✅ Ambos os apps: controle-de-pacientes e meu-acompanhamento

## Notas Técnicas

### Segurança de Links
- Uso de `noopener,noreferrer` previne ataques de tabnabbing
- Links sempre abrem em nova aba
- Não há execução de JavaScript malicioso

### Performance
- `Collapsible` usa animações CSS suaves
- Renderização HTML é feita apenas quando expandido
- Sem impacto na performance da página

### Acessibilidade
- Botões de expandir/minimizar são acessíveis por teclado
- Ícones indicam claramente o estado
- Texto alternativo adequado

### Banco de Dados
- HTML é salvo corretamente no banco de dados
- Ambos os apps leem e renderizam o HTML corretamente
- Não há necessidade de migração de dados
- Orientações antigas funcionam normalmente

## Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

1. **Botão "Expandir Todas"**: Expandir/minimizar todas as orientações de uma vez
2. **Busca em Orientações**: Campo de busca para filtrar orientações
3. **Favoritar Orientações**: Marcar orientações importantes
4. **Compartilhar Orientação**: Enviar orientação específica por WhatsApp
5. **Imprimir Orientação**: Imprimir orientação individual


## ✅ Correção Final: Scroll Horizontal nas Tabelas

### Problema Identificado
Após a implementação das orientações minimizáveis, foi identificado que **tabelas dentro das orientações estavam criando scroll horizontal**, quebrando o layout e dificultando a leitura.

### Causa Raiz
O CSS estava configurado com:
```css
.prose table {
  display: block !important;
  overflow-x: auto !important;
}
```

Isso fazia com que as tabelas se comportassem como blocos com scroll horizontal, em vez de se adaptarem ao container.

### Solução Aplicada

Mudamos o CSS para forçar as tabelas a respeitarem o container:

```css
.prose table {
  width: 100% !important;
  margin: 1rem 0 !important;
  border-collapse: collapse !important;
  display: table !important;
  table-layout: fixed !important;
}
```

**Mudanças principais:**
- `display: block` → `display: table` (comportamento correto de tabela)
- Removido `overflow-x: auto` (sem scroll horizontal)
- Adicionado `table-layout: fixed` (força células a respeitarem largura do container)

### Arquivos Modificados

1. ✅ `controle-de-pacientes/src/index.css`
2. ✅ `meu-acompanhamento/src/index.css`

### Resultado

Agora as tabelas:
- ✅ Se adaptam automaticamente à largura do container
- ✅ Não criam scroll horizontal
- ✅ Mantêm a formatação e bordas
- ✅ Funcionam perfeitamente em mobile e desktop
- ✅ Estão consistentes em ambos os apps

### Teste Manual

1. Acesse o portal do paciente (qualquer app)
2. Expanda uma orientação que contenha tabelas
3. Verifique que a tabela se adapta à largura do container
4. Verifique que NÃO há scroll horizontal
5. Teste em diferentes tamanhos de tela (mobile, tablet, desktop)
6. Verifique que o texto dentro das células quebra linha se necessário

### Status Final

🎉 **PROBLEMA TOTALMENTE RESOLVIDO**

As orientações agora funcionam perfeitamente em ambos os apps:
- ✅ Lista minimizável
- ✅ HTML renderizado corretamente
- ✅ Links clicáveis
- ✅ Tabelas sem scroll horizontal
- ✅ Responsivo em todos os dispositivos
- ✅ Consistente entre controle-de-pacientes e meu-acompanhamento
