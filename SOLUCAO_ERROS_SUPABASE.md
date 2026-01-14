# Solução para Erros do Supabase

## Erros Identificados

```
qhzifnyjyxdushxorzrk.supabase.co/rest/v1/body_composition?select=peso%2Cdata_avaliacao&telefone=eq.5531998529277&order=data_avaliacao.desc&limit=1:1
Failed to load resource: the server responded with a status of 406 ()

qhzifnyjyxdushxorzrk.supabase.co/rest/v1/checkin?select=*%2Cpatient%3Apatients%21inner%28id%2Cnome%2Capelido%2Ctelefone%2Cplano%29&created_at=gte.2026-01-12T11%3A02%3A10.189Z&order=created_at.desc:1
Failed to load resource: the server responded with a status of 500 ()

qhzifnyjyxdushxorzrk.supabase.co/auth/v1/token?grant_type=refresh_token:1
Failed to load resource: net::ERR_FAILED
```

## 1. Erro 406 - body_composition

### Causa
Política RLS (Row Level Security) bloqueando acesso à tabela `body_composition`.

### Diagnóstico
```sql
-- Verificar políticas atuais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'body_composition';
```

### Solução
```sql
-- 1. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can view own body composition" ON body_composition;
DROP POLICY IF EXISTS "Users can insert own body composition" ON body_composition;
DROP POLICY IF EXISTS "Users can update own body composition" ON body_composition;

-- 2. Criar política correta para SELECT
CREATE POLICY "Users can view body composition"
ON body_composition FOR SELECT
USING (
  -- Permitir acesso se o telefone pertence a um paciente do usuário
  telefone IN (
    SELECT telefone FROM patients 
    WHERE user_id = auth.uid()
  )
  OR
  -- Permitir acesso se o usuário é membro da equipe do dono
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = body_composition.telefone
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 3. Criar política para INSERT
CREATE POLICY "Users can insert body composition"
ON body_composition FOR INSERT
WITH CHECK (
  telefone IN (
    SELECT telefone FROM patients 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = body_composition.telefone
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 4. Criar política para UPDATE
CREATE POLICY "Users can update body composition"
ON body_composition FOR UPDATE
USING (
  telefone IN (
    SELECT telefone FROM patients 
    WHERE user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = body_composition.telefone
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 5. Verificar se RLS está habilitado
ALTER TABLE body_composition ENABLE ROW LEVEL SECURITY;
```

### Teste
```sql
-- Testar como usuário autenticado
SELECT * FROM body_composition 
WHERE telefone = '5531998529277' 
LIMIT 1;
```

## 2. Erro 500 - checkin

### Causa
Query muito complexa ou timeout no servidor.

### Diagnóstico
```sql
-- Verificar índices existentes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'checkin';

-- Verificar tamanho da tabela
SELECT 
  pg_size_pretty(pg_total_relation_size('checkin')) as total_size,
  (SELECT COUNT(*) FROM checkin) as row_count;
```

### Solução 1: Adicionar Índices
```sql
-- Índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_checkin_telefone 
ON checkin(telefone);

-- Índice para ordenação por data
CREATE INDEX IF NOT EXISTS idx_checkin_created_at 
ON checkin(created_at DESC);

-- Índice para data_checkin
CREATE INDEX IF NOT EXISTS idx_checkin_data_checkin 
ON checkin(data_checkin DESC);

-- Índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_checkin_status_assigned 
ON checkin(status, assigned_to);

-- Índice para JOIN com patients
CREATE INDEX IF NOT EXISTS idx_patients_telefone 
ON patients(telefone);
```

### Solução 2: Simplificar Query
```typescript
// Antes: Query complexa com INNER JOIN
const { data } = await supabase
  .from('checkin')
  .select('*, patient:patients!inner(id, nome, apelido, telefone, plano)')
  .gte('created_at', date)
  .order('created_at', { ascending: false });

// Depois: Buscar separadamente
const { data: checkins } = await supabase
  .from('checkin')
  .select('*')
  .gte('created_at', date)
  .order('created_at', { ascending: false });

// Buscar pacientes apenas dos checkins retornados
const telefones = [...new Set(checkins.map(c => c.telefone))];
const { data: patients } = await supabase
  .from('patients')
  .select('id, nome, apelido, telefone, plano')
  .in('telefone', telefones);

// Combinar no frontend
const checkinsWithPatient = checkins.map(checkin => ({
  ...checkin,
  patient: patients.find(p => p.telefone === checkin.telefone)
}));
```

### Solução 3: Aumentar Timeout (se possível)
No Supabase Dashboard:
1. Settings → Database
2. Connection pooling → Timeout: aumentar para 30s

## 3. Erro ERR_FAILED - Token Refresh

### Causa
Falha ao renovar token de autenticação.

### Diagnóstico
```typescript
// Verificar estado da sessão
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
console.log('Expires at:', session?.expires_at);
```

### Solução 1: Implementar Retry Automático
```typescript
// No React Query
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Tentar 3 vezes
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Exponential backoff: 1s, 2s, 4s
    },
  },
});
```

### Solução 2: Refresh Manual
```typescript
// Adicionar listener para erros de autenticação
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token renovado com sucesso');
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('❌ Usuário deslogado');
    // Redirecionar para login
    window.location.href = '/login';
  }
});

// Forçar refresh se necessário
const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Erro ao renovar sessão:', error);
    // Fazer logout
    await supabase.auth.signOut();
  }
};
```

### Solução 3: Verificar CORS
No Supabase Dashboard:
1. Settings → API
2. CORS allowed origins: adicionar seu domínio
   - `http://localhost:5173` (dev)
   - `https://seu-dominio.vercel.app` (prod)

## 4. Monitoramento e Logs

### Adicionar Logging
```typescript
// Interceptar erros do Supabase
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table: string) => {
  const query = originalFrom(table);
  const originalSelect = query.select.bind(query);
  
  query.select = (...args: any[]) => {
    const result = originalSelect(...args);
    
    // Log de erros
    result.then((response: any) => {
      if (response.error) {
        console.error(`❌ Erro na tabela ${table}:`, {
          error: response.error,
          status: response.status,
          statusText: response.statusText,
        });
      }
    });
    
    return result;
  };
  
  return query;
};
```

### Adicionar Error Boundary
```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <h3 className="text-red-400 font-semibold mb-2">Erro ao carregar dados</h3>
      <p className="text-slate-300 text-sm mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Tentar novamente</Button>
    </div>
  );
}

// Usar no componente
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <CheckinsList />
</ErrorBoundary>
```

## 5. Checklist de Verificação

### Backend (Supabase)
- [ ] Políticas RLS configuradas corretamente
- [ ] Índices criados nas tabelas principais
- [ ] CORS configurado para domínios corretos
- [ ] Timeout adequado (30s+)
- [ ] Logs habilitados para debug

### Frontend
- [ ] Retry automático implementado
- [ ] Error boundaries adicionados
- [ ] Logging de erros configurado
- [ ] Refresh de token automático
- [ ] Queries otimizadas (sem JOINs complexos)

## 6. Comandos para Executar

```bash
# 1. Abrir SQL Editor no Supabase Dashboard
# 2. Executar scripts de correção de RLS
# 3. Executar scripts de criação de índices
# 4. Testar queries manualmente

# No terminal local
npm run dev

# Verificar console do navegador para erros
# Testar funcionalidades afetadas
```

## 7. Priorização

### 🔴 URGENTE
1. Corrigir RLS de `body_composition` (erro 406)
2. Adicionar índices em `checkin` e `patients`
3. Implementar retry automático

### 🟡 IMPORTANTE
1. Simplificar queries complexas
2. Adicionar error boundaries
3. Configurar CORS corretamente

### 🟢 RECOMENDADO
1. Adicionar logging detalhado
2. Monitorar performance no Supabase Dashboard
3. Implementar cache distribuído

## Conclusão

Os erros do Supabase são problemas de configuração de backend (RLS, índices, CORS) e não estão relacionados às mudanças de cor ou otimizações de performance implementadas.

Siga os passos acima para corrigir cada erro específico.
