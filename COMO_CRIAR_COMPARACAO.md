# 🎯 Como Criar Comparação Antes/Depois

## Passo a Passo COMPLETO

### 1️⃣ Acesse o Portal Privado
```
http://localhost:5160/portal/SEU_TOKEN_AQUI
```

### 2️⃣ Procure o Menu Dropdown
- No canto superior direito da página
- Ícone de **3 pontinhos verticais** (⋮)
- Ao lado do botão "Instalar App"

### 3️⃣ Clique no Dropdown
- Deve abrir um menu com várias opções:
  - Visualizar Evolução
  - Baixar Evolução PNG
  - Baixar Evolução PDF
  - **Criar Antes/Depois** ← ESTE AQUI!
  - Atualizar Dados

### 4️⃣ Clique em "Criar Antes/Depois"
- Deve abrir um modal grande
- Com 2 colunas de fotos

### 5️⃣ Selecione as Fotos
**Coluna Esquerda (ANTES):**
- Clique em uma foto antiga
- A borda fica VERMELHA quando selecionada
- Aparece um ✓ verde

**Coluna Direita (DEPOIS):**
- Clique em uma foto recente
- A borda fica VERDE quando selecionada
- Aparece um ✓ verde

### 6️⃣ Preencha os Campos
- **Título**: Ex: "Minha Transformação em 3 Meses"
- **Descrição** (opcional): Ex: "Resultado de muito treino e dedicação!"

### 7️⃣ Clique em "Criar Comparação"
- Deve aparecer um toast: "Comparação salva!"
- O modal fecha
- A comparação aparece na página (ANTES do card de fotos)

### 8️⃣ Verifique no Portal Público
```
http://localhost:5160/public/portal/5511961454215
```
- A comparação deve aparecer automaticamente
- Com layout bonito e moderno
- SEM botões de controle

---

## 🐛 Se o Botão "Criar Antes/Depois" NÃO Aparecer

### Verifique:
1. Você está no **portal privado** (`/portal/:token`)?
2. O paciente tem **check-ins** com fotos?
3. O dropdown está abrindo?

### Debug:
Abra o console (F12) e procure por:
```
🎯 PublicPortal: Telefone: 5511961454215
🎯 PublicPortal: Comparação carregada: null
```

Se aparecer `null`, significa que ainda não foi criada!

---

## 📸 Como Deve Ficar

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

## ✅ Depois de Criar

Execute o SQL novamente para verificar:
```sql
SELECT * FROM featured_photo_comparison 
WHERE telefone = '5511961454215';
```

Deve retornar 1 linha com:
- `title`: "Minha Transformação"
- `is_visible`: true
- `before_photo_url`: URL da foto antes
- `after_photo_url`: URL da foto depois

---

**Criado em**: 26/01/2026  
**Status**: 📋 Aguardando Criação da Comparação
