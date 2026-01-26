# Como Limpar Cache do Navegador e Verificar Solução

## Problema

Após adicionar `.limit(5000)` nas queries, a página ainda mostra "1000 pacientes encontrados".

## Causa Provável

O navegador está usando código JavaScript em cache (antigo) que ainda não tem as alterações.

## Solução: Limpar Cache e Recompilar

### 1. Parar o servidor de desenvolvimento

```bash
# Pressione Ctrl+C no terminal onde o npm run dev está rodando
```

### 2. Limpar cache do navegador

**Opção A: Hard Refresh (Recomendado)**
- **Chrome/Edge**: `Ctrl + Shift + R` ou `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R` ou `Ctrl + F5`
- **Safari**: `Cmd + Option + R`

**Opção B: Limpar cache manualmente**
1. Abra DevTools (`F12`)
2. Clique com botão direito no ícone de refresh
3. Selecione "Limpar cache e recarregar forçadamente"

**Opção C: Limpar todo o cache**
1. Chrome: `Ctrl + Shift + Delete`
2. Selecione "Imagens e arquivos em cache"
3. Clique em "Limpar dados"

### 3. Limpar cache do Vite (build)

```bash
cd controle-de-pacientes
rm -rf dist
rm -rf node_modules/.vite
```

### 4. Reiniciar o servidor

```bash
npm run dev
```

### 5. Abrir em aba anônima (para testar)

- **Chrome/Edge**: `Ctrl + Shift + N`
- **Firefox**: `Ctrl + Shift + P`

Isso garante que não há cache algum.

## Verificar se a Solução Funcionou

### 1. Verificar no Console do Navegador

Abra o DevTools (`F12`) e vá na aba "Network":

1. Filtre por "patients"
2. Recarregue a página
3. Clique na requisição para a API do Supabase
4. Verifique a URL - deve ter `limit=5000` ou não ter limite algum

### 2. Verificar no Código

Abra o arquivo `src/lib/supabase-services.ts` e confirme que as linhas ~701, ~726, ~338 e ~485 têm `.limit(5000)`:

```typescript
// Linha ~701 (getMetrics)
.limit(5000);

// Linha ~726 (getMetrics - checkins)
.limit(10000);

// Linha ~338 (getExpiring)
.limit(5000);

// Linha ~485 (getFiltered)
.limit(5000);
```

### 3. Verificar no Dashboard

1. Acesse o dashboard
2. Verifique se o card "Pacientes Ativos" mostra **659** (não 636)
3. Acesse a página de Pacientes
4. Verifique se mostra **1024 pacientes encontrados** (não 1000)

## Se Ainda Não Funcionar

### Verificar se o código foi salvo

```bash
git status
git diff src/lib/supabase-services.ts
```

Deve mostrar as alterações com `.limit(5000)`.

### Verificar se há erros no console

1. Abra DevTools (`F12`)
2. Vá na aba "Console"
3. Procure por erros em vermelho
4. Se houver erros, copie e me envie

### Verificar a query no Supabase

1. Abra o DevTools (`F12`)
2. Vá na aba "Network"
3. Filtre por "patients"
4. Clique na requisição
5. Veja a URL completa - deve ter `limit=5000` ou não ter limite

### Última opção: Deploy

Se estiver testando em produção (não localhost), você precisa fazer deploy:

```bash
git add .
git commit -m "fix: adicionar limite de 5000 pacientes nas queries"
git push
```

Aguarde o deploy no Vercel/Netlify completar (~2-3 minutos).

## Resumo das Alterações Feitas

Adicionado `.limit(5000)` em 4 lugares no arquivo `src/lib/supabase-services.ts`:

1. **Linha ~701**: `dashboardService.getMetrics()` - query de pacientes
2. **Linha ~726**: `dashboardService.getMetrics()` - query de checkins  
3. **Linha ~338**: `patientService.getExpiring()` - pacientes expirando
4. **Linha ~485**: `patientService.getFiltered()` - pacientes filtrados (página de pacientes)

Isso garante que todas as queries carregam até 5000 registros em vez do limite padrão de 1000 do PostgREST.
