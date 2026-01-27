# 🎯 PASSO A PASSO: Criar Comparação Antes/Depois

## ✅ STATUS ATUAL
- ✅ Tabela SQL criada (`featured_photo_comparison`)
- ✅ Hook implementado (`use-featured-comparison.ts`)
- ✅ Componente visual criado (`FeaturedComparison.tsx`)
- ✅ Modal de criação implementado (`CreateFeaturedComparisonModal.tsx`)
- ✅ Integração no PatientPortal.tsx (portal privado)
- ✅ Integração no PublicPortal.tsx (portal público)
- ⚠️ **FALTA**: Criar a primeira comparação!

---

## 📋 COMO CRIAR A COMPARAÇÃO

### 1️⃣ Acesse o Portal Privado
```
http://localhost:5160/portal/SEU_TOKEN_AQUI
```
**Importante**: Use o token do portal privado, NÃO o telefone público!

---

### 2️⃣ Localize o Dropdown (⋮)
No canto superior direito da página, você verá:
- Botão "Instalar App" (ícone de smartphone)
- **Botão com 3 pontinhos verticais (⋮)** ← CLIQUE AQUI!

---

### 3️⃣ Abra o Menu Dropdown
Ao clicar no botão (⋮), deve abrir um menu com estas opções:
- 👁️ Visualizar Evolução
- 🖼️ Baixar Evolução PNG
- 📄 Baixar Evolução PDF
- ✨ **Criar Antes/Depois** ← CLIQUE AQUI!
- 🔄 Atualizar Dados

---

### 4️⃣ Clique em "Criar Antes/Depois"
Deve abrir um modal grande com:
- Título: "Criar Comparação Antes/Depois"
- 2 colunas de fotos (ANTES e DEPOIS)
- Campos de título e descrição

---

### 5️⃣ Selecione as Fotos

**Coluna Esquerda (ANTES):**
- Clique em uma foto antiga
- A borda fica **VERMELHA** quando selecionada
- Aparece um ✓ verde no centro

**Coluna Direita (DEPOIS):**
- Clique em uma foto recente
- A borda fica **VERDE** quando selecionada
- Aparece um ✓ verde no centro

---

### 6️⃣ Preencha os Campos

**Título** (obrigatório):
```
Ex: "Minha Transformação em 3 Meses"
```

**Descrição** (opcional):
```
Ex: "Resultado de muito treino e dedicação!"
```

---

### 7️⃣ Clique em "Criar Comparação"
- Deve aparecer um toast: "Comparação salva!"
- O modal fecha automaticamente
- A comparação aparece na página (ANTES do card de fotos)

---

### 8️⃣ Verifique no Portal Público
```
http://localhost:5160/public/portal/5511961454215
```
(Substitua pelo telefone correto)

A comparação deve aparecer automaticamente com:
- Layout bonito e moderno
- Fotos lado a lado (ANTES/DEPOIS)
- Estatísticas (kg perdidos, dias de transformação)
- **SEM** botões de controle (somente visualização)

---

## 🐛 SE O BOTÃO NÃO APARECER

### Verifique:
1. ✅ Você está no **portal privado** (`/portal/:token`)?
2. ✅ O paciente tem **check-ins** com fotos?
3. ✅ O dropdown está abrindo?

### Debug no Console (F12):
Procure por estas mensagens:
```
🎯 PublicPortal: Telefone: 5511961454215
🎯 PublicPortal: Comparação carregada: null
🎯 FeaturedComparison: Dados recebidos: null
```

Se aparecer `null`, significa que ainda não foi criada!

---

## 📊 VERIFICAR NO BANCO DE DADOS

Execute este SQL no Supabase:
```sql
SELECT * FROM featured_photo_comparison 
WHERE telefone = '5511961454215';
```

**Resultado esperado ANTES de criar:**
```
(0 linhas)
```

**Resultado esperado DEPOIS de criar:**
```
id | telefone | title | is_visible | before_photo_url | after_photo_url | ...
1  | 5511... | Minha... | true | https://... | https://... | ...
```

---

## ✅ CHECKLIST COMPLETO

- [ ] Acessei o portal privado (`/portal/:token`)
- [ ] Encontrei o botão dropdown (⋮) no canto superior direito
- [ ] Cliquei no dropdown e vi a opção "Criar Antes/Depois"
- [ ] Cliquei em "Criar Antes/Depois" e o modal abriu
- [ ] Selecionei uma foto ANTES (borda vermelha)
- [ ] Selecionei uma foto DEPOIS (borda verde)
- [ ] Preenchi o título
- [ ] Cliquei em "Criar Comparação"
- [ ] Vi o toast "Comparação salva!"
- [ ] A comparação apareceu no portal privado
- [ ] Acessei o portal público e vi a comparação lá também

---

## 🎨 COMO DEVE FICAR

### Portal Privado (com controles):
```
┌──────────────────────────────────────────────────────┐
│ ✨ Minha Transformação          [👁️ Visível] [✏️] [🗑️] │
│ Resultado de muito treino e dedicação!               │
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
│ Resultado de muito treino e dedicação!               │
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

## 🆘 PRECISA DE AJUDA?

Se ainda não funcionar:
1. Tire um print do console (F12)
2. Execute o SQL de verificação
3. Tire um print da tela do portal privado
4. Me envie os prints para análise

---

**Criado em**: 26/01/2026  
**Status**: 📋 Aguardando Criação da Primeira Comparação
