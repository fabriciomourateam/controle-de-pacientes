# Ocultar "Evolução Fotográfica" Quando Não Há Fotos

## ✅ Implementado

Adicionada lógica para ocultar automaticamente a seção "Evolução Fotográfica" quando o paciente não possui fotos (nem fotos iniciais, nem fotos de checkins).

## 🎯 Objetivo

Evitar mostrar uma seção vazia de "Evolução Fotográfica" tanto no portal privado (`/portal/:token`) quanto no portal público (`/public/portal/:telefone`) quando não há fotos disponíveis.

## 🔧 Alterações Realizadas

### 1. **Função Helper `hasPhotos()`**

Adicionada função que verifica se há fotos disponíveis:

```typescript
const hasPhotos = () => {
  // Verificar fotos iniciais do paciente
  const patientWithData = patient as any;
  const hasInitialPhotos = patientWithData?.foto_inicial_frente || 
                           patientWithData?.foto_inicial_lado || 
                           patientWithData?.foto_inicial_lado_2 || 
                           patientWithData?.foto_inicial_costas;
  
  // Verificar fotos nos checkins
  const hasCheckinPhotos = checkins.some(checkin => {
    const c = checkin as any;
    return c.foto_frente || c.foto_lado || c.foto_lado_2 || c.foto_costas ||
           c.foto_1 || c.foto_2 || c.foto_3 || c.foto_4;
  });
  
  return hasInitialPhotos || hasCheckinPhotos;
};
```

### 2. **Condição de Renderização Atualizada**

Modificada a condição de renderização do componente `PhotoComparison`:

**Antes:**
```tsx
{checkins.length >= 2 && !(isPublicAccess && hasFeaturedComparison) && (
  <PhotoComparison ... />
)}
```

**Depois:**
```tsx
{hasPhotos() && checkins.length >= 2 && !(isPublicAccess && hasFeaturedComparison) && (
  <PhotoComparison ... />
)}
```

## 📋 Verificações da Função

A função `hasPhotos()` verifica:

### Fotos Iniciais do Paciente:
- `foto_inicial_frente`
- `foto_inicial_lado`
- `foto_inicial_lado_2`
- `foto_inicial_costas`

### Fotos nos Checkins:
- `foto_frente`
- `foto_lado`
- `foto_lado_2`
- `foto_costas`
- `foto_1`
- `foto_2`
- `foto_3`
- `foto_4`

## 🔄 Comportamento

### Quando HÁ fotos:
- ✅ Seção "Evolução Fotográfica" é exibida normalmente
- ✅ Fotos são mostradas na galeria
- ✅ Comparação antes/depois disponível

### Quando NÃO HÁ fotos:
- ❌ Seção "Evolução Fotográfica" é completamente oculta
- ❌ Não aparece card vazio
- ❌ Não aparece no portal privado
- ❌ Não aparece no portal público

## 📍 Onde Aplica

### Portal Privado (`/portal/:token`)
- Nutricionista não vê seção vazia se não houver fotos
- Pode adicionar fotos posteriormente
- Seção aparece automaticamente quando fotos são adicionadas

### Portal Público (`/public/portal/:telefone`)
- Paciente não vê seção vazia
- Interface mais limpa quando não há fotos
- Evita confusão ou expectativa de conteúdo que não existe

## 🎨 Benefícios

- ✅ Interface mais limpa
- ✅ Evita seções vazias
- ✅ Melhor experiência do usuário
- ✅ Reduz confusão
- ✅ Funciona automaticamente (sem configuração manual)
- ✅ Aplica tanto no portal privado quanto público

## 📄 Arquivo Modificado

- `controle-de-pacientes/src/components/diets/PatientEvolutionTab.tsx`

## 🧪 Como Testar

### Teste 1: Paciente SEM fotos
1. Acesse `/portal/:token` de um paciente sem fotos
2. Verifique que a seção "Evolução Fotográfica" NÃO aparece
3. Acesse `/public/portal/:telefone` do mesmo paciente
4. Confirme que a seção também NÃO aparece no portal público

### Teste 2: Paciente COM fotos
1. Acesse `/portal/:token` de um paciente com fotos
2. Verifique que a seção "Evolução Fotográfica" aparece normalmente
3. Acesse `/public/portal/:telefone` do mesmo paciente
4. Confirme que a seção aparece no portal público

### Teste 3: Adicionar fotos
1. Acesse paciente sem fotos (seção oculta)
2. Adicione fotos através de um checkin
3. Recarregue a página
4. Confirme que a seção agora aparece

## ✨ Resultado Final

A seção "Evolução Fotográfica" agora só aparece quando realmente há fotos para mostrar, tornando a interface mais limpa e profissional tanto para o nutricionista quanto para o paciente.
