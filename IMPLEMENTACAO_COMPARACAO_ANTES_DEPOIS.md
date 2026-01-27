# 🎯 Implementação: Comparação Antes/Depois

## 📋 Requisitos do Usuário

### O que o usuário QUER:
1. ✅ No **Portal Privado** (`/portal/:token`): Selecionar 2 fotos e criar um "Antes/Depois" bonito
2. ✅ No **Public Portal** (`/public/portal/:telefone`): Mostrar essa comparação com layout moderno
3. ✅ Opção de **ocultar** a comparação (controle no portal privado, não no público)
4. ✅ Sistema de **visibilidade de fotos individuais** funcionando (ocultar fotos específicas)

### O que o usuário NÃO QUER:
1. ❌ Botões "Criar Comparação" e "Gerenciar Fotos" na página **PatientEvolution** (evolução interna)
2. ❌ Botões "Comparar Fotos" e "Adicionar Fotos" no **PatientPortal**
3. ❌ Controles de edição na página **PublicPortal** (somente visualização)

---

## 🔧 PASSO 1: Executar SQL

```bash
# No Supabase SQL Editor:
controle-de-pacientes/sql/create-featured-comparison-table.sql
```

Isso cria a tabela `featured_photo_comparison` com:
- 1 comparação por paciente (UNIQUE constraint)
- Campos: before_photo, after_photo, title, description, is_visible
- RLS configurado

---

## 🔧 PASSO 2: Adicionar no PatientPortal

### Localização: `src/pages/PatientPortal.tsx`

#### 2.1 Adicionar imports:
```typescript
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';
import { CreateFeaturedComparisonModal } from '@/components/evolution/CreateFeaturedComparisonModal';
import { Sparkles } from 'lucide-react';
```

#### 2.2 Adicionar estados (após os outros estados):
```typescript
const { comparison, toggleVisibility, deleteComparison, refetch } = useFeaturedComparison(patient?.telefone);
const [showCreateComparisonModal, setShowCreateComparisonModal] = useState(false);
```

#### 2.3 Adicionar botão no dropdown (dentro do DropdownMenuContent):
```typescript
{/* Criar Comparação Antes/Depois */}
{patient && checkins.length > 0 && (
  <DropdownMenuItem
    onClick={() => setShowCreateComparisonModal(true)}
    className="text-white hover:bg-purple-700/50 cursor-pointer py-3"
  >
    <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
    {comparison ? 'Editar Antes/Depois' : 'Criar Antes/Depois'}
  </DropdownMenuItem>
)}
```

#### 2.4 Adicionar comparação destacada (ANTES do PatientEvolutionTab):
```typescript
{/* Comparação Destacada Antes/Depois */}
{comparison && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <FeaturedComparison
      comparison={comparison}
      isEditable={true}
      onToggleVisibility={toggleVisibility}
      onEdit={() => setShowCreateComparisonModal(true)}
      onDelete={async () => {
        await deleteComparison();
        refetch();
      }}
    />
  </motion.div>
)}
```

#### 2.5 Adicionar modal (antes do fechamento do componente):
```typescript
{/* Modal de Criação/Edição */}
{showCreateComparisonModal && patient && (
  <CreateFeaturedComparisonModal
    open={showCreateComparisonModal}
    onOpenChange={setShowCreateComparisonModal}
    telefone={patient.telefone}
    checkins={checkins}
    onSuccess={refetch}
  />
)}
```

---

## 🔧 PASSO 3: Adicionar no PublicPortal

### Localização: `src/pages/PublicPortal.tsx`

#### 3.1 Adicionar imports:
```typescript
import { useFeaturedComparison } from '@/hooks/use-featured-comparison';
import { FeaturedComparison } from '@/components/evolution/FeaturedComparison';
```

#### 3.2 Adicionar hook (após os outros hooks):
```typescript
const { comparison } = useFeaturedComparison(telefone);
```

#### 3.3 Adicionar comparação (ANTES do PatientEvolutionTab):
```typescript
{/* Comparação Destacada Antes/Depois - Somente se visível */}
{comparison && comparison.is_visible && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.2 }}
  >
    <FeaturedComparison
      comparison={comparison}
      isEditable={false} // Sem controles no público
    />
  </motion.div>
)}
```

---

## 🔧 PASSO 4: Corrigir Sistema de Visibilidade de Fotos

### Problema: Fotos ocultas não estão sendo filtradas

#### 4.1 Verificar hook `use-photo-visibility.ts`:

O hook deve ter a função `isPhotoVisible` que verifica se uma foto está visível:

```typescript
export function isPhotoVisible(photoId: string): boolean {
  const settings = getVisibilitySettings();
  return settings[photoId] !== false; // Por padrão, todas são visíveis
}
```

#### 4.2 Verificar PhotoComparison.tsx:

O componente deve filtrar fotos quando `isEditable === false`:

```typescript
const visiblePhotos = isEditable 
  ? allPhotos // Nutricionista vê todas
  : allPhotos.filter(photo => {
      const photoId = photo.isInitial 
        ? `initial-${photo.angle}`
        : `checkin-${photo.checkinId}-foto-${photo.photoNumber}`;
      return isPhotoVisible(photoId);
    });
```

#### 4.3 Testar:
1. No PatientPortal, clique em "Gerenciar Fotos"
2. Desmarque algumas fotos
3. Salve
4. Acesse `/public/portal/:telefone`
5. Verifique se as fotos desmarcadas NÃO aparecem

---

## 🔧 PASSO 5: Remover Botões Desnecessários

### 5.1 PatientEvolution.tsx

**REMOVER** os botões:
- "Criar Comparação"
- "Gerenciar Fotos"

Esses botões não devem existir na página de evolução interna, pois:
- Todas as fotos já ficam visíveis lá
- É uma página de visualização rápida

### 5.2 PatientPortal.tsx

**REMOVER** os botões (se existirem):
- "Comparar Fotos"
- "Adicionar Fotos"

O usuário não vai usar essas funcionalidades no portal.

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PORTAL PRIVADO (/portal/:token)                         │
├─────────────────────────────────────────────────────────────┤
│ ✅ Nutricionista acessa                                     │
│ ✅ Clica em "Criar Antes/Depois" no dropdown               │
│ ✅ Seleciona 2 fotos (ANTES em vermelho, DEPOIS em verde)  │
│ ✅ Personaliza título e descrição                           │
│ ✅ Salva                                                    │
│ ✅ Comparação aparece no portal com controles:             │
│    - [👁️ Visível/Oculto] Toggle de visibilidade           │
│    - [✏️ Editar] Alterar fotos/texto                       │
│    - [🗑️ Deletar] Remover comparação                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CONTROLE DE VISIBILIDADE                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ Nutricionista clica em [👁️ Visível]                     │
│ ✅ Comparação fica visível no portal público               │
│                                                             │
│ ❌ Nutricionista clica em [🚫 Oculto]                      │
│ ❌ Comparação NÃO aparece no portal público                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. PORTAL PÚBLICO (/public/portal/:telefone)               │
├─────────────────────────────────────────────────────────────┤
│ ✅ Paciente acessa o link                                   │
│ ✅ Vê a comparação linda e moderna (se visível)            │
│ ✅ Layout premium com:                                      │
│    - Badges ANTES/DEPOIS                                    │
│    - Estatísticas (peso perdido, dias)                     │
│    - Mensagem motivacional                                  │
│    - Animações e efeitos                                    │
│ ❌ SEM controles de edição                                  │
│ ❌ Somente visualização                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Preview Visual

### Portal Privado (com controles):
```
┌──────────────────────────────────────────────────────┐
│ ✨ Minha Transformação          [👁️ Visível] [✏️] [🗑️] │
│ Descrição da jornada...                              │
│ 🔽 5.2 kg perdidos  📅 90 dias                       │
├──────────────────────────────────────────────────────┤
│    ANTES (vermelho)    │    DEPOIS (verde)    ✨    │
│    [Foto 1]            │    [Foto 2]        (badge) │
│    05/01/2026          │    05/04/2026              │
│    68 kg               │    62.8 kg                 │
├──────────────────────────────────────────────────────┤
│ 🎉 Incrível! 5.2 kg em 90 dias! Continue assim! 💪  │
└──────────────────────────────────────────────────────┘
```

### Portal Público (somente visualização):
```
┌──────────────────────────────────────────────────────┐
│ ✨ Minha Transformação                               │
│ Descrição da jornada...                              │
│ 🔽 5.2 kg perdidos  📅 90 dias                       │
├──────────────────────────────────────────────────────┤
│    ANTES (vermelho)    │    DEPOIS (verde)    ✨    │
│    [Foto 1]            │    [Foto 2]        (badge) │
│    05/01/2026          │    05/04/2026              │
│    68 kg               │    62.8 kg                 │
├──────────────────────────────────────────────────────┤
│ 🎉 Incrível! 5.2 kg em 90 dias! Continue assim! 💪  │
└──────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [ ] Executar SQL (`create-featured-comparison-table.sql`)
- [ ] Adicionar imports no PatientPortal
- [ ] Adicionar estados e hooks no PatientPortal
- [ ] Adicionar botão no dropdown do PatientPortal
- [ ] Adicionar componente FeaturedComparison no PatientPortal
- [ ] Adicionar modal CreateFeaturedComparisonModal no PatientPortal
- [ ] Adicionar imports no PublicPortal
- [ ] Adicionar hook no PublicPortal
- [ ] Adicionar componente FeaturedComparison no PublicPortal (somente leitura)
- [ ] Verificar sistema de visibilidade de fotos
- [ ] Testar ocultar/mostrar fotos individuais
- [ ] Testar ocultar/mostrar comparação destacada
- [ ] Remover botões desnecessários do PatientEvolution
- [ ] Remover botões desnecessários do PatientPortal

---

## 🐛 Troubleshooting

### Problema: Comparação não aparece no público
**Solução**: Verificar se `is_visible = true` no banco de dados

### Problema: Fotos ocultas ainda aparecem
**Solução**: Verificar se `isEditable={false}` está sendo passado corretamente

### Problema: Erro ao salvar comparação
**Solução**: Verificar se a tabela foi criada e RLS está configurado

### Problema: Service role não funciona
**Solução**: Verificar se `VITE_SUPABASE_SERVICE_ROLE_KEY` está no `.env`

---

**Data**: 26/01/2026
**Status**: 📋 Aguardando Implementação
**Prioridade**: 🔥 Alta
