# 🚀 Guia Rápido: Comparação Antes/Depois

## 📋 Passo a Passo

### 1️⃣ Executar SQL (PRIMEIRO PASSO - OBRIGATÓRIO)

```bash
# Acesse o Supabase SQL Editor:
https://supabase.com/dashboard/project/YOUR_PROJECT/sql

# Cole e execute o arquivo:
controle-de-pacientes/sql/create-featured-comparison-table.sql
```

**⚠️ IMPORTANTE**: Sem executar o SQL, o sistema não funcionará!

---

### 2️⃣ Criar Comparação no Portal Privado

1. Acesse o portal privado: `/portal/:token`
2. Clique no menu dropdown (⋮) no canto superior direito
3. Clique em **"Criar Antes/Depois"**
4. No modal que abrir:
   - **Esquerda**: Selecione a foto ANTES (borda vermelha)
   - **Direita**: Selecione a foto DEPOIS (borda verde)
   - **Título**: Personalize (ex: "Minha Jornada de 3 Meses")
   - **Descrição**: Adicione uma mensagem motivacional (opcional)
5. Clique em **"Criar Comparação"**

✅ A comparação aparecerá no portal com controles de edição

---

### 3️⃣ Controlar Visibilidade

No portal privado, você verá 3 botões na comparação:

- **👁️ Visível/Oculto**: Clique para alternar
  - Verde = Visível no portal público
  - Cinza = Oculto do portal público
  
- **✏️ Editar**: Abre o modal para alterar fotos/texto

- **🗑️ Deletar**: Remove a comparação completamente

---

### 4️⃣ Visualizar no Portal Público

1. Acesse o portal público: `/public/portal/:telefone`
2. Se a comparação estiver **visível**, ela aparecerá automaticamente
3. Se estiver **oculta**, não aparecerá

**Diferenças do portal público:**
- ❌ SEM botões de controle
- ✅ Layout moderno e responsivo
- ✅ Estatísticas automáticas
- ✅ Mensagem motivacional

---

## 🎨 Preview Visual

### Portal Privado (com controles)
```
┌──────────────────────────────────────────────────────────┐
│ ✨ Minha Transformação          [👁️ Visível] [✏️] [🗑️] │
│ Descrição da jornada...                                  │
│ 🔽 5.2 kg perdidos  📅 90 dias                           │
├──────────────────────────────────────────────────────────┤
│    ANTES (vermelho)    │    DEPOIS (verde)    ✨        │
│    [Foto 1]            │    [Foto 2]        (badge)     │
│    05/01/2026          │    05/04/2026                  │
│    68 kg               │    62.8 kg                     │
├──────────────────────────────────────────────────────────┤
│ 🎉 Incrível! 5.2 kg em 90 dias! Continue assim! 💪      │
└──────────────────────────────────────────────────────────┘
```

### Portal Público (somente visualização)
```
┌──────────────────────────────────────────────────────────┐
│ ✨ Minha Transformação                                   │
│ Descrição da jornada...                                  │
│ 🔽 5.2 kg perdidos  📅 90 dias                           │
├──────────────────────────────────────────────────────────┤
│    ANTES (vermelho)    │    DEPOIS (verde)    ✨        │
│    [Foto 1]            │    [Foto 2]        (badge)     │
│    05/01/2026          │    05/04/2026                  │
│    68 kg               │    62.8 kg                     │
├──────────────────────────────────────────────────────────┤
│ 🎉 Incrível! 5.2 kg em 90 dias! Continue assim! 💪      │
└──────────────────────────────────────────────────────────┘
```

---

## ❓ FAQ

### P: Posso criar mais de uma comparação por paciente?
**R**: Não, o sistema permite apenas 1 comparação por paciente. Se criar outra, substituirá a anterior.

### P: Como alterar as fotos depois de criar?
**R**: Clique no botão ✏️ Editar e selecione novas fotos.

### P: O que acontece se eu ocultar a comparação?
**R**: Ela continua visível no portal privado, mas desaparece do portal público.

### P: Posso deletar e criar outra?
**R**: Sim! Clique em 🗑️ Deletar e depois crie uma nova.

### P: As estatísticas são automáticas?
**R**: Sim! O sistema calcula automaticamente:
- Peso perdido/ganho
- Dias de transformação
- Mensagem motivacional personalizada

---

## 🐛 Problemas Comuns

### Erro: "Não foi possível salvar a comparação"
- ✅ Verifique se executou o SQL no Supabase
- ✅ Verifique se selecionou 2 fotos
- ✅ Verifique a conexão com o banco

### Comparação não aparece no público
- ✅ Verifique se está marcada como "Visível" (👁️ verde)
- ✅ Recarregue a página pública
- ✅ Verifique se o telefone está correto na URL

### Fotos não carregam
- ✅ Verifique se as URLs das fotos estão corretas
- ✅ Verifique se as fotos existem no Google Drive
- ✅ Verifique as permissões de acesso

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase
3. Confirme que o SQL foi executado
4. Teste com outro paciente

---

**Criado em**: 26/01/2026  
**Versão**: 1.0
