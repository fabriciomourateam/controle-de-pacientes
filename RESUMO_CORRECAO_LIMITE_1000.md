# Resumo: Correção do Limite de 1000 Pacientes

## Problema Reportado

- Dashboard mostrava apenas **636 pacientes ativos** (deveria mostrar 659)
- Página de Pacientes mostrava **1000 pacientes encontrados** (deveria mostrar 1024)

## Causa Identificada

O PostgREST/Supabase tem um **limite padrão de 1000 registros** por query. Quando não especificamos `.limit()` explicitamente, ele retorna apenas os primeiros 1000 registros.

Como o sistema tinha 1024 pacientes:
- Apenas os primeiros 1000 eram carregados
- Dentro desses 1000, apenas 636 eram ativos
- Os 24 pacientes restantes (e 23 ativos) ficavam de fora

## Solução Implementada

Adicionado `.limit(5000)` em **4 queries críticas** no arquivo `src/lib/supabase-services.ts`:

### 1. Dashboard - Query de Pacientes (linha ~708)
```typescript
const { data: allPatients } = await supabase
  .from('patients')
  .select('vencimento, created_at, telefone, plano')
  .limit(5000); // ✅ ADICIONADO
```

### 2. Dashboard - Query de Checkins (linha ~732)
```typescript
const { data: checkins } = await supabase
  .from('checkin')
  .select('telefone, data_checkin, total_pontuacao')
  .limit(10000); // ✅ ADICIONADO
```

### 3. Pacientes Expirando (linha ~338)
```typescript
const { data, error } = await supabase
  .from('patients')
  .select(`...`)
  .order('created_at', { ascending: false })
  .limit(5000); // ✅ ADICIONADO
```

### 4. Página de Pacientes - Filtros (linha ~485)
```typescript
query = query.limit(5000); // ✅ ADICIONADO

const { data, error } = await query;
```

## Como Testar a Solução

### Opção 1: Forçar Recompilação (Recomendado)

Execute o script criado:

```bash
cd controle-de-pacientes
force-rebuild.bat
```

Ou manualmente:

```bash
# Parar o servidor (Ctrl+C)
# Limpar cache
rm -rf dist
rm -rf node_modules/.vite
# Reiniciar
npm run dev
```

### Opção 2: Hard Refresh no Navegador

1. Abra a aplicação
2. Pressione `Ctrl + Shift + R` (ou `Ctrl + F5`)
3. Isso força o navegador a baixar o código novo

### Opção 3: Aba Anônima

1. Abra uma aba anônima (`Ctrl + Shift + N`)
2. Acesse a aplicação
3. Isso garante que não há cache

## Verificação

Após limpar o cache e recompilar:

### Dashboard
- ✅ Card "Pacientes Ativos" deve mostrar **659** (não 636)
- ✅ Total de pacientes deve ser **1024**

### Página de Pacientes
- ✅ Deve mostrar **"1024 pacientes encontrados"** (não 1000)
- ✅ Todos os pacientes devem aparecer na lista

### Console do Navegador (DevTools)
1. Abra DevTools (`F12`)
2. Vá na aba "Network"
3. Filtre por "patients"
4. Recarregue a página
5. Verifique a URL da requisição - deve ter `limit=5000`

## Arquivos Modificados

- ✅ `src/lib/supabase-services.ts` (4 alterações)

## Arquivos Criados (Documentação)

- ✅ `SOLUCAO_LIMITE_636_PACIENTES.md` - Documentação técnica completa
- ✅ `COMO_LIMPAR_CACHE_NAVEGADOR.md` - Guia de troubleshooting
- ✅ `force-rebuild.bat` - Script para forçar recompilação
- ✅ `RESUMO_CORRECAO_LIMITE_1000.md` - Este arquivo

## Próximos Passos

1. **Execute o script de rebuild**: `force-rebuild.bat`
2. **Faça hard refresh no navegador**: `Ctrl + Shift + R`
3. **Verifique os números**: Dashboard deve mostrar 659 ativos e 1024 total
4. **Se ainda não funcionar**: Veja o guia `COMO_LIMPAR_CACHE_NAVEGADOR.md`

## Impacto no Egress

- Limite aumentado de 1000 para 5000 (5x)
- Para 1024 pacientes, o impacto real é mínimo (apenas 2.4% acima do limite padrão)
- Queries usam apenas campos específicos (não `*`), minimizando o tamanho dos dados
- Se o sistema crescer além de 5000 pacientes, será necessário implementar paginação

## Notas Técnicas

- O limite de 5000 é suficiente para a maioria dos casos de uso
- A função `patientService.getAll()` já tinha suporte para limite configurável
- Agora todas as queries críticas têm limite explícito
- Isso evita surpresas com o limite padrão do PostgREST (1000)
