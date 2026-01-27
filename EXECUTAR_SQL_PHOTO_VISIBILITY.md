# Como Executar o SQL da Tabela photo_visibility_settings

## Erro Atual
```
POST https://qhzifnyjyxdushxorzrk.supabase.co/rest/v1/photo_visibility_settings 404 (Not Found)
Could not find the table 'public.photo_visibility_settings' in the schema cache
```

**Causa:** A tabela `photo_visibility_settings` ainda não foi criada no banco de dados Supabase.

## Solução: Executar o SQL

### Passo 1: Acessar o Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o SQL
1. Clique em **New Query**
2. Copie todo o conteúdo do arquivo: `sql/create-photo-visibility-settings.sql`
3. Cole no editor SQL
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar Criação
Execute este SQL para verificar se a tabela foi criada:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'photo_visibility_settings'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
table_name                    | column_name      | data_type
------------------------------|------------------|------------------
photo_visibility_settings     | id               | uuid
photo_visibility_settings     | patient_telefone | text
photo_visibility_settings     | photo_id         | text
photo_visibility_settings     | visible          | boolean
photo_visibility_settings     | zoom_level       | numeric
photo_visibility_settings     | position_x       | numeric
photo_visibility_settings     | position_y       | numeric
photo_visibility_settings     | created_at       | timestamp with time zone
photo_visibility_settings     | updated_at       | timestamp with time zone
```

### Passo 4: Verificar RLS (Row Level Security)
Execute este SQL para verificar as políticas RLS:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'photo_visibility_settings';
```

**Resultado esperado:** 2 políticas
- `photo_visibility_owner_policy` (ALL)
- `photo_visibility_team_policy` (SELECT)

### Passo 5: Testar Inserção
Execute este SQL para testar se consegue inserir dados:

```sql
-- Substitua '11999999999' pelo telefone de um paciente real seu
INSERT INTO photo_visibility_settings (
  patient_telefone,
  photo_id,
  visible,
  zoom_level,
  position_x,
  position_y
) VALUES (
  '11999999999',
  'initial-frente',
  false,
  1.5,
  10,
  -5
);

-- Verificar se foi inserido
SELECT * FROM photo_visibility_settings;

-- Limpar teste (opcional)
DELETE FROM photo_visibility_settings WHERE photo_id = 'initial-frente';
```

## Após Executar o SQL

1. **Recarregue a página** do sistema (Ctrl+F5)
2. **Limpe o cache** do navegador se necessário
3. Tente usar o botão **"Configurar Fotos"** novamente
4. O erro 404 não deve mais aparecer

## Troubleshooting

### Se ainda der erro 404:
1. Verifique se está usando o projeto correto no Supabase
2. Verifique se o SQL foi executado sem erros
3. Aguarde 1-2 minutos (cache do Supabase)
4. Recarregue a página com Ctrl+F5

### Se der erro de permissão:
1. Verifique se você está logado no sistema
2. Verifique se o RLS foi criado corretamente
3. Execute o SQL de verificação de políticas acima

### Se der erro de constraint:
1. Verifique se o telefone do paciente existe na tabela `patients`
2. Verifique se o `photo_id` está no formato correto:
   - Fotos iniciais: `initial-frente`, `initial-lado`, `initial-lado_2`, `initial-costas`
   - Fotos de check-in: `checkin-{uuid}-foto-1`, `checkin-{uuid}-foto-2`, etc.

## Arquivo SQL Completo

O arquivo completo está em:
```
controle-de-pacientes/sql/create-photo-visibility-settings.sql
```

## Próximos Passos

Após executar o SQL com sucesso:
1. ✅ Tabela criada
2. ✅ RLS configurado
3. ✅ Sistema funcionando
4. 🎉 Pode usar o botão "Configurar Fotos"!

## Suporte

Se continuar com problemas:
1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase (Dashboard > Logs)
3. Compartilhe a mensagem de erro completa
