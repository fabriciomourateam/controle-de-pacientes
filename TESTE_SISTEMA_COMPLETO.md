# 🧪 Teste do Sistema Completo - Passo a Passo

**Data**: 26/01/2026  
**Status**: 🔍 Testando

---

## 📋 Checklist de Testes

### ✅ Teste 1: Sistema de Visibilidade de Fotos

#### Passo 1: Acessar Portal Privado
1. Acesse: `/portal/:token`
2. Vá até o card "Comparação de Fotos"
3. Procure o botão **"Gerenciar Fotos"** (ícone ⚙️ Settings)

**Onde está o botão?**
- No canto superior direito do card "Comparação de Fotos"
- Ao lado do botão de minimizar/expandir

#### Passo 2: Abrir Modal de Visibilidade
1. Clique no botão "Gerenciar Fotos" (⚙️)
2. Deve abrir um modal com todas as fotos
3. Cada foto tem um checkbox "Visível no Portal Público"

#### Passo 3: Ocultar Fotos
1. **Desmarque** algumas fotos (tire o ✓)
2. Clique em "Salvar Configurações"
3. Deve aparecer toast: "Configurações salvas!"

#### Passo 4: Verificar no Portal Público
1. Abra uma nova aba anônima (Ctrl+Shift+N)
2. Acesse: `/public/portal/:telefone`
3. Vá até o card "Comparação de Fotos"
4. **Verifique**: As fotos desmarcadas NÃO devem aparecer

**Se as fotos ainda aparecem:**
- Abra o console (F12)
- Procure por erros
- Verifique se o `isPublicAccess={true}` está sendo passado
- Limpe o cache (Ctrl+Shift+Delete)

---

### ✅ Teste 2: Comparação Destacada Antes/Depois

#### Passo 1: Criar Comparação
1. Acesse: `/portal/:token`
2. Clique no menu dropdown (⋮) no canto superior direito
3. Clique em **"Criar Antes/Depois"**
4. Deve abrir um modal com grid de fotos

#### Passo 2: Selecionar Fotos
1. **Esquerda**: Clique em uma foto ANTES (borda vermelha)
2. **Direita**: Clique em uma foto DEPOIS (borda verde)
3. Preencha o título (ex: "Minha Transformação")
4. Preencha a descrição (opcional)
5. Clique em "Criar Comparação"

#### Passo 3: Verificar no Portal Privado
1. A comparação deve aparecer ANTES do card de fotos
2. Deve ter 3 botões:
   - **👁️ Visível** (verde) ou **🚫 Oculto** (cinza)
   - **✏️ Editar**
   - **🗑️ Deletar**

#### Passo 4: Verificar no Portal Público
1. Abra uma nova aba anônima
2. Acesse: `/public/portal/:telefone`
3. A comparação deve aparecer (se visível)
4. **NÃO** deve ter botões de controle

**Se a comparação não aparece:**
- Verifique se está marcada como "Visível" (👁️ verde)
- Abra o console (F12) e procure por erros
- Verifique se o hook `useFeaturedComparison` está carregando

---

## 🐛 Debug: Console do Navegador

### Abrir Console
1. Pressione **F12**
2. Vá na aba "Console"
3. Procure por mensagens de erro (vermelho)

### Mensagens Esperadas (Portal Privado)
```
🚀 PhotoComparison RENDERIZADO! {checkinsLength: X, hasPatient: true}
👁️ Fotos visíveis: X de Y
```

### Mensagens Esperadas (Portal Público)
```
🚀 PhotoComparison RENDERIZADO! {checkinsLength: X, hasPatient: true}
👁️ Fotos visíveis: X de Y (deve ser menor se houver fotos ocultas)
```

---

## 🔍 Verificar Banco de Dados

### Verificar Tabela photo_visibility_settings
```sql
-- No Supabase SQL Editor
SELECT * FROM photo_visibility_settings 
WHERE patient_telefone = 'SEU_TELEFONE_AQUI';
```

**Resultado esperado:**
- Linhas com `visible = false` para fotos ocultas
- Linhas com `visible = true` para fotos visíveis

### Verificar Tabela featured_photo_comparison
```sql
-- No Supabase SQL Editor
SELECT * FROM featured_photo_comparison 
WHERE telefone = 'SEU_TELEFONE_AQUI';
```

**Resultado esperado:**
- 1 linha com a comparação criada
- `is_visible = true` se deve aparecer no público
- `is_visible = false` se deve estar oculta

---

## 📊 Fluxo de Dados

### Sistema de Visibilidade de Fotos

```
Portal Privado (/portal/:token)
  ↓
PhotoComparison (isEditable={true})
  ↓
Botão "Gerenciar Fotos" (⚙️)
  ↓
PhotoVisibilityModal
  ↓
usePhotoVisibility hook
  ↓
Supabase: photo_visibility_settings
  ↓
Salvar: visible = false
  ↓
Portal Público (/public/portal/:telefone)
  ↓
PhotoComparison (isEditable={false})
  ↓
usePhotoVisibility hook
  ↓
isPhotoVisible(photoId) retorna false
  ↓
Foto NÃO aparece no grid
```

### Sistema de Comparação Destacada

```
Portal Privado (/portal/:token)
  ↓
Dropdown (⋮) → "Criar Antes/Depois"
  ↓
CreateFeaturedComparisonModal
  ↓
Selecionar 2 fotos
  ↓
useFeaturedComparison.saveComparison()
  ↓
Supabase: featured_photo_comparison
  ↓
Portal Privado: FeaturedComparison (isEditable={true})
  ↓
Portal Público: FeaturedComparison (isEditable={false})
  ↓
Apenas se is_visible = true
```

---

## ❓ Perguntas para Debug

### 1. O botão "Gerenciar Fotos" aparece?
- [ ] Sim, no portal privado
- [ ] Não aparece

**Se não aparece:**
- Verifique se `isEditable={true}` no PatientPortal
- Procure por `<Settings` ou `Gerenciar Fotos` no código

### 2. O modal de visibilidade abre?
- [ ] Sim, mostra todas as fotos
- [ ] Não abre
- [ ] Abre mas está vazio

**Se não abre:**
- Verifique o console (F12) por erros
- Verifique se `PhotoVisibilityModal` está importado

### 3. As configurações são salvas?
- [ ] Sim, aparece toast de sucesso
- [ ] Não, aparece erro
- [ ] Não acontece nada

**Se não salva:**
- Verifique o console por erros
- Verifique se a tabela `photo_visibility_settings` existe
- Verifique as políticas RLS

### 4. As fotos ocultas desaparecem no público?
- [ ] Sim, funcionando perfeitamente
- [ ] Não, ainda aparecem todas
- [ ] Algumas sim, outras não

**Se ainda aparecem:**
- Verifique se `isPublicAccess={true}` no PublicPortal
- Verifique se `isEditable={false}` no PhotoComparison
- Limpe o cache do navegador

### 5. O botão "Criar Antes/Depois" aparece?
- [ ] Sim, no dropdown do portal privado
- [ ] Não aparece

**Se não aparece:**
- Verifique se o dropdown tem o item com `Sparkles` icon
- Verifique se `patient` e `checkins` existem

### 6. O modal de criação abre?
- [ ] Sim, mostra grid de fotos
- [ ] Não abre
- [ ] Abre mas está vazio

**Se não abre:**
- Verifique o console por erros
- Verifique se `CreateFeaturedComparisonModal` está importado

### 7. A comparação é criada?
- [ ] Sim, aparece no portal privado
- [ ] Não, aparece erro
- [ ] Não acontece nada

**Se não cria:**
- Verifique o console por erros
- Verifique se a tabela `featured_photo_comparison` existe
- Verifique as políticas RLS

### 8. A comparação aparece no público?
- [ ] Sim, quando visível
- [ ] Não aparece nunca
- [ ] Aparece sempre (mesmo oculta)

**Se não aparece:**
- Verifique se `is_visible = true` no banco
- Verifique se o hook `useFeaturedComparison` está carregando
- Verifique se o componente `FeaturedComparison` está renderizando

---

## 📝 Relatório de Teste

Preencha após testar:

### Sistema de Visibilidade
- [ ] Botão "Gerenciar Fotos" funciona
- [ ] Modal abre corretamente
- [ ] Configurações são salvas
- [ ] Fotos ocultas não aparecem no público

### Comparação Destacada
- [ ] Botão "Criar Antes/Depois" funciona
- [ ] Modal de criação abre
- [ ] Comparação é criada
- [ ] Comparação aparece no privado com controles
- [ ] Comparação aparece no público (se visível)
- [ ] Comparação não aparece no público (se oculta)

### Problemas Encontrados
```
Descreva aqui qualquer problema que encontrou:
1. 
2. 
3. 
```

### Erros do Console
```
Cole aqui os erros do console (F12):


```

---

**Criado em**: 26/01/2026  
**Objetivo**: Testar e debugar o sistema completo
