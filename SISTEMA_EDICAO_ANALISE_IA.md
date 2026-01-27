# Sistema de Edição da Análise IA - Especificação Completa

## 🎯 Objetivo

Permitir que o nutricionista edite, adicione e exclua cards da "Análise da sua Evolução" no portal (`/portal/:token`), e essas alterações apareçam no portal público (`/public/portal/:telefone`).

## 📋 Funcionalidades Necessárias

### 1. **Botão "Atualizar Análise"**
- Recalcula a análise da IA com dados atualizados
- Aparece no header do card "Análise da sua Evolução"
- Ícone: RefreshCw (seta circular)
- Tooltip: "Recalcular análise com dados atualizados"

### 2. **Modo de Edição**
- Botão "Editar" no header (apenas no `/portal`)
- Ativa modo de edição nos cards
- Mostra botões de ação em cada card:
  - ✏️ Editar conteúdo
  - 🗑️ Excluir card
  - ↕️ Reordenar (arrastar)

### 3. **Adicionar Novos Cards**
- Botão "+ Adicionar Card" em cada seção
- Modal para criar novo card:
  - Escolher seção (Pontos Fortes / Próximas Metas / Pontos de Atenção)
  - Escolher ícone (emoji picker)
  - Título do card
  - Descrição
  - Recomendação (opcional)
  - Prioridade (para Pontos de Atenção)

### 4. **Editar Cards Existentes**
- Modal de edição com mesmos campos
- Permite editar tanto cards gerados pela IA quanto manuais
- Marca card como "editado manualmente"

### 5. **Persistência no Banco**
- Salvar cards customizados no Supabase
- Mesclar com cards gerados pela IA
- Cards manuais têm prioridade sobre IA

## 🗄️ Estrutura do Banco de Dados

### Tabela: `ai_insights_custom`

```sql
CREATE TABLE ai_insights_custom (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  section TEXT NOT NULL, -- 'strengths', 'warnings', 'goals'
  icon TEXT NOT NULL, -- emoji
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  priority TEXT, -- 'high', 'medium', 'low' (apenas para warnings)
  order_index INTEGER DEFAULT 0, -- para ordenação
  is_manual BOOLEAN DEFAULT true, -- se foi criado manualmente
  is_hidden BOOLEAN DEFAULT false, -- se foi ocultado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_ai_insights_telefone ON ai_insights_custom(telefone);
CREATE INDEX idx_ai_insights_section ON ai_insights_custom(section);

-- RLS Policies
ALTER TABLE ai_insights_custom ENABLE ROW LEVEL SECURITY;

-- Nutricionista pode ver/editar seus próprios insights
CREATE POLICY "Users can manage their own insights"
  ON ai_insights_custom
  FOR ALL
  USING (auth.uid() = user_id);

-- Acesso público para leitura (portal público)
CREATE POLICY "Public can view insights"
  ON ai_insights_custom
  FOR SELECT
  USING (true);
```

## 🔧 Componentes a Criar/Modificar

### 1. **AIInsights.tsx** (Modificar)
```typescript
interface AIInsightsProps {
  checkins: Checkin[];
  patient?: Patient | null;
  isEditable?: boolean; // Se true, mostra controles de edição
  onRefresh?: () => void; // Callback para atualizar dados
}
```

**Adicionar:**
- Estado `isEditMode` para controlar modo de edição
- Botão "Atualizar Análise" no header
- Botão "Editar" no header (apenas se `isEditable`)
- Botões de ação em cada card (quando em modo de edição)
- Botões "+ Adicionar Card" em cada seção

### 2. **EditInsightModal.tsx** (Criar)
Modal para editar/criar cards:
```typescript
interface EditInsightModalProps {
  open: boolean;
  onClose: () => void;
  insight?: CustomInsight | null; // null = criar novo
  section: 'strengths' | 'warnings' | 'goals';
  telefone: string;
  onSave: () => void;
}
```

**Campos:**
- Seletor de ícone (emoji picker)
- Input de título
- Textarea de descrição
- Textarea de recomendação (opcional)
- Select de prioridade (apenas para warnings)

### 3. **use-custom-insights.ts** (Criar)
Hook para gerenciar insights customizados:
```typescript
export function useCustomInsights(telefone: string) {
  const [customInsights, setCustomInsights] = useState<CustomInsight[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar insights customizados
  const fetchCustomInsights = async () => { ... };

  // Salvar novo insight
  const saveInsight = async (data: InsightData) => { ... };

  // Atualizar insight existente
  const updateInsight = async (id: string, data: Partial<InsightData>) => { ... };

  // Deletar insight
  const deleteInsight = async (id: string) => { ... };

  // Reordenar insights
  const reorderInsights = async (section: string, newOrder: string[]) => { ... };

  return {
    customInsights,
    loading,
    fetchCustomInsights,
    saveInsight,
    updateInsight,
    deleteInsight,
    reorderInsights
  };
}
```

### 4. **Lógica de Mesclagem**
Combinar insights da IA com customizados:
```typescript
const getMergedInsights = (
  aiInsights: AIInsight[],
  customInsights: CustomInsight[],
  section: string
) => {
  // 1. Filtrar insights customizados da seção
  const custom = customInsights.filter(i => i.section === section && !i.is_hidden);
  
  // 2. Filtrar insights da IA que não foram substituídos
  const ai = aiInsights.filter(insight => {
    // Verificar se existe versão customizada com mesmo título
    return !custom.some(c => c.title === insight.title);
  });
  
  // 3. Combinar e ordenar
  return [...custom, ...ai].sort((a, b) => a.order_index - b.order_index);
};
```

## 🎨 UI/UX

### Modo Normal (Visualização)
```
┌─────────────────────────────────────────────┐
│ ✨ Análise da sua Evolução    [🔄] [▼]     │
├─────────────────────────────────────────────┤
│                                             │
│ 📈 Pontos Fortes                            │
│ ┌─────────────────────────────────────┐    │
│ │ 💪 Perda de peso consistente        │    │
│ │ Você perdeu 2.2kg em 4 semanas...   │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ 🎯 Próximas Metas                           │
│ ┌─────────────────────────────────────┐    │
│ │ 🏃 Aumentar atividade física        │    │
│ │ Meta: 150min de exercício/semana... │    │
│ └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Modo de Edição (Portal)
```
┌─────────────────────────────────────────────┐
│ ✨ Análise da sua Evolução [🔄] [💾 Salvar]│
├─────────────────────────────────────────────┤
│                                             │
│ 📈 Pontos Fortes              [+ Adicionar] │
│ ┌─────────────────────────────────────┐    │
│ │ 💪 Perda de peso consistente        │    │
│ │ Você perdeu 2.2kg em 4 semanas...   │    │
│ │                    [✏️ Editar] [🗑️]  │    │
│ └─────────────────────────────────────┘    │
│ ┌─────────────────────────────────────┐    │
│ │ 🎯 Consistência nos treinos         │    │
│ │ 100% de adesão aos treinos...       │    │
│ │                    [✏️ Editar] [🗑️]  │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ 🎯 Próximas Metas                [+ Adicionar]│
│ ...                                         │
└─────────────────────────────────────────────┘
```

## 📱 Fluxo de Uso

### 1. Atualizar Análise
1. Nutricionista clica em 🔄 "Atualizar Análise"
2. Sistema recalcula análise com dados atualizados
3. Cards da IA são atualizados
4. Cards manuais permanecem intactos
5. Toast: "Análise atualizada com sucesso!"

### 2. Editar Card Existente
1. Nutricionista clica em "Editar" (ativa modo de edição)
2. Clica em ✏️ em um card
3. Modal abre com dados preenchidos
4. Edita título, descrição, etc.
5. Clica em "Salvar"
6. Card é salvo no banco como customizado
7. Aparece no portal público

### 3. Adicionar Novo Card
1. Nutricionista clica em "+ Adicionar Card" na seção desejada
2. Modal abre vazio
3. Preenche todos os campos
4. Escolhe ícone (emoji picker)
5. Clica em "Salvar"
6. Card aparece na seção
7. Aparece no portal público

### 4. Excluir Card
1. Nutricionista clica em 🗑️ em um card
2. Dialog de confirmação: "Tem certeza?"
3. Confirma
4. Card é marcado como `is_hidden = true` (soft delete)
5. Não aparece mais em nenhum portal

### 5. Reordenar Cards
1. Nutricionista arrasta cards para reordenar
2. Sistema salva nova ordem no `order_index`
3. Ordem é mantida em ambos os portais

## 🔐 Segurança

### Portal Privado (`/portal/:token`)
- ✅ Pode ver todos os cards (IA + customizados)
- ✅ Pode editar cards
- ✅ Pode adicionar cards
- ✅ Pode excluir cards
- ✅ Pode reordenar cards
- ✅ Pode atualizar análise da IA

### Portal Público (`/public/portal/:telefone`)
- ✅ Pode ver cards não ocultos
- ❌ Não pode editar
- ❌ Não pode adicionar
- ❌ Não pode excluir
- ❌ Não pode reordenar
- ❌ Não vê botão de atualizar

## 📊 Priorização

### Fase 1 (MVP) - Essencial
1. ✅ Criar tabela `ai_insights_custom`
2. ✅ Botão "Atualizar Análise"
3. ✅ Hook `use-custom-insights`
4. ✅ Lógica de mesclagem IA + customizados

### Fase 2 - Edição Básica
5. ✅ Modal de edição/criação
6. ✅ Editar cards existentes
7. ✅ Adicionar novos cards
8. ✅ Excluir cards

### Fase 3 - Avançado
9. ⏳ Reordenar cards (drag & drop)
10. ⏳ Emoji picker
11. ⏳ Histórico de alterações
12. ⏳ Desfazer alterações

## 🚀 Próximos Passos

1. **Executar SQL** para criar tabela
2. **Criar hook** `use-custom-insights.ts`
3. **Criar modal** `EditInsightModal.tsx`
4. **Modificar** `AIInsights.tsx` para suportar edição
5. **Testar** no portal privado
6. **Verificar** que aparece no portal público
7. **Documentar** para o usuário

## 💡 Observações Importantes

- Cards da IA são **recalculados** quando clica em "Atualizar"
- Cards manuais **nunca são sobrescritos** pela IA
- Cards podem ser **editados** mesmo após gerados pela IA
- Exclusão é **soft delete** (marca como oculto)
- Ordem é **persistida** no banco
- Sistema funciona **offline** (usa cache local)

---

**Deseja que eu implemente esta solução completa?**

Posso começar criando:
1. O SQL da tabela
2. O hook de gerenciamento
3. O modal de edição
4. As modificações no AIInsights

Confirme para eu prosseguir! 🚀
