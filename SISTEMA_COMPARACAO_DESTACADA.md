# 🌟 Sistema de Comparação Destacada (Antes/Depois)

## 📋 Visão Geral

Sistema que permite criar uma comparação visual "Antes e Depois" personalizada, selecionando 2 fotos específicas para destacar a transformação do paciente no portal público.

---

## ✨ Funcionalidades

### 1. Seleção de Fotos
- Escolha 2 fotos de qualquer check-in
- Visualização em grid com todas as fotos disponíveis
- Indicação visual clara da seleção (ANTES em vermelho, DEPOIS em verde)

### 2. Personalização
- **Título**: Personalize o título da transformação (ex: "Minha Jornada de 3 Meses")
- **Descrição**: Adicione uma descrição opcional sobre a jornada
- **Visibilidade**: Controle se a comparação aparece no portal público

### 3. Layout Moderno
- Design premium com gradientes e animações
- Badges "ANTES" e "DEPOIS" destacados
- Estatísticas automáticas (peso perdido, dias de transformação)
- Mensagem motivacional personalizada
- Efeito hover nas fotos
- Badge de conquista animado

### 4. Controles
- **Visível/Oculto**: Toggle para mostrar/ocultar no portal público
- **Editar**: Alterar fotos, título ou descrição
- **Deletar**: Remover a comparação

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `featured_photo_comparison`

```sql
CREATE TABLE featured_photo_comparison (
  id UUID PRIMARY KEY,
  telefone TEXT NOT NULL UNIQUE,
  
  -- Foto "Antes"
  before_photo_url TEXT NOT NULL,
  before_photo_date DATE NOT NULL,
  before_weight NUMERIC(5,2),
  
  -- Foto "Depois"
  after_photo_url TEXT NOT NULL,
  after_photo_date DATE NOT NULL,
  after_weight NUMERIC(5,2),
  
  -- Configurações
  is_visible BOOLEAN DEFAULT true,
  title TEXT DEFAULT 'Minha Transformação',
  description TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Características**:
- ✅ Apenas 1 comparação por paciente (UNIQUE constraint)
- ✅ RLS habilitado para segurança
- ✅ Service role pode acessar (para página pública)
- ✅ Trigger para atualizar `updated_at`

---

## 🔧 Como Usar

### Passo 1: Executar SQL

```bash
# No Supabase SQL Editor, execute:
controle-de-pacientes/sql/create-featured-comparison-table.sql
```

### Passo 2: Integrar no Portal

#### No `PatientPortal.tsx` ou `PatientEvolutionTab.tsx`:

```typescript
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';
import { CreateFeaturedComparisonModal } from '@/components/evolution/CreateFeaturedComparisonModal';

// No componente:
const { comparison, toggleVisibility, deleteComparison, refetch } = useFeaturedComparison(patient?.telefone);
const [showCreateModal, setShowCreateModal] = useState(false);

// Botão para criar comparação:
<Button onClick={() => setShowCreateModal(true)}>
  <Sparkles className="w-4 h-4 mr-2" />
  Criar Antes/Depois
</Button>

// Modal de criação:
<CreateFeaturedComparisonModal
  open={showCreateModal}
  onOpenChange={setShowCreateModal}
  telefone={patient?.telefone || ''}
  checkins={checkins}
  onSuccess={refetch}
/>

// Exibir comparação (se existir):
{comparison && (
  <FeaturedComparison
    comparison={comparison}
    isEditable={true}
    onToggleVisibility={toggleVisibility}
    onEdit={() => setShowCreateModal(true)}
    onDelete={deleteComparison}
  />
)}
```

### Passo 3: Integrar no Public Portal

#### No `PublicPortal.tsx`:

```typescript
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';

// No componente:
const { comparison } = useFeaturedComparison(telefone);

// Exibir comparação (somente se visível):
{comparison && comparison.is_visible && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <FeaturedComparison
      comparison={comparison}
      isEditable={false} // Sem controles no portal público
    />
  </motion.div>
)}
```

---

## 🎨 Exemplo Visual

### Portal Privado (com controles):
```
┌─────────────────────────────────────────────────────────┐
│ ✨ Minha Transformação                    [👁️ Visível] │
│ Descrição da jornada...                   [✏️ Editar]  │
│                                            [🗑️ Deletar] │
│ 🔽 5.2 kg perdidos  📅 90 dias de transformação        │
├─────────────────────────────────────────────────────────┤
│         ANTES          │         DEPOIS                 │
│    [Foto 1]            │    [Foto 2]                    │
│    05/01/2026          │    05/04/2026                  │
│    68 kg               │    62.8 kg                     │
├─────────────────────────────────────────────────────────┤
│ 🎉 Incrível! Uma transformação de 5.2 kg em 90 dias!  │
│ Continue assim, você está no caminho certo! 💪          │
└─────────────────────────────────────────────────────────┘
```

### Portal Público (somente visualização):
```
┌─────────────────────────────────────────────────────────┐
│ ✨ Minha Transformação                                  │
│ Descrição da jornada...                                 │
│ 🔽 5.2 kg perdidos  📅 90 dias de transformação        │
├─────────────────────────────────────────────────────────┤
│         ANTES          │         DEPOIS          ✨     │
│    [Foto 1]            │    [Foto 2]         (badge)   │
│    05/01/2026          │    05/04/2026                  │
│    68 kg               │    62.8 kg                     │
├─────────────────────────────────────────────────────────┤
│ 🎉 Incrível! Uma transformação de 5.2 kg em 90 dias!  │
│ Continue assim, você está no caminho certo! 💪          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança (RLS)

### Políticas Implementadas:

1. **Visualização Própria**:
   ```sql
   Users can view own featured comparison
   ```
   - Usuários autenticados veem apenas suas comparações

2. **Gerenciamento**:
   ```sql
   Users can manage own featured comparison
   ```
   - Apenas o dono pode criar/editar/deletar

3. **Acesso Público**:
   ```sql
   Service role can access all
   ```
   - Service role acessa tudo (para página pública)
   - Apenas comparações com `is_visible = true` são exibidas

---

## 📊 Estatísticas Automáticas

O componente calcula automaticamente:

1. **Diferença de Peso**:
   ```typescript
   const weightDiff = before_weight - after_weight;
   // Ex: 68 - 62.8 = 5.2 kg perdidos
   ```

2. **Dias de Transformação**:
   ```typescript
   const daysDiff = (after_date - before_date) / (1000 * 60 * 60 * 24);
   // Ex: 90 dias
   ```

3. **Mensagem Motivacional**:
   - Personalizada baseada no resultado
   - Aparece apenas se houve perda de peso

---

## 🎯 Casos de Uso

### 1. Transformação de 3 Meses
```typescript
{
  title: "Minha Jornada de 3 Meses",
  description: "Com dedicação e foco, consegui transformar meu corpo!",
  before: { date: "2026-01-05", weight: 68 },
  after: { date: "2026-04-05", weight: 62.8 }
}
```

### 2. Recomposição Corporal
```typescript
{
  title: "Recomposição Corporal",
  description: "Menos gordura, mais músculo!",
  before: { date: "2025-10-01", weight: 70 },
  after: { date: "2026-01-26", weight: 68 }
}
```

### 3. Ocultar Temporariamente
```typescript
// Ocultar durante ajustes
comparison.is_visible = false;

// Mostrar quando estiver pronto
comparison.is_visible = true;
```

---

## 🚀 Próximas Melhorias

- [ ] Múltiplas comparações (galeria)
- [ ] Slider interativo (antes/depois)
- [ ] Compartilhamento direto (WhatsApp, Instagram)
- [ ] Marca d'água personalizada
- [ ] Filtros e ajustes de foto
- [ ] Comparação lado a lado com slider
- [ ] Exportação como imagem única

---

## 📝 Notas Importantes

1. **Apenas 1 comparação por paciente**: O sistema usa `UNIQUE(telefone)` para garantir isso
2. **Fotos devem existir**: As URLs devem ser válidas e acessíveis
3. **Datas automáticas**: Extraídas dos check-ins selecionados
4. **Peso opcional**: Se não houver peso, estatísticas não aparecem
5. **Visibilidade padrão**: `true` (visível no portal público)

---

**Data de Criação**: 26/01/2026
**Versão**: 1.0
**Status**: ✅ Pronto para Implementação
