# Guia de Execução - Exclusões de Retenção

Este guia explica como implementar a funcionalidade de exclusão permanente de pacientes da lista de retenção.

## 📋 O que foi implementado

1. **Nova tabela no banco**: `retention_exclusions` - armazena pacientes excluídos por nutricionista
2. **Serviço de retenção**: `src/lib/retention-service.ts` - gerencia exclusões
3. **Atualização da página**: `src/pages/RetentionDashboard.tsx` - integração com banco de dados
4. **Tipos TypeScript**: Atualizados em `src/integrations/supabase/types.ts`

## 🚀 Passos para Execução

### 1. Executar o SQL no Supabase

Execute o arquivo `sql/create-retention-exclusions-table.sql` no SQL Editor do Supabase:

```bash
# Acesse o Supabase Dashboard > SQL Editor
# Cole e execute o conteúdo de: sql/create-retention-exclusions-table.sql
```

**O que o script faz:**
- Cria a tabela `retention_exclusions`
- Configura RLS (Row Level Security) para isolamento por nutricionista
- Cria índices para performance
- Define políticas de segurança

### 2. Atualizar Tipos TypeScript (Opcional)

Se você usar o Supabase CLI para gerar tipos automaticamente, execute:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

**OU** os tipos já foram atualizados manualmente no arquivo `src/integrations/supabase/types.ts`.

### 3. Testar a Funcionalidade

1. Acesse a página de Retenção
2. Clique em "Remover" em um paciente
3. Recarregue a página - o paciente deve permanecer removido
4. Teste em outro dispositivo/navegador - deve funcionar também

## ✅ Verificação

Após executar o SQL, verifique:

1. **Tabela criada**: No Supabase Dashboard > Table Editor, deve aparecer `retention_exclusions`
2. **RLS ativado**: Na aba "Policies" da tabela, devem existir 3 políticas
3. **Funcionalidade**: Ao remover um paciente, ele deve desaparecer e não voltar após recarregar

## 🔒 Segurança

- Cada nutricionista só vê suas próprias exclusões
- RLS garante isolamento de dados
- Políticas de segurança configuradas automaticamente

## 📝 Notas

- Os dados são salvos permanentemente no banco
- Funciona em qualquer dispositivo/navegador
- Compatível com múltiplos nutricionistas
- Fallback para localStorage em caso de erro de conexão

