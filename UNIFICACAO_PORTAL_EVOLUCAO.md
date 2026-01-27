# Unificação Portal do Aluno + Relatório de Evolução

## Objetivo
Mesclar o "Portal do Aluno" com o "Relatório de Evolução" em uma única página chamada "Minha Evolução", focada em renovação e engajamento do aluno.

---

## Análise das Páginas Atuais

### Portal do Aluno (PatientPortal.tsx)
- Abas: Orientações, Plano Alimentar, Metas, Progresso, Conquistas
- Foco em dieta e acompanhamento diário
- Interface para o aluno acessar

### Relatório de Evolução (PatientEvolution.tsx)
- Seção "Sua Evolução" (texto editável)
- Transformação Visual (fotos comparativas)
- Gráficos de evolução
- Timeline de check-ins
- Análise do Progresso (IA)
- Métricas e composição corporal
- Interface para o nutricionista gerenciar

---

## Plano de Implementação (Item por Item)

### ✅ ITEM 1: Melhorar Cabeçalho
**Objetivo:** Remover avatar circular e colocar "Minha Evolução" como título principal

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover componente Avatar do cabeçalho
- Alterar título para "Minha Evolução"
- Manter apenas nome do paciente de forma limpa
- Ajustar espaçamento e layout

---

### ✅ ITEM 2: Adicionar Seção "Sua Evolução" no Início
**Objetivo:** Criar texto editável mostrando resumo da evolução baseado em todas as métricas

**Arquivos:** 
- `src/pages/PatientPortal.tsx`
- `src/components/renewal/EditableRenewalSection.tsx` (reutilizar)

**Ações:**
- Adicionar seção "Sua Evolução" no topo da página
- Reutilizar componente EditableRenewalSection
- Calcular automaticamente:
  - Perda/ganho de peso total
  - Redução de medidas
  - Tempo de acompanhamento
  - Principais conquistas
- Permitir edição pelo nutricionista
- Salvar conteúdo no banco (tabela renewal_custom_content)

---

### ✅ ITEM 3: Remover Abas Desnecessárias
**Objetivo:** Simplificar interface removendo abas e deixando conteúdo único

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover abas: Orientações, Plano Alimentar, Metas, Progresso, Conquistas
- Deixar conteúdo em fluxo único vertical
- Manter apenas:
  1. Sua Evolução (texto editável)
  2. Transformação Visual (fotos)
  3. Gráficos de Evolução
  4. Análise do Progresso (final da página)

---

### ✅ ITEM 4: Implementar Transformação Visual com Controles
**Objetivo:** Permitir ocultar fotos, arrastar e redimensionar antes de compartilhar

**Arquivos:**
- `src/components/evolution/PhotoComparison.tsx`
- Criar: `src/components/portal/EditablePhotoComparison.tsx`

**Ações:**
- Adicionar toggle para ocultar/mostrar fotos (visível apenas para nutricionista)
- Implementar drag & drop para reordenar fotos
- Adicionar controle de zoom/redimensionamento
- Salvar configurações no banco:
  ```sql
  CREATE TABLE photo_display_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    photos_visible BOOLEAN DEFAULT true,
    photo_order JSONB,
    photo_sizes JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- Aplicar configurações salvas ao exibir para o aluno

---

### ✅ ITEM 5: Remover Seção "2 Check-ins"
**Objetivo:** Limpar interface removendo comparação de apenas 2 check-ins

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover componente que mostra comparação de 2 check-ins específicos
- Manter apenas evolução geral e timeline completa

---

### ✅ ITEM 6: Remover Seções "Métricas" e "Evolução dos Números"
**Objetivo:** Simplificar removendo cards de métricas individuais

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover cards de métricas individuais
- Remover seção "Evolução dos Números"
- Manter apenas gráficos consolidados

---

### ✅ ITEM 7: Remover "Pesos Diários" e "Registrador"
**Objetivo:** Limpar funcionalidades desnecessárias para renovação

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover componente DailyWeightsList
- Remover botão "Registrar Peso"
- Remover modal WeightInput

---

### ✅ ITEM 8: Ajustar Evolução Fotográfica
**Objetivo:** Implementar sistema completo de edição de fotos

**Arquivos:**
- `src/components/portal/EditablePhotoComparison.tsx` (novo)
- `src/hooks/use-photo-settings.ts` (novo)

**Ações:**
- Criar interface de edição (visível apenas para nutricionista):
  - Toggle visibilidade geral
  - Drag & drop para reordenar
  - Slider de zoom para cada foto
  - Botão "Salvar Configuração"
- Criar hook para gerenciar configurações
- Aplicar configurações ao renderizar para aluno

---

### ✅ ITEM 9: Limpar Dropdown "Ações Rápidas"
**Objetivo:** Remover itens desnecessários e renomear página

**Arquivos:** `src/pages/PatientPortal.tsx`

**Ações:**
- Remover do dropdown:
  - "Registrar Peso"
  - "Adicionar Bioimpedância"
  - Outros itens não relacionados a renovação
- Manter apenas:
  - "Exportar Evolução"
  - "Compartilhar Link"
  - "Editar Configurações" (nutricionista)
- Alterar título da página de "Portal do Aluno" para "Minha Evolução"

---

### ✅ ITEM 10: Adicionar Análise do Progresso no Final
**Objetivo:** Melhorar layout da análise IA e posicionar no final da página

**Arquivos:**
- `src/components/evolution/AIInsights.tsx`
- Criar: `src/components/portal/EnhancedProgressAnalysis.tsx`

**Ações:**
- Redesenhar componente AIInsights:
  - Layout moderno com gradientes
  - Cores alinhadas com tema da página
  - Cards com ícones e animações
  - Seções expandidas por padrão
- Adicionar pontos que reforcem importância do acompanhamento:
  - "Seus resultados comprovam a eficácia do método"
  - "Manter o acompanhamento garante resultados duradouros"
  - "Juntos, vamos alcançar seus próximos objetivos"
- Posicionar no final da página como CTA para renovação

---

## Estrutura Final da Página "Minha Evolução"

```
┌─────────────────────────────────────────┐
│ CABEÇALHO                               │
│ - Nome do Paciente                      │
│ - Título: "Minha Evolução"              │
│ - Dropdown Ações (simplificado)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 1. SUA EVOLUÇÃO                         │
│ - Texto editável (nutricionista)        │
│ - Resumo automático de resultados       │
│ - Tempo de acompanhamento               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 2. TRANSFORMAÇÃO VISUAL                 │
│ - Fotos comparativas                    │
│ - Controles de edição (nutricionista):  │
│   • Toggle visibilidade                 │
│   • Drag & drop reordenação             │
│   • Zoom/redimensionamento              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 3. GRÁFICOS DE EVOLUÇÃO                 │
│ - Peso ao longo do tempo                │
│ - Medidas corporais                     │
│ - Composição corporal                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 4. ANÁLISE DO PROGRESSO                 │
│ - Layout moderno e colorido             │
│ - Insights da IA                        │
│ - Pontos de reforço para renovação      │
│ - CTA: "Continue sua jornada"           │
└─────────────────────────────────────────┘
```

---

## Benefícios da Unificação

1. **Experiência Simplificada:** Uma única página focada em resultados
2. **Foco em Renovação:** Todo conteúdo direcionado para mostrar valor do acompanhamento
3. **Controle Total:** Nutricionista pode personalizar o que o aluno vê
4. **Profissional:** Layout moderno e impactante
5. **Eficiência:** Elimina necessidade de página renewal separada

---

## Ordem de Execução Sugerida

1. ✅ Item 1: Melhorar cabeçalho (rápido, sem quebrar)
2. ✅ Item 3: Remover abas (simplifica estrutura)
3. ✅ Item 5, 6, 7, 9: Remover seções desnecessárias (limpeza)
4. ✅ Item 2: Adicionar "Sua Evolução" no início
5. ✅ Item 4 e 8: Implementar controles de fotos (mais complexo)
6. ✅ Item 10: Melhorar análise do progresso no final

---

## Próximos Passos

Vou implementar item por item, testando cada alteração antes de prosseguir. Começamos pelo Item 1?
