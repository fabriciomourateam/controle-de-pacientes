# Próximos Passos - Sistema de Edição da Análise IA

## ✅ Já Criado

1. **SQL da tabela** - `sql/create-ai-insights-custom-table.sql`
   - Tabela `ai_insights_custom` criada
   - Políticas RLS configuradas
   - Índices para performance

2. **Hook de gerenciamento** - `src/hooks/use-custom-insights.ts`
   - `fetchCustomInsights()` - Buscar insights
   - `saveInsight()` - Criar novo
   - `updateInsight()` - Editar existente
   - `deleteInsight()` - Excluir (soft delete)
   - `reorderInsights()` - Reordenar

## 📝 Falta Criar

### 3. Modal de Edição/Criação
**Arquivo**: `src/components/evolution/EditInsightModal.tsx`

**Funcionalidades**:
- Formulário com campos: ícone, título, descrição, recomendação, prioridade
- Modo criar (campos vazios) vs modo editar (campos preenchidos)
- Validação de campos obrigatórios
- Botões Salvar e Cancelar

### 4. Modificar AIInsights.tsx
**Adicionar**:
- Prop `isEditable` (boolean)
- Botão "🔄 Atualizar Análise" no header
- Botão "✏️ Editar" no header (ativa modo de edição)
- Estado `isEditMode`
- Integração com `useCustomInsights`
- Lógica de mesclagem (IA + customizados)
- Botões de ação em cada card (quando em modo edição):
  - ✏️ Editar
  - 🗑️ Excluir
- Botões "+ Adicionar Card" em cada seção

### 5. Lógica de Mesclagem
**Função**: `getMergedInsights()`

Combinar insights da IA com customizados:
```typescript
const getMergedInsights = (
  aiInsights: Insight[],
  customInsights: CustomInsight[],
  section: string
) => {
  // 1. Filtrar customizados da seção (não ocultos)
  const custom = customInsights.filter(
    i => i.section === section && !i.is_hidden
  );
  
  // 2. Filtrar IA que não foram substituídos
  const ai = aiInsights.filter(insight => {
    return !custom.some(c => c.title === insight.title);
  });
  
  // 3. Combinar e ordenar
  return [...custom, ...ai].sort((a, b) => 
    (a.order_index || 0) - (b.order_index || 0)
  );
};
```

### 6. Atualizar PatientEvolutionTab.tsx
Passar prop `isEditable` para AIInsights:
```typescript
<AIInsights 
  checkins={checkins} 
  patient={patient}
  isEditable={!isPublicAccess} // true no /portal, false no /public
/>
```

## 🎯 Ordem de Implementação

1. ✅ Executar SQL no Supabase
2. ✅ Hook já criado
3. ⏳ Criar `EditInsightModal.tsx`
4. ⏳ Modificar `AIInsights.tsx`
5. ⏳ Atualizar `PatientEvolutionTab.tsx`
6. ⏳ Testar no `/portal`
7. ⏳ Verificar no `/public`

## 🚀 Como Continuar

**Opção 1**: Pedir para criar o modal
```
"Crie o EditInsightModal.tsx"
```

**Opção 2**: Pedir para modificar AIInsights
```
"Modifique o AIInsights.tsx para suportar edição"
```

**Opção 3**: Fazer tudo de uma vez
```
"Continue a implementação completa"
```

## 📊 Status Atual

- [x] Tabela SQL criada
- [x] Hook de gerenciamento criado
- [ ] Modal de edição
- [ ] AIInsights modificado
- [ ] PatientEvolutionTab atualizado
- [ ] Testes realizados

**Progresso**: 40% completo

---

**Pronto para continuar?** Me avise qual parte quer que eu implemente agora! 🚀
