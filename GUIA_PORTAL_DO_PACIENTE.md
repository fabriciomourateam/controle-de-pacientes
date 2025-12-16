# 📱 Guia Completo: Portal do Paciente

## Como Funciona o Sistema

O portal do paciente é um sistema de **acesso individual e seguro** onde cada aluno pode ver apenas seus próprios dados, sem precisar fazer login.

---

## 🔐 Sistema de Segurança

### Como Funciona:
1. **Token Único**: Cada paciente recebe um token único e seguro (32 caracteres aleatórios)
2. **Sem Senha**: O aluno não precisa criar senha ou fazer login
3. **Link Personalizado**: Cada aluno tem seu próprio link exclusivo
4. **Seguro**: O token é impossível de adivinhar e pode ser revogado a qualquer momento

### Exemplo de Link:
```
https://seusite.com/portal/aBc3dEf7gHj9kLm2nPq4rSt6vWx8yZ12
```

---

## 📤 Como Enviar o Portal para o Aluno

### Método 1: Pela Lista de Pacientes (Recomendado)

1. **Acesse a lista de pacientes** no sistema
2. **Encontre o paciente** desejado
3. **Clique no botão "Portal do Paciente"** (ícone de smartphone/link)
4. **O sistema irá:**
   - Gerar automaticamente um token único
   - Copiar o link para sua área de transferência
   - Mostrar uma mensagem de sucesso

5. **Envie o link** para o aluno via:
   - WhatsApp ✅ (Recomendado)
   - Email
   - SMS
   - Telegram
   - Qualquer outro meio

### Método 2: Pela Página do Paciente

1. **Abra a página de detalhes** do paciente
2. **Procure pelo botão "Enviar Portal"** ou "Gerar Link"
3. **Copie o link** gerado
4. **Envie para o aluno**

---

## 💬 Mensagem Sugerida para Enviar ao Aluno

### WhatsApp (Recomendado):
```
Olá [Nome]! 👋

Seu portal de acompanhamento está pronto! 🎉

Acesse aqui: [LINK]

No portal você pode:
✅ Ver seu plano alimentar
✅ Marcar refeições consumidas
✅ Acompanhar sua evolução
✅ Ver gráficos de progresso
✅ Registrar seu peso
✅ Desbloquear conquistas

💡 Dica: Adicione à tela inicial do celular para acesso rápido!

Qualquer dúvida, estou à disposição! 😊
```

### Email:
```
Assunto: Seu Portal de Acompanhamento Está Pronto! 🎉

Olá [Nome],

Seu portal personalizado de acompanhamento nutricional está disponível!

🔗 Acesse aqui: [LINK]

No portal você terá acesso a:
• Seu plano alimentar completo
• Acompanhamento de refeições
• Gráficos de evolução
• Registro de peso
• Sistema de conquistas e metas

📱 Recomendamos adicionar à tela inicial do celular para acesso rápido.

Atenciosamente,
[Seu Nome]
```

---

## 📱 Como o Aluno Instala o "App" no Celular

O portal funciona como um **PWA (Progressive Web App)**, ou seja, pode ser instalado como um app nativo!

### No iPhone (iOS):

1. **Abra o link** no Safari (navegador padrão)
2. **Toque no botão de compartilhar** (quadrado com seta para cima)
3. **Role para baixo** e toque em **"Adicionar à Tela de Início"**
4. **Dê um nome** (ex: "Meu Acompanhamento")
5. **Toque em "Adicionar"**
6. **Pronto!** Um ícone aparecerá na tela inicial

### No Android:

#### Método 1 - Chrome (Automático):
1. **Abra o link** no Chrome
2. **Um banner aparecerá** perguntando "Adicionar à tela inicial?"
3. **Toque em "Adicionar"**
4. **Confirme**
5. **Pronto!** O app está instalado

#### Método 2 - Manual:
1. **Abra o link** no Chrome
2. **Toque nos 3 pontinhos** (menu)
3. **Selecione "Adicionar à tela inicial"**
4. **Dê um nome** ao app
5. **Toque em "Adicionar"**
6. **Pronto!**

### Vantagens do PWA:
- ✅ **Funciona offline** (dados em cache)
- ✅ **Ícone na tela inicial** (parece um app nativo)
- ✅ **Abre em tela cheia** (sem barra do navegador)
- ✅ **Notificações push** (futuro)
- ✅ **Rápido e leve** (não ocupa espaço)
- ✅ **Atualiza automaticamente**

---

## 🔧 Configuração Técnica (Para Você)

### 1. Verificar se a Tabela Existe

Execute este SQL no Supabase:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'patient_portal_tokens'
);
```

Se retornar `false`, você precisa criar a tabela:

```sql
-- Criar tabela de tokens
CREATE TABLE IF NOT EXISTS patient_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_patient_portal_tokens_telefone ON patient_portal_tokens(telefone);
CREATE INDEX idx_patient_portal_tokens_token ON patient_portal_tokens(token);
CREATE INDEX idx_patient_portal_tokens_active ON patient_portal_tokens(is_active);

-- RLS (Row Level Security)
ALTER TABLE patient_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Apenas o sistema pode gerenciar tokens
CREATE POLICY "Sistema pode gerenciar tokens"
  ON patient_portal_tokens
  FOR ALL
  USING (true);
```

### 2. Configurar URL Base

No arquivo `.env`:
```env
VITE_APP_URL=https://seusite.com
```

### 3. Testar o Sistema

1. Gere um link para um paciente de teste
2. Abra o link em uma aba anônima
3. Verifique se os dados aparecem corretamente
4. Teste em mobile (iPhone e Android)

---

## 🎯 Funcionalidades do Portal

### O que o Aluno Pode Ver:

#### 1. Plano Alimentar
- ✅ Todas as refeições do dia
- ✅ Alimentos e quantidades
- ✅ Calorias e macros
- ✅ Substituições de alimentos
- ✅ Orientações nutricionais

#### 2. Acompanhamento
- ✅ Marcar refeições como consumidas
- ✅ Ver progresso diário
- ✅ Acompanhar calorias consumidas
- ✅ Ver percentual de conclusão

#### 3. Metas Diárias
- ✅ Desafios do dia (água, sono, etc)
- ✅ Sistema de pontos
- ✅ Sequência de dias

#### 4. Progresso
- ✅ Gráfico semanal
- ✅ Gráfico mensal
- ✅ Estatísticas de adesão
- ✅ Dias perfeitos

#### 5. Conquistas
- ✅ Badges desbloqueados
- ✅ Níveis e XP
- ✅ Ranking (futuro)

#### 6. Minha Evolução
- ✅ Gráficos de peso
- ✅ Comparação de fotos
- ✅ Timeline de check-ins
- ✅ Registro de peso diário
- ✅ Medidas corporais

#### 7. Orientações
- ✅ Exames e avaliações
- ✅ Fotos de evolução
- ✅ Histórico completo

---

## 🔒 Segurança e Privacidade

### O que o Aluno NÃO Pode Fazer:
- ❌ Ver dados de outros alunos
- ❌ Editar o plano alimentar
- ❌ Deletar dados
- ❌ Acessar área administrativa
- ❌ Ver informações sensíveis

### Controle de Acesso:
- ✅ Token único por aluno
- ✅ Validação a cada acesso
- ✅ Pode ser revogado a qualquer momento
- ✅ Expiração configurável (opcional)
- ✅ Rastreamento de acessos

### Como Revogar Acesso:

Se precisar bloquear o acesso de um aluno:

```sql
-- Revogar token específico
UPDATE patient_portal_tokens
SET is_active = false
WHERE telefone = '11999999999';

-- Ou revogar token específico
UPDATE patient_portal_tokens
SET is_active = false
WHERE token = 'TOKEN_AQUI';
```

---

## 📊 Estatísticas de Uso

### Ver Quantos Acessos um Aluno Teve:

```sql
SELECT 
  telefone,
  token,
  access_count,
  last_accessed_at,
  created_at
FROM patient_portal_tokens
WHERE telefone = '11999999999'
ORDER BY created_at DESC;
```

### Ver Alunos Mais Ativos:

```sql
SELECT 
  p.nome,
  t.telefone,
  t.access_count,
  t.last_accessed_at
FROM patient_portal_tokens t
JOIN patients p ON p.telefone = t.telefone
WHERE t.is_active = true
ORDER BY t.access_count DESC
LIMIT 10;
```

---

## 🎨 Personalização (Futuro)

### Ideias para Melhorar:

1. **Notificações Push**
   - Lembrete de refeições
   - Parabenizar por conquistas
   - Avisar sobre novos planos

2. **Modo Offline**
   - Funcionar sem internet
   - Sincronizar quando conectar

3. **Compartilhamento**
   - Compartilhar conquistas
   - Compartilhar progresso

4. **Gamificação Avançada**
   - Ranking entre alunos
   - Desafios em grupo
   - Recompensas

---

## ❓ Perguntas Frequentes

### 1. O link expira?
Por padrão, não. Mas você pode configurar expiração se quiser.

### 2. Posso gerar um novo link?
Sim! Basta clicar novamente no botão. O link antigo continuará funcionando.

### 3. Como sei se o aluno acessou?
Verifique a coluna `last_accessed_at` e `access_count` na tabela.

### 4. Posso ter múltiplos links ativos?
Sim, mas recomendamos usar apenas um por aluno.

### 5. O aluno precisa de internet?
Sim, mas o PWA funciona parcialmente offline após o primeiro acesso.

### 6. Funciona em qualquer celular?
Sim! iPhone, Android, tablets, etc.

### 7. Precisa instalar da loja?
Não! É um PWA, instala direto do navegador.

### 8. Como atualizo o portal?
Automático! Quando você faz deploy, todos os alunos recebem a atualização.

---

## 🚀 Próximos Passos

1. ✅ **Teste o sistema** com um paciente real
2. ✅ **Colete feedback** sobre usabilidade
3. ✅ **Ajuste conforme necessário**
4. ✅ **Envie para todos os alunos**
5. ✅ **Monitore o uso** e engajamento

---

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique se a tabela `patient_portal_tokens` existe
2. Verifique se o token está ativo no banco
3. Teste em modo anônimo do navegador
4. Verifique o console do navegador para erros

---

## ✨ Conclusão

O portal do paciente é uma ferramenta poderosa para:
- ✅ **Engajar** seus alunos
- ✅ **Facilitar** o acompanhamento
- ✅ **Aumentar** a adesão ao plano
- ✅ **Melhorar** os resultados
- ✅ **Profissionalizar** seu atendimento

**Comece hoje mesmo!** 🚀
