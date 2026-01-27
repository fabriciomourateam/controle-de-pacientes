# 🎨 GUIA VISUAL: Como Criar Comparação Antes/Depois

## 🚀 PASSO A PASSO COM IMAGENS

### 1️⃣ Acesse o PatientPortal

**URL correta:** `/portal/:token`

❌ **NÃO acesse:** `/checkins/evolution/:telefone` (essa página não tem os botões)

---

### 2️⃣ Localize o Card "Evolução Fotográfica"

Role a página até encontrar o card com as fotos do paciente.

**Você verá 2 botões:**

```
┌─────────────────────────────────────────────────────────┐
│ 📸 Evolução Fotográfica                                 │
│                                                         │
│ [Fotos do paciente aqui]                               │
│                                                         │
│ ┌──────────────────────┐  ┌──────────────────────┐   │
│ │ Criar Antes/Depois   │  │ Gerenciar Fotos      │   │
│ │ (Verde Esmeralda)    │  │ (Azul)               │   │
│ └──────────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

### 3️⃣ Clique em "Criar Antes/Depois" (Verde)

✅ **CORRETO:** Botão verde esmeralda com texto "Criar Antes/Depois"

❌ **ERRADO:** Botão azul "Gerenciar Fotos" (esse é para ocultar fotos)

---

### 4️⃣ Modal de Criação Abre

Você verá um modal com:

```
┌─────────────────────────────────────────────────────────┐
│ ✨ Criar Comparação Antes/Depois                        │
│                                                         │
│ Título: [Minha Transformação                    ]      │
│                                                         │
│ Descrição: [Opcional...                         ]      │
│                                                         │
│ ┌─────────────────────┐  ┌─────────────────────┐     │
│ │ 1. Selecione ANTES  │  │ 2. Selecione DEPOIS │     │
│ │                     │  │                     │     │
│ │ [Grade de fotos]    │  │ [Grade de fotos]    │     │
│ │                     │  │                     │     │
│ └─────────────────────┘  └─────────────────────┘     │
│                                                         │
│              [Cancelar]  [Criar Comparação]            │
└─────────────────────────────────────────────────────────┘
```

---

### 5️⃣ Selecione a Foto ANTES

Clique em UMA foto na grade da esquerda.

**A foto selecionada ficará:**
- Com borda vermelha
- Com um ícone de check verde
- Com fundo vermelho transparente

```
┌─────────────────────┐
│ 1. Selecione ANTES  │
│                     │
│ ┌───┐ ┌───┐        │
│ │ ✓ │ │   │  ← Clique em uma foto
│ └───┘ └───┘        │
│ ┌───┐ ┌───┐        │
│ │   │ │   │        │
│ └───┘ └───┘        │
└─────────────────────┘
```

---

### 6️⃣ Selecione a Foto DEPOIS

Clique em UMA foto na grade da direita.

**A foto selecionada ficará:**
- Com borda verde esmeralda
- Com um ícone de check verde
- Com fundo verde transparente

```
┌─────────────────────┐
│ 2. Selecione DEPOIS │
│                     │
│ ┌───┐ ┌───┐        │
│ │   │ │ ✓ │  ← Clique em uma foto
│ └───┘ └───┘        │
│ ┌───┐ ┌───┐        │
│ │   │ │   │        │
│ └───┘ └───┘        │
└─────────────────────┘
```

---

### 7️⃣ Preencha Título e Descrição (Opcional)

```
Título: Minha Transformação de 3 Meses
        ↑ Personalize como quiser

Descrição: Foram 90 dias de dedicação e foco...
           ↑ Opcional, mas recomendado
```

---

### 8️⃣ Clique em "Criar Comparação"

O botão está no canto inferior direito do modal.

**Você verá:**
- Toast de confirmação: "Comparação salva!"
- Modal fecha automaticamente
- Comparação é salva no banco de dados

---

### 9️⃣ Verifique no Banco de Dados

Execute no Supabase SQL Editor:

```sql
SELECT * FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE';
```

**Deve retornar:**
```
id          | abc-123-def
telefone    | 5511999999999
title       | Minha Transformação de 3 Meses
is_visible  | true  ← IMPORTANTE: deve ser true
before_photo_url | https://...
after_photo_url  | https://...
created_at  | 2024-01-26 10:30:00
```

---

### 🔟 Acesse o Portal Público

**URL:** `/public/portal/:telefone`

**Você verá a comparação no topo:**

```
┌─────────────────────────────────────────────────────────┐
│ ✨ Minha Transformação de 3 Meses                       │
│                                                         │
│ 🔥 5.2 kg perdidos | 📅 90 dias de transformação       │
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐           │
│ │      ANTES       │  │      DEPOIS      │           │
│ │                  │  │                  │           │
│ │  [Foto Antes]    │  │  [Foto Depois]   │           │
│ │                  │  │                  │           │
│ │  01/10/2024      │  │  30/12/2024      │           │
│ │  75.0 kg         │  │  69.8 kg         │           │
│ └──────────────────┘  └──────────────────┘           │
│                                                         │
│ 🎉 Incrível! Uma transformação de 5.2 kg em 90 dias!  │
│ Continue assim, você está no caminho certo! 💪         │
└─────────────────────────────────────────────────────────┘
```

---

## ❌ ERROS COMUNS

### Erro 1: "Não encontro o botão 'Criar Antes/Depois'"

**Causa:** Você está na página errada

**Solução:**
- ❌ NÃO use `/checkins/evolution/:telefone`
- ✅ USE `/portal/:token`

---

### Erro 2: "Cliquei mas abriu um editor diferente"

**Causa:** Você clicou no botão errado

**Você viu isso?**
```
┌─────────────────────────────────────────────────────────┐
│ Editor de Comparação - Antes e Depois                  │
│                                                         │
│ [Foto lado a lado com zoom e drag]                     │
│                                                         │
│ [Zoom In] [Zoom Out] [Resetar]                         │
└─────────────────────────────────────────────────────────┘
```

**Isso é o PhotoComparisonEditor (ERRADO)**

❌ Esse sistema NÃO salva comparação pública
❌ Esse sistema é apenas para ajustar zoom/posição

**Solução:**
- Feche esse modal
- Procure o botão **"Criar Antes/Depois"** (verde esmeralda)
- NÃO confunda com outros botões

---

### Erro 3: "Criei mas não aparece no público"

**Causa 1:** Comparação está oculta

**Solução:**
```sql
UPDATE featured_photo_comparison
SET is_visible = true
WHERE telefone = 'SEU_TELEFONE';
```

**Causa 2:** Cache do navegador

**Solução:**
- Ctrl+Shift+Delete
- Limpar cache
- Recarregar com Ctrl+F5

**Causa 3:** Você usou o sistema errado

**Solução:**
- Deletar e criar novamente usando o botão correto

---

### Erro 4: "Modal não mostra fotos"

**Causa:** Paciente não tem fotos cadastradas

**Você vê isso?**
```
┌─────────────────────┐
│ 1. Selecione ANTES  │
│                     │
│ 📸 Nenhuma foto     │
│    disponível       │
│                     │
│ Adicione fotos ao   │
│ paciente ou check-  │
│ ins primeiro        │
└─────────────────────┘
```

**Solução:**
1. Feche o modal
2. Adicione fotos ao paciente:
   - Edite o paciente
   - Adicione fotos iniciais (foto_inicial_frente, foto_inicial_lado, etc)
3. OU adicione fotos nos check-ins:
   - Crie um check-in
   - Adicione fotos (foto_1, foto_2, foto_3, foto_4)
4. Tente criar a comparação novamente

---

## 🎯 CHECKLIST VISUAL

Use este checklist para garantir que está fazendo certo:

- [ ] Acessei `/portal/:token` (não `/checkins/evolution/:telefone`)
- [ ] Encontrei o card "Evolução Fotográfica"
- [ ] Cliquei no botão **"Criar Antes/Depois"** (verde esmeralda)
- [ ] Modal abriu com grade de fotos
- [ ] Selecionei 1 foto na grade da ESQUERDA (ANTES)
- [ ] Selecionei 1 foto na grade da DIREITA (DEPOIS)
- [ ] Preenchi o título
- [ ] Cliquei em "Criar Comparação"
- [ ] Vi toast de confirmação
- [ ] Executei SQL e vi `is_visible = true`
- [ ] Acessei `/public/portal/:telefone`
- [ ] Comparação apareceu no topo

Se TODOS os itens estão marcados, a comparação DEVE aparecer.

---

## 🆘 AINDA COM DÚVIDAS?

Leia os outros arquivos de ajuda:

1. **`DIFERENCA_SISTEMAS_FOTOS.md`**
   - Explica diferença entre os 2 sistemas
   - Mostra qual usar e quando

2. **`TROUBLESHOOTING_COMPARACAO.md`**
   - Checklist completo de verificação
   - Solução para cada problema

3. **`SITUACAO_ATUAL_COMPARACAO.md`**
   - Resumo técnico do que está implementado
   - Análise do problema

4. **`verificar-featured-comparison.sql`**
   - SQL pronto para verificar banco de dados
   - SQL para corrigir problemas

---

## 📞 SUPORTE

Se seguiu TODOS os passos e ainda não funciona:

1. Execute o SQL de verificação
2. Copie os logs do console (F12)
3. Tire prints da tela
4. Envie tudo para análise

Com essas informações, conseguimos identificar o problema exato.
