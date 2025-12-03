# Funcionalidades Aproveitáveis do Sistema de Dietas

## 🎯 Funcionalidades Prioritárias (Alto Impacto)

### 1. **Calculadora TMB/GET** ⭐⭐⭐
**O que faz:** Calcula Taxa Metabólica Basal e Gasto Energético Total do paciente
**Benefício:** Automatiza o cálculo de macros baseado em dados do paciente
**Complexidade:** Média
**Status:** Pode ser integrado facilmente

**Funcionalidades:**
- Cálculo automático de TMB usando fórmula de Mifflin-St Jeor
- Cálculo de GET (TMB × 1.45)
- Cálculo automático de macros (Proteína: 2g/kg, Gordura: 0.5g/kg, Carboidratos: resto)
- Aplicação direta dos macros calculados na dieta

### 2. **Sistema de Favoritos** ⭐⭐⭐
**O que faz:** Permite salvar refeições e dietas como favoritas para reutilização
**Benefício:** Economiza tempo ao criar novas dietas
**Complexidade:** Média
**Status:** Requer adicionar campo `favorita` nas tabelas

**Funcionalidades:**
- Marcar refeições como favoritas
- Marcar dietas completas como favoritas
- Aplicar refeições favoritas em novas dietas
- Aplicar dietas favoritas em novos pacientes

### 3. **Barra Fixa com Totais vs Metas** ⭐⭐⭐
**O que faz:** Mostra barra fixa no rodapé com totais calculados vs metas
**Benefício:** Visualização rápida do progresso da dieta
**Complexidade:** Baixa
**Status:** Pode ser implementado facilmente

**Funcionalidades:**
- Cálculo automático de totais da dieta
- Comparação com metas definidas
- Barras de progresso coloridas (verde/amarelo/vermelho)
- Porcentagens de cada macro

### 4. **Drag and Drop (Reordenar)** ⭐⭐
**O que faz:** Permite arrastar e soltar para reordenar refeições e alimentos
**Benefício:** Melhora UX na organização da dieta
**Complexidade:** Alta (requer @dnd-kit)
**Status:** Requer instalação de biblioteca

**Funcionalidades:**
- Reordenar refeições
- Reordenar alimentos dentro de refeições
- Reordenar observações/orientações
- Salvar ordem automaticamente

### 5. **Sistema de Observações entre Refeições** ⭐⭐
**O que faz:** Permite inserir observações que aparecem entre as refeições
**Benefício:** Adiciona contexto e orientações importantes
**Complexidade:** Média
**Status:** Pode usar a tabela `diet_guidelines` existente

**Funcionalidades:**
- Criar observações com ordem específica
- Observações aparecem entre refeições na ordem correta
- Editar e deletar observações
- Drag and drop para reordenar

## 🎨 Melhorias de Interface

### 6. **Cards Expansíveis (Collapsible)** ⭐⭐
**O que faz:** Refeições podem ser expandidas/colapsadas
**Benefício:** Interface mais limpa e organizada
**Complexidade:** Baixa
**Status:** Já existe componente Collapsible no shadcn

**Funcionalidades:**
- Refeições colapsadas mostram resumo (calorias, macros)
- Expandidas mostram todos os alimentos
- Botões de ação visíveis quando colapsado

### 7. **Horário Sugerido para Refeições** ⭐
**O que faz:** Adiciona campo de horário sugerido para cada refeição
**Benefício:** Orienta o paciente sobre quando fazer cada refeição
**Complexidade:** Baixa
**Status:** Pode adicionar campo `suggested_time` na tabela

### 8. **Duplicação de Refeições e Dietas** ⭐⭐
**O que faz:** Permite duplicar refeições e dietas completas
**Benefício:** Economiza tempo ao criar variações
**Complexidade:** Média
**Status:** Pode ser implementado facilmente

### 9. **Tabs para Dieta Ativa e Histórico** ⭐⭐
**O que faz:** Separa dieta ativa do histórico de dietas
**Benefício:** Melhor organização e gestão de múltiplas dietas
**Complexidade:** Baixa
**Status:** Pode ser implementado facilmente

**Funcionalidades:**
- Tab "Dieta Ativa" mostra apenas dieta ativa
- Tab "Histórico" mostra todas as dietas inativas
- Ativar/desativar dietas
- Visualizar histórico completo

### 10. **Cálculo Automático de Macros por Refeição** ⭐⭐
**O que faz:** Calcula automaticamente macros da refeição baseado nos alimentos
**Benefício:** Reduz erros manuais
**Complexidade:** Baixa
**Status:** Já existe parcialmente, pode melhorar

## 📊 Funcionalidades Secundárias

### 11. **Sistema de Busca de Alimentos**
- Busca em tempo real no banco de alimentos
- Filtro por nome
- Mostra macros ao buscar

### 12. **Visualização de Macros por Refeição**
- Cards mostrando totais de cada refeição
- Comparação visual com metas

### 13. **Sistema de Status Visual**
- Badges coloridos para status (Ativo, Rascunho, Arquivado)
- Indicadores visuais claros

### 14. **Interface Premium**
- Gradientes e efeitos visuais
- Animações suaves
- Cards com backdrop-blur

## 🚀 Plano de Implementação Sugerido

### Fase 1 (Rápido - Alto Impacto)
1. ✅ Calculadora TMB/GET
2. ✅ Barra fixa com totais vs metas
3. ✅ Horário sugerido para refeições

### Fase 2 (Médio Prazo)
4. ✅ Sistema de Favoritos
5. ✅ Duplicação de refeições/dietas
6. ✅ Cards expansíveis

### Fase 3 (Longo Prazo)
7. ✅ Drag and Drop
8. ✅ Tabs para histórico
9. ✅ Observações entre refeições

## 📝 Notas Técnicas

### Bibliotecas Necessárias
- `@dnd-kit/core` - Para drag and drop
- `@dnd-kit/sortable` - Para ordenação
- `@dnd-kit/utilities` - Utilitários

### Campos a Adicionar nas Tabelas
- `diet_meals.suggested_time` (time) - Horário sugerido
- `diet_meals.favorite` (boolean) - Refeição favorita
- `diet_plans.favorite` (boolean) - Dieta favorita
- `diet_meals.order` (integer) - Ordem (já existe?)
- `diet_foods.order` (integer) - Ordem (já existe?)

### Funções Úteis do Código
- `calcularTMB()` - Cálculo de TMB
- `calcularTotaisRefeicao()` - Totais por refeição
- `calcularTotaisDieta()` - Totais da dieta
- `recalcularCarboidrato()` - Recalcular carboidratos ao alterar calorias


