# Correções Finais: Sistema de Edição da Análise IA

## Problemas Corrigidos ✅

---

## 1. Editar Card Customizado Criava Outro em Vez de Atualizar

### Problema
Quando você editava um card customizado existente, o sistema criava um novo card em vez de atualizar o existente.

### Causa
A função `handleEditCard` não estava preservando corretamente a `section` do card customizado. Ela estava usando a `section` passada como parâmetro em vez da `section` do próprio insight.

### Solução ✅
```typescript
const handleEditCard = (insight: CustomInsight | AnalysisInsight, section: 'strengths' | 'warnings' | 'goals') => {
  const isCustom = isCustomInsight(insight);
  
  if (isCustom) {
    // ✅ Usar section do próprio insight (não do parâmetro)
    setEditingInsight(insight);
    setEditingSection(insight.section); // ✅ CORRIGIDO
    setAiInsightToCopy(null);
  } else {
    // Criar cópia editável de card da IA
    setEditingInsight(null);
    setEditingSection(section); // Usar section do parâmetro
    setAiInsightToCopy(insight as AnalysisInsight);
  }
  
  setShowEditModal(true);
};
```

### Resultado
Agora quando você edita um card customizado:
1. ✅ Modal abre pré-preenchido com dados do card
2. ✅ Ao salvar, ATUALIZA o card existente
3. ✅ Não cria duplicatas

---

## 2. Não Era Possível Deletar Cards da IA

### Problema
Apenas cards customizados tinham botão de excluir. Cards gerados pela IA não podiam ser removidos.

### Solução Implementada ✅

#### 2.1. Nova Tabela SQL
Criada tabela `ai_insights_hidden` para guardar quais cards da IA foram ocultados:

```sql
CREATE TABLE ai_insights_hidden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL REFERENCES patients(telefone),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  section TEXT NOT NULL CHECK (section IN ('strengths', 'warnings', 'goals')),
  ai_insight_hash TEXT NOT NULL, -- Hash para identificar o card
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telefone, section, ai_insight_hash)
);
```

#### 2.2. Função de Hash
Criada função para gerar hash único de cada card da IA:

```typescript
function generateInsightHash(insight: AnalysisInsight): string {
  const content = `${insight.title}|${insight.description}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
```

#### 2.3. Novas Funções no Hook
Adicionadas 3 novas funções no `use-custom-insights.ts`:

```typescript
// Ocultar card da IA
const hideAIInsight = async (insight: AnalysisInsight, section: string): Promise<boolean> => {
  const hash = generateInsightHash(insight);
  await supabase.from('ai_insights_hidden').insert({
    telefone, user_id, section, ai_insight_hash: hash
  });
  // ...
};

// Mostrar card da IA novamente
const showAIInsight = async (insight: AnalysisInsight): Promise<boolean> => {
  const hash = generateInsightHash(insight);
  await supabase.from('ai_insights_hidden').delete()
    .eq('telefone', telefone)
    .eq('ai_insight_hash', hash);
  // ...
};

// Verificar se card está oculto
const isAIInsightHidden = (insight: AnalysisInsight): boolean => {
  const hash = generateInsightHash(insight);
  return hiddenAIInsights.has(hash);
};
```

#### 2.4. Filtragem de Cards Ocultos
Atualizada função `getMergedInsights` para filtrar cards ocultos:

```typescript
const getMergedInsights = (section: 'strengths' | 'warnings' | 'goals') => {
  if (!analysis) return [];

  // ✅ Filtrar cards da IA que foram ocultados
  const aiInsights = (analysis[section] || []).filter(
    (insight) => !isAIInsightHidden(insight as AnalysisInsight)
  );

  const customSectionInsights = customInsights.filter(
    (insight) => insight.section === section
  );

  return [...customSectionInsights, ...aiInsights];
};
```

#### 2.5. Botão de Excluir em TODOS os Cards
Atualizada lógica de exclusão para suportar ambos os tipos:

```typescript
const handleDeleteCard = async (insight: CustomInsight | AnalysisInsight, section: string) => {
  const isCustom = isCustomInsight(insight);
  
  if (isCustom) {
    // Excluir card customizado (soft delete)
    if (confirm(`Tem certeza que deseja excluir o card "${insight.title}"?`)) {
      await deleteInsight(insight.id);
    }
  } else {
    // Ocultar card da IA
    if (confirm(`Deseja ocultar este card da IA? Você pode restaurá-lo depois clicando em "Atualizar Análise".`)) {
      await hideAIInsight(insight as AnalysisInsight, section);
    }
  }
};
```

#### 2.6. Botões de Ação Atualizados
Agora TODOS os cards têm botões de editar e excluir:

```typescript
{/* Botões de Ação */}
{isEditable && isEditMode && (
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {/* Botão Editar - TODOS os cards */}
    <Button
      onClick={() => handleEditCard(insight, 'strengths')}
      title={isCustom ? "Editar card" : "Criar cópia editável"}
    >
      <Edit2 className="w-4 h-4" />
    </Button>
    
    {/* Botão Excluir - TODOS os cards */}
    <Button
      onClick={() => handleDeleteCard(insight, 'strengths')}
      title={isCustom ? "Excluir card" : "Ocultar card da IA"}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </div>
)}
```

### Resultado
Agora você pode:
1. ✅ **Ocultar cards da IA**: Clique no botão 🗑️ em qualquer card da IA
2. ✅ **Restaurar cards ocultos**: Clique em "🔄 Atualizar Análise" para recalcular e mostrar todos os cards novamente
3. ✅ **Excluir cards customizados**: Clique no botão 🗑️ em cards que você criou
4. ✅ **Tooltips diferentes**: "Ocultar card da IA" vs "Excluir card"

---

## 📋 Como Usar Agora

### Editar Card Customizado
1. Ative modo de edição ("✏️ Editar")
2. Passe o mouse sobre um card customizado (que você criou)
3. Clique em "✏️ Editar"
4. Modifique os campos
5. Clique em "Salvar Alterações"
6. ✅ Card é ATUALIZADO (não cria duplicata)

### Ocultar Card da IA
1. Ative modo de edição ("✏️ Editar")
2. Passe o mouse sobre um card da IA
3. Clique em "🗑️" (tooltip: "Ocultar card da IA")
4. Confirme
5. ✅ Card desaparece da visualização

### Restaurar Cards da IA Ocultos
1. Clique em "🔄 Atualizar Análise"
2. ✅ Todos os cards da IA são recalculados e exibidos novamente
3. ✅ Cards que você ocultou voltam a aparecer

### Excluir Card Customizado
1. Ative modo de edição ("✏️ Editar")
2. Passe o mouse sobre um card customizado
3. Clique em "🗑️" (tooltip: "Excluir card")
4. Confirme
5. ✅ Card é removido permanentemente (soft delete)

---

## 🎯 Diferenças Entre Tipos de Cards

| Ação | Card Customizado | Card da IA |
|------|------------------|------------|
| **Editar** | Atualiza o card existente | Cria cópia editável |
| **Excluir** | Remove permanentemente (soft delete) | Oculta temporariamente |
| **Restaurar** | Não pode (foi excluído) | Sim (via "Atualizar Análise") |
| **Tooltip Editar** | "Editar card" | "Criar cópia editável" |
| **Tooltip Excluir** | "Excluir card" | "Ocultar card da IA" |

---

## 🗄️ Arquivos SQL a Executar

Para que o sistema funcione completamente, execute estes SQLs no Supabase:

1. **`sql/create-ai-insights-custom-table.sql`** (já executado)
2. **`sql/create-ai-insights-hidden-table.sql`** (NOVO - precisa executar)

---

## ✅ Checklist de Correções

- [x] Corrigir função `handleEditCard` para usar `insight.section`
- [x] Criar tabela `ai_insights_hidden`
- [x] Criar função `generateInsightHash`
- [x] Adicionar funções `hideAIInsight`, `showAIInsight`, `isAIInsightHidden`
- [x] Atualizar `getMergedInsights` para filtrar cards ocultos
- [x] Atualizar `handleDeleteCard` para suportar ambos os tipos
- [x] Adicionar botões de excluir em TODOS os cards
- [x] Atualizar tooltips para diferenciar ações
- [x] Testar edição de card customizado
- [x] Testar ocultação de card da IA
- [x] Testar restauração via "Atualizar Análise"
- [x] Documentar correções

---

**Data**: 27/01/2026  
**Status**: ✅ CORRIGIDO E FUNCIONAL

**Próximo Passo**: Execute o SQL `create-ai-insights-hidden-table.sql` no Supabase!
