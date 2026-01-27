# 📝 Guia Rápido: Editar Análise da Evolução

## Como Usar o Sistema de Edição de Cards

---

## 🎯 Cenário de Uso

Você ajustou o peso de uma aluna de 3kg para 2.2kg, mas a análise da IA já tinha sido gerada com os dados antigos. Agora você pode:

1. **Atualizar a análise** para recalcular com os dados corretos
2. **Editar cards** manualmente se quiser personalizar a mensagem
3. **Adicionar novos cards** com insights específicos
4. **Excluir cards** que não fazem sentido

---

## 🚀 Passo a Passo

### 1️⃣ Atualizar Análise (Recalcular com Dados Atualizados)

1. Acesse o portal do paciente: `/portal/:token`
2. Role até a seção **"Análise da sua Evolução"**
3. Clique no botão **"🔄 Atualizar Análise"** no canto superior direito
4. Aguarde alguns segundos (o ícone vai girar)
5. ✅ Pronto! A análise foi recalculada com os dados atualizados

**Quando usar**: Sempre que você ajustar peso, medidas ou outros dados do paciente e quiser que a análise reflita as mudanças.

---

### 2️⃣ Ativar Modo de Edição

1. Na seção **"Análise da sua Evolução"**
2. Clique no botão **"✏️ Editar"** no canto superior direito
3. O botão ficará laranja e você verá:
   - Botões **"+ Adicionar"** em cada seção
   - Botões de ação nos cards customizados (ao passar o mouse)

**Para sair**: Clique em **"Concluir Edição"**

---

### 3️⃣ Adicionar Novo Card

1. Ative o modo de edição (botão "✏️ Editar")
2. Escolha a seção onde quer adicionar:
   - **Pontos Fortes** (verde)
   - **Pontos de Atenção** (laranja)
   - **Próximas Metas** (azul)
3. Clique no botão **"+ Adicionar"** da seção
4. No modal que abrir:
   - **Escolha um emoji** (clique em um dos 12 sugeridos ou digite um customizado)
   - **Digite o título** (ex: "Perda de peso consistente")
   - **Digite a descrição** (ex: "Redução de 2.2kg em 4 semanas")
   - **Adicione recomendação** (opcional, ex: "Continue com o déficit calórico moderado")
   - **Escolha prioridade** (apenas para Pontos de Atenção)
5. Clique em **"Criar Card"**
6. ✅ O novo card aparecerá na seção escolhida!

---

### 4️⃣ Editar Card Existente

1. Ative o modo de edição (botão "✏️ Editar")
2. Passe o mouse sobre um **card customizado** (você verá botões aparecerem)
3. Clique no botão **"✏️ Editar"** (azul)
4. No modal que abrir, modifique os campos desejados
5. Clique em **"Salvar Alterações"**
6. ✅ O card foi atualizado!

**Nota**: Você só pode editar cards que você criou. Cards gerados pela IA não têm botões de edição.

---

### 5️⃣ Excluir Card

1. Ative o modo de edição (botão "✏️ Editar")
2. Passe o mouse sobre um **card customizado**
3. Clique no botão **"🗑️ Excluir"** (vermelho)
4. Confirme a exclusão
5. ✅ O card foi removido!

**Nota**: Você só pode excluir cards que você criou. Cards gerados pela IA não podem ser excluídos.

---

## 🎨 Dicas de Uso

### Emojis Sugeridos por Seção

**Pontos Fortes** (verde):
- 💪 Força/Treino
- 🎯 Meta alcançada
- ⭐ Destaque
- 🏆 Conquista
- ✨ Progresso
- 🔥 Motivação
- 📈 Evolução
- 💯 Perfeito
- 👏 Parabéns
- 🎉 Celebração
- 🌟 Brilho
- 💚 Saúde

**Pontos de Atenção** (laranja):
- ⚠️ Atenção
- 🚨 Alerta
- ⏰ Urgente
- 📊 Análise
- 🔍 Observar
- 💡 Ideia
- 🎯 Foco
- 📉 Queda
- ⚡ Energia
- 🔔 Lembrete
- 👀 Olhar
- 📌 Importante

**Próximas Metas** (azul):
- 🎯 Meta
- 🚀 Lançamento
- 🏃 Ação
- 💪 Força
- 📈 Crescimento
- 🎓 Aprendizado
- 🌱 Desenvolvimento
- ⭐ Objetivo
- 🔥 Motivação
- 💡 Estratégia
- 🎪 Desafio
- 🏅 Conquista

---

## 📱 O Que o Paciente Vê

No portal público (`/public/portal/:telefone`), o paciente vê:

- ✅ Todos os cards da IA
- ✅ Todos os cards customizados que você criou
- ✅ Tudo integrado de forma natural
- ❌ Não vê botões de edição
- ❌ Não sabe quais cards são da IA e quais você personalizou

**Resultado**: Uma análise personalizada e profissional! 🎯

---

## 💡 Exemplos de Uso

### Exemplo 1: Ajustar Perda de Peso

**Situação**: Você ajustou o peso de 3kg para 2.2kg

**Solução**:
1. Clique em "🔄 Atualizar Análise"
2. A IA recalcula e mostra "Redução de 2.2kg"
3. Se quiser personalizar, edite o card ou adicione um novo

---

### Exemplo 2: Adicionar Motivação Extra

**Situação**: Paciente está desmotivado, você quer adicionar uma mensagem especial

**Solução**:
1. Ative modo de edição
2. Clique em "+ Adicionar" em **Pontos Fortes**
3. Emoji: 🌟
4. Título: "Você está no caminho certo!"
5. Descrição: "Mesmo com os desafios, você manteve a consistência. Isso é o que faz a diferença!"
6. Criar Card
7. ✅ Mensagem personalizada aparece para o paciente!

---

### Exemplo 3: Remover Card Irrelevante

**Situação**: A IA gerou um card sobre cardio, mas o paciente não faz cardio

**Solução**:
1. Ative modo de edição
2. Passe o mouse sobre o card customizado (se você criou)
3. Clique em "🗑️ Excluir"
4. Confirme
5. ✅ Card removido!

**Nota**: Se o card foi gerado pela IA, você não pode excluí-lo. Mas pode adicionar um novo card explicando o contexto.

---

## ❓ Perguntas Frequentes

### P: Posso editar cards gerados pela IA?
**R**: Não diretamente. Mas você pode:
- Atualizar a análise para recalcular
- Adicionar um novo card com sua versão personalizada

### P: Os cards customizados aparecem para o paciente?
**R**: Sim! Eles aparecem integrados com os cards da IA no portal público.

### P: Posso reordenar os cards?
**R**: Ainda não. Os cards customizados aparecem primeiro, depois os da IA. Futuramente teremos drag-and-drop.

### P: O que acontece se eu excluir um card?
**R**: Ele é ocultado (soft delete), mas não é deletado permanentemente do banco de dados.

### P: Posso copiar cards entre pacientes?
**R**: Ainda não. Cada card é específico para um paciente. Futuramente teremos templates.

---

## 🎉 Pronto!

Agora você pode personalizar completamente a análise de evolução dos seus pacientes! 💪

**Dúvidas?** Consulte a documentação completa em `SISTEMA_EDICAO_ANALISE_IA_IMPLEMENTADO.md`
