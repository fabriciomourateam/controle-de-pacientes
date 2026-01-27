# 🔧 TROUBLESHOOTING: Comparação Antes/Depois não aparece

## 🎯 Problema
Você criou uma comparação Antes/Depois mas ela não aparece no portal público (`/public/portal/:telefone`)

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### 1. Verificar se a comparação existe no banco

Execute no Supabase SQL Editor:

```sql
SELECT 
  id,
  telefone,
  title,
  is_visible,
  before_photo_url,
  after_photo_url,
  created_at
FROM featured_photo_comparison
WHERE telefone = 'SEU_TELEFONE_AQUI';
```

**Resultados possíveis:**

#### ❌ Retorna vazio (0 linhas)
**Causa**: Você não criou a comparação ainda OU usou o sistema errado
**Solução**: 
1. Acesse `/portal/:token` (não `/checkins/evolution/:telefone`)
2. Localize o card "Evolução Fotográfica"
3. Clique no botão **"Criar Antes/Depois"** (verde esmeralda)
4. Selecione 2 fotos e preencha os dados
5. Clique em "Criar Comparação"

#### ⚠️ Retorna 1 linha mas `is_visible = false`
**Causa**: A comparação foi criada mas está oculta
**Solução**: Execute este SQL:
```sql
UPDATE featured_photo_comparison
SET is_visible = true
WHERE telefone = 'SEU_TELEFONE_AQUI';
```

#### ✅ Retorna 1 linha com `is_visible = true`
**Causa**: A comparação existe e está visível
**Próximo passo**: Vá para o passo 2

---

### 2. Verificar se as URLs das fotos estão corretas

Execute no Supabase SQL Editor:

```sql
SELECT 
  telefone,
  before_photo_url,
  after_photo_url,
  LENGTH(before_photo_url) as before_length,
  LENGTH(after_photo_url) as after_length
FROM featured_photo_comparison
WHERE telefone = 'SEU_TELEFONE_AQUI';
```

**Verificar:**
- `before_length` e `after_length` devem ser > 0
- URLs devem começar com `https://` ou `http://`
- URLs devem ser acessíveis (teste copiando e colando no navegador)

**Se as URLs estiverem vazias ou inválidas:**
```sql
-- Deletar comparação inválida
DELETE FROM featured_photo_comparison
WHERE telefone = 'SEU_TELEFONE_AQUI';

-- Criar novamente usando o botão "Criar Antes/Depois"
```

---

### 3. Verificar logs do navegador

Abra o Console do navegador (F12) e acesse `/public/portal/:telefone`

**Procure por estes logs:**

```
🎯 PublicPortal: Telefone: 5511999999999
🎯 PublicPortal: Comparação carregada: { id: '...', ... }
🎯 PublicPortal: Comparação visível? true
🎯 PublicPortal: Comparação loading? false
🎯 PublicPortal: Vai renderizar FeaturedComparison? true
```

**Interpretação:**

#### Se `Comparação carregada: null`
**Causa**: Hook não encontrou a comparação no banco
**Solução**: Volte ao passo 1

#### Se `Comparação visível? false`
**Causa**: `is_visible = false` no banco
**Solução**: Execute o UPDATE do passo 1

#### Se `Comparação loading? true` (e nunca muda)
**Causa**: Hook travou no loading
**Solução**: 
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Se persistir, verifique erros no console

#### Se `Vai renderizar FeaturedComparison? false`
**Causa**: Condição `comparison && comparison.is_visible` é falsa
**Solução**: Verifique os logs anteriores para identificar qual parte está falhando

---

### 4. Verificar se o componente está sendo renderizado

Procure no Console por:

```
🎯 FeaturedComparison RENDERIZADO: { hasComparison: true, isEditable: false, isVisible: true, title: '...' }
```

**Se NÃO aparecer este log:**
**Causa**: O componente não está sendo renderizado
**Solução**: 
1. Verifique se `comparison && comparison.is_visible` é verdadeiro
2. Verifique se não há erros no console bloqueando a renderização

**Se aparecer o log:**
**Causa**: O componente está renderizando, mas pode haver problema de CSS
**Solução**: 
1. Inspecione o elemento (F12 → Elements)
2. Procure por `<div class="...">` com o componente FeaturedComparison
3. Verifique se não está com `display: none` ou `opacity: 0`

---

### 5. Verificar RLS (Row Level Security)

Execute no Supabase SQL Editor:

```sql
-- Ver policies da tabela
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'featured_photo_comparison';
```

**Deve ter pelo menos:**
- `Service role can access all` (para acesso público)
- `Users can view own featured comparison` (para usuários autenticados)

**Se não tiver a policy "Service role can access all":**
```sql
-- Criar policy para service role
CREATE POLICY "Service role can access all"
  ON featured_photo_comparison
  FOR SELECT
  USING (true);
```

---

### 6. Verificar se você está usando o sistema correto

**❌ SISTEMA ERRADO (não vai para público):**
- Você clicou em um botão que abriu um editor lado a lado
- Você ajustou zoom e posição arrastando as fotos
- Você clicou em "Salvar Configurações"
- **Isso é o PhotoComparisonEditor** (sistema antigo)

**✅ SISTEMA CORRETO (vai para público):**
- Você clicou no botão "Criar Antes/Depois" (verde esmeralda)
- Abriu um modal com grade de fotos para selecionar
- Você selecionou 2 fotos (ANTES e DEPOIS)
- Você preencheu título e descrição
- Você clicou em "Criar Comparação"
- **Isso é o CreateFeaturedComparisonModal** (sistema novo)

---

## 🚀 SOLUÇÃO RÁPIDA (PASSO A PASSO)

### Se nada funcionar, siga este passo a passo:

1. **Deletar comparação existente (se houver)**
```sql
DELETE FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE_AQUI';
```

2. **Limpar cache do navegador**
- Ctrl+Shift+Delete
- Marcar "Imagens e arquivos em cache"
- Limpar

3. **Acessar o PatientPortal**
- URL: `/portal/:token`
- Fazer login como nutricionista

4. **Criar nova comparação**
- Rolar até o card "Evolução Fotográfica"
- Clicar em **"Criar Antes/Depois"** (botão verde)
- Selecionar foto ANTES (clicar na foto)
- Selecionar foto DEPOIS (clicar na foto)
- Preencher título: "Minha Transformação"
- Clicar em "Criar Comparação"

5. **Verificar no banco**
```sql
SELECT * FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE_AQUI';
```
- Deve retornar 1 linha
- `is_visible` deve ser `true`

6. **Acessar portal público**
- URL: `/public/portal/:telefone`
- Recarregar com Ctrl+F5
- A comparação deve aparecer no topo

7. **Verificar logs**
- Abrir Console (F12)
- Procurar por logs `🎯 PublicPortal` e `🎯 FeaturedComparison`
- Todos devem estar OK

---

## 📞 AINDA NÃO FUNCIONA?

Se seguiu todos os passos e ainda não funciona:

1. **Copie os logs do console** (F12 → Console → Copiar tudo)
2. **Execute este SQL e copie o resultado:**
```sql
SELECT * FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE_AQUI';
```
3. **Tire um print da tela** mostrando o problema
4. **Envie para análise** com todas as informações acima

---

## 🎯 RESUMO DOS COMANDOS SQL

```sql
-- 1. Ver se existe comparação
SELECT * FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE_AQUI';

-- 2. Tornar comparação visível
UPDATE featured_photo_comparison SET is_visible = true WHERE telefone = 'SEU_TELEFONE_AQUI';

-- 3. Deletar comparação (para criar novamente)
DELETE FROM featured_photo_comparison WHERE telefone = 'SEU_TELEFONE_AQUI';

-- 4. Ver todas as comparações
SELECT telefone, title, is_visible, created_at FROM featured_photo_comparison ORDER BY created_at DESC;

-- 5. Verificar policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'featured_photo_comparison';
```

---

## ✅ CHECKLIST FINAL

- [ ] Comparação existe no banco (`SELECT * FROM featured_photo_comparison`)
- [ ] `is_visible = true`
- [ ] URLs das fotos estão corretas e acessíveis
- [ ] Logs do console mostram comparação carregada
- [ ] Logs mostram `Vai renderizar FeaturedComparison? true`
- [ ] Logs mostram `FeaturedComparison RENDERIZADO`
- [ ] Policy "Service role can access all" existe
- [ ] Usei o botão "Criar Antes/Depois" (não o PhotoComparisonEditor)
- [ ] Cache do navegador foi limpo
- [ ] Página foi recarregada com Ctrl+F5

Se TODOS os itens estão marcados e ainda não funciona, há um problema mais profundo que precisa de análise detalhada.
