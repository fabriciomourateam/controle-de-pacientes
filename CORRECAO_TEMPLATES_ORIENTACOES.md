# Correção: Sistema de Templates de Orientações

## Problema
Ao tentar criar uma orientação favorita (template), o sistema retorna erro:
```
null value in column "diet_plan_id" violates not-null constraint
```

## Causa
A coluna `diet_plan_id` na tabela `diet_guidelines` está configurada como NOT NULL, impedindo a criação de templates que não pertencem a um plano específico.

## Solução

### 1. Executar SQL no Supabase

Acesse o SQL Editor do Supabase e execute o arquivo:
```
sql/fix-diet-guidelines-allow-null.sql
```

Este script irá:
- ✅ Remover a constraint NOT NULL de `diet_plan_id`
- ✅ Adicionar campos `is_template`, `user_id` e `is_active`
- ✅ Criar constraint de validação (templates devem ter `diet_plan_id = NULL`)
- ✅ Criar índices para performance
- ✅ Atualizar registros existentes

### 2. Verificar no Supabase

Após executar o SQL, verifique:

```sql
-- Ver estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'diet_guidelines'
ORDER BY ordinal_position;

-- Ver constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'diet_guidelines'::regclass;
```

### 3. Testar no Sistema

Após executar o SQL:

1. Acesse um plano alimentar
2. Clique em "Gerenciar Favoritas" (botão dourado)
3. Clique em "Criar Nova Orientação Favorita"
4. Preencha:
   - **Título**: Ex: "💧 HIDRATAÇÃO"
   - **Conteúdo**: Use o editor rico com formatação HTML
5. Clique em "Salvar Template"

## Como Funciona

### Templates (Orientações Favoritas)
- `is_template = TRUE`
- `diet_plan_id = NULL` (não pertencem a um plano específico)
- `user_id = [seu_id]` (pertencem ao nutricionista)
- `is_active = TRUE/FALSE` (ativas aparecem em novos planos)

### Orientações de Planos
- `is_template = FALSE`
- `diet_plan_id = [id_do_plano]` (pertencem a um plano específico)
- `user_id = NULL`
- `is_active = TRUE/FALSE` (podem ser desativadas no plano)

## Funcionalidades

### 1. Criar Template
- Crie orientações que aparecerão automaticamente em todos os novos planos
- Use formatação rica (negrito, cores, links)
- Defina prioridade de exibição

### 2. Ativar/Desativar Template
- Templates ativos são copiados para novos planos
- Templates inativos não aparecem em novos planos
- Não afeta planos já criados

### 3. Editar Template
- Alterações em templates não afetam planos já criados
- Apenas novos planos receberão a versão atualizada

### 4. Deletar Template
- Remove o template permanentemente
- Não afeta orientações já copiadas para planos

### 5. Gerenciar em Planos Individuais
- Cada plano pode desativar orientações específicas
- Não deleta, apenas oculta do plano

## Renderização de HTML

O sistema suporta HTML rico nas orientações:

```html
<b>💧 HIDRATAÇÃO</b><br>
A água tem extrema importância em diversos fatores metabólicos.<br>
<strong>Procure beber no MÍNIMO 40 ml DE ÁGUA POR KG CORPORAL</strong><br>
<em>(Ex.: pessoa com 80kg: 80 x 40ml = 3,2 LITROS por dia)</em>
```

### Onde é Renderizado
- ✅ Modal de Templates (visualização)
- ✅ Formulário de Plano Alimentar (editor)
- ✅ Portal do Paciente (visualização)
- ✅ Exportação PDF (visualização)

### Como é Renderizado
```tsx
<div 
  className="prose prose-sm max-w-none"
  dangerouslySetInnerHTML={{ __html: guideline.content || '' }}
  style={{
    wordWrap: 'break-word',
    overflowWrap: 'break-word'
  }}
/>
```

## Fluxo Completo

### 1. Criar Template
```
Nutricionista → Gerenciar Favoritas → Criar Nova → Salvar
↓
Banco: INSERT INTO diet_guidelines (
  is_template = TRUE,
  diet_plan_id = NULL,
  user_id = [nutricionista_id],
  title = "Hidratação",
  content = "<b>Beber água...</b>",
  is_active = TRUE
)
```

### 2. Criar Novo Plano
```
Nutricionista → Novo Plano → Salvar
↓
Sistema chama: copy_guideline_templates_to_plan(plano_id, user_id)
↓
Banco: Copia todos templates ativos do nutricionista para o novo plano
```

### 3. Visualizar no Portal
```
Paciente → Portal → Plano Alimentar → Orientações
↓
Sistema busca: SELECT * FROM diet_guidelines 
WHERE diet_plan_id = [plano_id] AND is_active = TRUE
↓
Renderiza com dangerouslySetInnerHTML
```

## Segurança

### RLS Policies
- ✅ Nutricionistas só veem seus próprios templates
- ✅ Membros da equipe podem ver templates do owner
- ✅ Pacientes só veem orientações de seus planos
- ✅ Não é possível criar templates para outros usuários

### Validação
- ✅ Templates devem ter `diet_plan_id = NULL`
- ✅ Orientações de planos devem ter `diet_plan_id != NULL`
- ✅ Constraint CHECK garante integridade

## Troubleshooting

### Erro: "null value in column diet_plan_id"
**Causa**: SQL não foi executado no Supabase
**Solução**: Execute `sql/fix-diet-guidelines-allow-null.sql`

### Templates não aparecem em novos planos
**Causa**: Templates estão inativos
**Solução**: Ative os templates no modal "Gerenciar Favoritas"

### HTML não renderiza corretamente
**Causa**: Componente não está usando `dangerouslySetInnerHTML`
**Solução**: Verificar se o componente usa a renderização correta

### Alterações em templates não aparecem em planos antigos
**Comportamento esperado**: Templates são copiados na criação do plano
**Solução**: Edite manualmente as orientações nos planos antigos

## Próximos Passos

1. ✅ Execute o SQL no Supabase
2. ✅ Teste criar um template
3. ✅ Teste criar um novo plano (deve copiar templates)
4. ✅ Teste desativar um template
5. ✅ Teste editar um template
6. ✅ Verifique no portal do paciente

## Arquivos Relacionados

- `sql/fix-diet-guidelines-allow-null.sql` - SQL de correção
- `sql/add-guideline-templates-system.sql` - SQL completo do sistema
- `src/hooks/use-guideline-templates.ts` - Hook de gerenciamento
- `src/components/diets/GuidelineTemplatesModal.tsx` - Modal de templates
- `src/components/diets/RichTextEditor.tsx` - Editor rico
- `src/components/diets/DietPlanForm.tsx` - Formulário de plano
- `src/components/patient-portal/PatientDietPortal.tsx` - Portal do paciente
