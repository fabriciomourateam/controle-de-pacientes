# Instruções: Sistema de Liberação de Dietas

## O que foi implementado

### 1. Campo de Liberação no Formulário de Dieta
- Adicionado toggle "Liberar para o Paciente" no formulário de criação/edição de planos alimentares
- Quando ativado, o plano fica visível no portal do paciente
- Quando desativado, o plano fica oculto (apenas visível para o nutricionista)

### 2. Filtro no Portal do Paciente
- O portal do paciente agora mostra **apenas** dietas com `is_released = true`
- Dietas não liberadas não aparecem para o paciente

### 3. Seletor de Múltiplas Dietas
- Quando houver mais de uma dieta liberada, um seletor aparece no topo do portal
- O paciente pode alternar entre as dietas liberadas
- O seletor mostra quantas dietas estão disponíveis

### 4. Cores Atualizadas
- O formulário de dieta agora usa as mesmas cores do modal de edição:
  - Fundo: gradiente verde claro (`from-green-50/80 to-emerald-50/80`)
  - Bordas: verde claro (`border-green-200/50`)
  - Tabs: fundo verde claro (`bg-green-100/50`)

## Como usar

### Para o Nutricionista:

1. **Criar/Editar um Plano Alimentar**
   - Acesse a página de planos alimentares do paciente
   - Crie ou edite um plano
   - Na aba "Informações Básicas", você verá o toggle "Liberar para o Paciente"
   - Ative o toggle para liberar o plano
   - Salve o plano

2. **Gerenciar Múltiplas Dietas**
   - Você pode criar várias dietas para o mesmo paciente
   - Libere apenas as que deseja que o paciente veja
   - Exemplo: Dieta de segunda a sexta (liberada) + Dieta de fim de semana (liberada)

### Para o Paciente:

1. **Visualizar Dieta Única**
   - Se houver apenas uma dieta liberada, ela será exibida automaticamente

2. **Alternar Entre Dietas**
   - Se houver múltiplas dietas liberadas, um seletor aparecerá no topo
   - Clique no seletor para escolher qual dieta visualizar
   - As refeições consumidas são salvas por dieta

## Executar SQL no Supabase

**IMPORTANTE:** Execute o SQL abaixo no Supabase SQL Editor antes de usar o sistema:

```sql
-- Adicionar campo is_released para controlar se a dieta está liberada para o paciente
ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT FALSE;

-- Adicionar campos de metas (target) se não existirem
ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_calories NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_protein NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_carbs NUMERIC(10,2);

ALTER TABLE diet_plans 
ADD COLUMN IF NOT EXISTS target_fats NUMERIC(10,2);

-- Comentários para documentação
COMMENT ON COLUMN diet_plans.is_released IS 'Indica se o plano está liberado para visualização no portal do paciente';
COMMENT ON COLUMN diet_plans.target_calories IS 'Meta de calorias diárias calculada pelo TMB/GET';
COMMENT ON COLUMN diet_plans.target_protein IS 'Meta de proteínas diárias em gramas';
COMMENT ON COLUMN diet_plans.target_carbs IS 'Meta de carboidratos diários em gramas';
COMMENT ON COLUMN diet_plans.target_fats IS 'Meta de gorduras diárias em gramas';
```

### Passos para executar:

1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Clique em "New Query"
4. Cole o SQL acima
5. Clique em "Run" ou pressione Ctrl+Enter
6. Verifique se a mensagem "Success. No rows returned" aparece

## Casos de Uso

### Caso 1: Dieta Única
- Nutricionista cria uma dieta e libera
- Paciente vê a dieta no portal
- Não há seletor (apenas uma dieta)

### Caso 2: Múltiplas Dietas
- Nutricionista cria "Dieta Semana" e "Dieta Fim de Semana"
- Libera ambas
- Paciente vê seletor no topo para alternar entre elas

### Caso 3: Dieta em Desenvolvimento
- Nutricionista cria uma nova dieta
- Mantém o toggle desativado enquanto ajusta
- Paciente continua vendo apenas a dieta anterior
- Quando pronta, nutricionista ativa o toggle
- Paciente passa a ver a nova dieta

### Caso 4: Desativar Dieta Antiga
- Nutricionista desativa o toggle da dieta antiga
- Ativa o toggle da dieta nova
- Paciente vê apenas a dieta nova

## Observações

- Dietas não liberadas continuam visíveis para o nutricionista na lista de planos
- O campo `is_released` é independente do campo `active` (status do plano)
- Recomenda-se liberar apenas dietas finalizadas e revisadas
- O paciente não pode ver ou editar o status de liberação
