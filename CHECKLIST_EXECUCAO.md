# ✅ Checklist de Execução - Funcionalidades de Peso e Exames

## 📋 SQLs para Executar

Execute no Supabase SQL Editor na seguinte ordem:

### ✅ 1. `sql/fix-add-user-id-to-existing-tables.sql`
**Status**: ✅ JÁ EXECUTADO
- Adiciona `user_id` nas tabelas existentes
- Configura RLS e triggers
- **Você já executou este!**

### ⏳ 2. `sql/create-weight-tracking-table.sql`
**Status**: ⏳ VERIFICAR SE JÁ FOI EXECUTADO
- Cria tabela `weight_tracking`
- Se você já criou a tabela antes, pode pular (o fix acima já adicionou user_id)

**Como verificar:**
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'weight_tracking'
);
```

Se retornar `true`, já existe. Se retornar `false`, execute o SQL.

### ⏳ 3. `sql/create-laboratory-exams.sql`
**Status**: ⏳ VERIFICAR SE JÁ FOI EXECUTADO
- Cria tabelas `exam_types` e `laboratory_exams`
- Insere tipos de exames padrão

**Como verificar:**
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'laboratory_exams'
);
```

Se retornar `true`, já existe. Se retornar `false`, execute o SQL.

### ⏳ 4. `sql/add-checkin-weight-fields.sql` ⚠️ **IMPORTANTE**
**Status**: ⏳ VERIFICAR SE JÁ FOI EXECUTADO
- Adiciona campos `peso_jejum`, `tipo_peso`, `peso_data` na tabela `checkin`
- Permite pré-preencher check-ins com peso em jejum

**Como verificar:**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'checkin' 
AND column_name IN ('peso_jejum', 'tipo_peso', 'peso_data');
```

Se retornar 3 linhas, já foram adicionados. Se não, execute o SQL.

### ⏳ 5. `sql/create-branding-config.sql`
**Status**: ⏳ VERIFICAR SE TABELA system_config EXISTE

**Primeiro, verificar se a tabela system_config existe:**
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'system_config'
);
```

- Se retornar `false`: Execute primeiro `sql/create-config-table.sql` (se existir) ou crie a tabela
- Se retornar `true`: Execute `sql/create-branding-config.sql` para inserir configuração padrão

---

## 🎯 Próximos Passos (Integração no Código)

Após executar todos os SQLs, ainda precisamos:

1. ⏳ **Integrar `WeightInput` no Portal e Evolução**
   - Adicionar botão "Registrar Peso" nas páginas
   - Componente já criado: `src/components/evolution/WeightInput.tsx`

2. ⏳ **Atualizar gráfico `EvolutionCharts`**
   - Combinar peso inicial + pesos diários + check-ins mensais
   - Visualização: pontos grandes (check-ins), pontos pequenos (diários)

3. ⏳ **Integrar exames nas páginas**
   - `ExamRequestModal` e `ExamsHistory` já criados
   - Adicionar nas páginas de pacientes

4. ⏳ **Integrar PDF melhorado no PatientPortal**
   - Substituir função atual por `DietPDFGenerator.generatePDF()`

5. ⏳ **Integrar ajuste rápido de porções**
   - Adicionar botão no `DietPlanForm`
   - Componente `QuickPortionAdjustment` já criado

6. ⏳ **Atualizar formulário de check-in**
   - Pré-preencher peso em jejum do último registro mensal

---

## ✅ Status Geral

- ✅ Estrutura SQL criada
- ✅ Multi-tenancy configurado
- ✅ Serviços TypeScript criados
- ✅ Componentes criados
- ⏳ SQLs precisam ser verificados/executados
- ⏳ Integração nas páginas pendente

---

## 🚀 Ordem Recomendada

1. Execute os SQLs acima (na ordem)
2. Depois, podemos fazer a integração dos componentes nas páginas
3. Por último, testar tudo funcionando





