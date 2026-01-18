# Correção: Não Consegue Deletar Pacientes

## Problema
Ao tentar excluir um paciente da página de pacientes, a operação falha. Provavelmente devido a falta de política RLS de DELETE.

## Causa
A tabela `patients` pode não ter uma política de DELETE configurada, ou a política existente não está permitindo a exclusão para o usuário atual.

## Solução

### Passo 1: Diagnosticar o Problema
Execute o arquivo SQL de diagnóstico no Supabase SQL Editor:
```
controle-de-pacientes/sql/diagnosticar-delete-pacientes.sql
```

Isso vai mostrar:
- Políticas de DELETE existentes
- Se RLS está habilitado
- Seu user_id
- Quantos pacientes você tem
- Se você é membro de equipe

### Passo 2: Aplicar a Correção
Execute o arquivo SQL de correção no Supabase SQL Editor:
```
controle-de-pacientes/sql/fix-patients-delete-rls.sql
```

Este script vai:
1. Remover políticas de DELETE antigas/conflitantes
2. Criar nova política que permite:
   - **Owner**: Deletar seus próprios pacientes
   - **Membros da equipe**: Deletar pacientes do owner (se tiverem permissão `patients_manage` ou `is_admin`)

### Passo 3: Testar
Após executar o SQL:
1. Recarregue a página de pacientes
2. Tente excluir um paciente
3. Deve funcionar sem erros

## Política Criada

```sql
CREATE POLICY "Allow delete for owners and team members"
ON patients
FOR DELETE
TO authenticated
USING (
  -- Owner pode deletar seus próprios pacientes
  user_id = auth.uid()
  OR
  -- Membros da equipe podem deletar pacientes do owner
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.member_user_id = auth.uid()
    AND tm.owner_user_id = patients.user_id
    AND tm.status = 'active'
    AND (
      tm.permissions->>'patients_manage' = 'true'
      OR
      tm.permissions->>'is_admin' = 'true'
    )
  )
);
```

## Verificação
Após aplicar, execute no SQL Editor:
```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'patients' 
AND cmd = 'DELETE';
```

Deve retornar a política "Allow delete for owners and team members".

## Observações
- A exclusão de um paciente pode ter efeito cascata em outras tabelas (checkins, dietas, etc.)
- Certifique-se de que as foreign keys estão configuradas com `ON DELETE CASCADE` se necessário
- Membros da equipe só podem deletar se tiverem a permissão adequada
