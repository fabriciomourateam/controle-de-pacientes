# ✅ SOLUÇÃO FINAL: Gestão de Equipe

## 🎯 SITUAÇÃO CONFIRMADA

Você confirmou que:
- ✅ Tabela `patients` **TEM** coluna `user_id`
- ✅ Tabela `checkin` está ligada a `patients` por `telefone`
- ✅ Cada paciente está ligado ao `user_id` do nutricionista

**Problema:** As políticas RLS não estão permitindo que membros da equipe vejam os dados do owner.

---

## 🚀 SOLUÇÃO RÁPIDA

### Passo 1: Verificar Estrutura (Opcional)
Execute para confirmar que `user_id` existe:
```sql
-- Arquivo: sql/verificar-estrutura-tabelas.sql
```

### Passo 2: Executar SQL de Correção ⭐
```sql
-- Arquivo: sql/fix-rls-with-existing-user-id.sql
```

Este SQL:
- ✅ Habilita RLS nas tabelas
- ✅ Remove políticas antigas
- ✅ Cria políticas corretas para owners e membros
- ✅ Cria trigger para auto-atribuir `user_id`

### Passo 3: Testar
1. Faça login como owner
2. Verifique se vê seus pacientes
3. Adicione um membro da equipe
4. Faça login como o membro
5. Verifique se ele vê os dados do owner

---

## 📊 COMO FUNCIONA

### Estrutura de Dados:
```
patients
├── id
├── nome
├── telefone
├── user_id  ← ID do nutricionista dono
└── ...

checkin
├── id
├── telefone  ← Liga ao paciente
├── data_checkin
└── ...

team_members
├── id
├── owner_id  ← ID do nutricionista
├── user_id   ← ID do membro da equipe
└── ...
```

### Lógica de Acesso:

#### Para PATIENTS:
```sql
-- Owner vê seus pacientes
user_id = auth.uid()

-- OU membro vê pacientes do owner
user_id IN (
  SELECT owner_id FROM team_members 
  WHERE user_id = auth.uid() AND is_active = true
)
```

#### Para CHECKIN:
```sql
-- Owner vê check-ins de seus pacientes
telefone IN (
  SELECT telefone FROM patients WHERE user_id = auth.uid()
)

-- OU membro vê check-ins dos pacientes do owner
telefone IN (
  SELECT p.telefone FROM patients p
  INNER JOIN team_members tm ON p.user_id = tm.owner_id
  WHERE tm.user_id = auth.uid() AND tm.is_active = true
)
```

---

## ✅ APÓS EXECUTAR O SQL

### O que vai funcionar:

1. **Isolamento entre nutricionistas** ✅
   - Cada nutri vê apenas seus pacientes
   - Cada nutri vê apenas check-ins de seus pacientes

2. **Acesso de membros da equipe** ✅
   - Membros veem pacientes do owner
   - Membros veem check-ins dos pacientes do owner
   - Membros NÃO veem dados de outros owners

3. **Controle de permissões** ✅
   - Menu filtra itens baseado em permissões
   - Botões aparecem/desaparecem conforme permissões
   - Ações são bloqueadas quando sem permissão

4. **Novos registros** ✅
   - Pacientes novos têm `user_id` atribuído automaticamente
   - Check-ins são filtrados pelo telefone do paciente

---

## 🧪 TESTE COMPLETO

### 1. Teste como Owner

```sql
-- Fazer login como owner
-- Executar no SQL Editor:

SELECT COUNT(*) as meus_pacientes FROM patients;
-- Deve retornar apenas seus pacientes

SELECT COUNT(*) as meus_checkins FROM checkin;
-- Deve retornar apenas check-ins de seus pacientes
```

### 2. Adicionar Membro

1. Vá em **Gestão de Equipe**
2. Clique em **Adicionar Membro**
3. Preencha:
   - Nome: "Teste Assistente"
   - Email: "teste@exemplo.com"
   - Senha: "teste123"
4. Selecione perfil: **Assistente**
5. Clique em **Adicionar Membro**

### 3. Teste como Membro

```sql
-- Fazer login como teste@exemplo.com
-- Executar no SQL Editor:

SELECT COUNT(*) as pacientes_do_owner FROM patients;
-- Deve retornar os mesmos pacientes do owner

SELECT COUNT(*) as checkins_do_owner FROM checkin;
-- Deve retornar os mesmos check-ins do owner
```

### 4. Teste de Isolamento

1. Crie outra conta de nutricionista (outro owner)
2. Adicione alguns pacientes
3. Faça login como "teste@exemplo.com"
4. Verifique que **NÃO** vê os pacientes do segundo nutricionista

---

## 🎨 CONTROLE DE PERMISSÕES

### Exemplo: Perfil "Assistente"

**Permissões:**
```json
{
  "patients": {
    "view": true,      ✅ Vê pacientes
    "create": false,   ❌ Não cria pacientes
    "edit": true,      ✅ Edita pacientes
    "delete": false    ❌ Não deleta pacientes
  },
  "checkins": {
    "view": true,      ✅ Vê check-ins
    "create": true,    ✅ Cria check-ins
    "edit": true,      ✅ Edita check-ins
    "delete": false    ❌ Não deleta check-ins
  }
}
```

**Resultado na Interface:**
- ✅ Menu mostra: Dashboard, Pacientes, Check-ins
- ❌ Menu NÃO mostra: Métricas Comerciais, Gestão de Equipe
- ✅ Botão "Editar Paciente" aparece
- ❌ Botão "Deletar Paciente" NÃO aparece
- ✅ Botão "Novo Check-in" aparece

---

## 🐛 TROUBLESHOOTING

### Problema: Membro não vê dados do owner

**Solução:**
1. Verifique se o SQL foi executado corretamente
2. Faça logout e login novamente
3. Limpe o cache do navegador (Ctrl+Shift+Delete)
4. Execute no SQL Editor:
```sql
SELECT * FROM team_members WHERE user_id = auth.uid();
-- Deve retornar o registro do membro
```

### Problema: Owner não vê seus próprios dados

**Solução:**
1. Verifique se `user_id` está preenchido nos pacientes:
```sql
SELECT COUNT(*) as total, COUNT(user_id) as com_user_id FROM patients;
```

2. Se `user_id` estiver NULL, popule:
```sql
-- Descubra seu user_id
SELECT id, email FROM auth.users;

-- Atribua aos seus pacientes
UPDATE patients SET user_id = 'SEU_USER_ID_AQUI' WHERE user_id IS NULL;
```

### Problema: Erro "permission denied"

**Solução:**
1. Verifique se RLS está habilitado:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('patients', 'checkin');
```

2. Verifique se as políticas existem:
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('patients', 'checkin');
```

---

## 📚 ARQUIVOS CRIADOS

1. **`sql/verificar-estrutura-tabelas.sql`**
   - Verifica estrutura das tabelas
   - Confirma se `user_id` existe
   - Lista políticas RLS

2. **`sql/fix-rls-with-existing-user-id.sql`** ⭐ PRINCIPAL
   - Corrige políticas RLS
   - Permite acesso de membros da equipe
   - Mantém isolamento entre owners

3. **`SOLUCAO_FINAL_GESTAO_EQUIPE.md`** (este arquivo)
   - Guia completo de implementação
   - Testes e troubleshooting

---

## 🎉 CONCLUSÃO

Após executar o SQL `fix-rls-with-existing-user-id.sql`, o sistema estará **100% funcional**:

✅ Cada nutri vê apenas seus dados
✅ Membros veem dados do owner
✅ Isolamento total entre owners
✅ Permissões granulares funcionando
✅ Menu dinâmico baseado em permissões
✅ Sistema de gestão de equipe completo

**Próximo passo:** Execute o SQL e teste! 🚀
