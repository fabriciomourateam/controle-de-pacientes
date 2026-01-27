# EXECUTAR AGORA - Sistema de Alimentos Customizados

## ⚠️ IMPORTANTE: Execute este SQL AGORA no Supabase

### PASSO 1: Acessar Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/qhzifnyjyxdushxorzrk/sql
2. Clique em "New Query"

### PASSO 2: Executar SQL

Copie e cole o conteúdo do arquivo: `sql/create-custom-foods-system.sql`

Ou copie diretamente daqui:

```sql
-- Sistema de Alimentos Customizados
-- Permite que cada usuário adicione seus próprios alimentos ao banco de dados

-- 1. Criar tabela de alimentos customizados
CREATE TABLE IF NOT EXISTS custom_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  calories_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  protein_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  carbs_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fats_per_100g NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fiber_per_100g NUMERIC(10, 2) DEFAULT 0,
  category TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_custom_foods_user_id ON custom_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);
CREATE INDEX IF NOT EXISTS idx_custom_foods_category ON custom_foods(category);
CREATE INDEX IF NOT EXISTS idx_custom_foods_is_favorite ON custom_foods(is_favorite);

-- 3. Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_custom_foods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_foods_updated_at
  BEFORE UPDATE ON custom_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_foods_updated_at();

-- 4. Habilitar RLS
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies de segurança
-- Policy para SELECT: usuário pode ver seus próprios alimentos
CREATE POLICY "users_can_select_own_custom_foods"
ON custom_foods
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  -- Membros da equipe podem ver alimentos do dono
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.owner_id = custom_foods.user_id
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
);

-- Policy para INSERT: usuário pode criar seus próprios alimentos
CREATE POLICY "users_can_insert_own_custom_foods"
ON custom_foods
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE: usuário pode atualizar seus próprios alimentos
CREATE POLICY "users_can_update_own_custom_foods"
ON custom_foods
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy para DELETE: usuário pode deletar seus próprios alimentos
CREATE POLICY "users_can_delete_own_custom_foods"
ON custom_foods
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 6. Verificar estrutura criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_foods'
ORDER BY ordinal_position;

-- 7. Verificar policies criadas
SELECT 
  policyname as "Nome da Policy",
  cmd as "Comando"
FROM pg_policies 
WHERE tablename = 'custom_foods';
```

### PASSO 3: Verificar Resultado

Você deve ver:

✅ **Tabela criada com sucesso**
- Colunas: id, user_id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, fiber_per_100g, category, notes, is_favorite, created_at, updated_at

✅ **Índices criados**
- idx_custom_foods_user_id
- idx_custom_foods_name
- idx_custom_foods_category
- idx_custom_foods_is_favorite

✅ **Trigger criado**
- trigger_update_custom_foods_updated_at

✅ **RLS habilitado**

✅ **4 Policies criadas**
- users_can_select_own_custom_foods
- users_can_insert_own_custom_foods
- users_can_update_own_custom_foods
- users_can_delete_own_custom_foods

### PASSO 4: Testar o Sistema

1. Acesse: http://localhost:5173/custom-foods
2. Clique em "Adicionar Alimento"
3. Preencha os dados:
   - Nome: Frango Grelhado Caseiro
   - Calorias: 165
   - Proteínas: 31
   - Carboidratos: 0
   - Gorduras: 3.6
   - Categoria: Proteínas
4. Clique em "Adicionar"
5. Verifique se o alimento aparece na lista

### PASSO 5: Testar Integração com Dietas

1. Vá para um paciente
2. Clique em "Elaborar Dieta"
3. Adicione uma refeição
4. Digite "Frango Grelhado Caseiro" no campo de alimento
5. Verifique se ele aparece nas sugestões
6. Selecione e veja se os valores nutricionais são preenchidos automaticamente

## ✅ Funcionalidades Implementadas

### 1. Página de Gerenciamento (`/custom-foods`)
- ✅ Listar todos os alimentos customizados
- ✅ Buscar por nome
- ✅ Filtrar por categoria
- ✅ Filtrar apenas favoritos
- ✅ Adicionar novo alimento
- ✅ Editar alimento existente
- ✅ Excluir alimento
- ✅ Marcar/desmarcar como favorito

### 2. Integração com Sistema de Dietas
- ✅ Alimentos customizados aparecem nas sugestões ao digitar
- ✅ Alimentos favoritos aparecem primeiro
- ✅ Valores nutricionais preenchidos automaticamente
- ✅ Cálculo proporcional baseado na quantidade

### 3. Segurança (RLS)
- ✅ Cada usuário vê apenas seus próprios alimentos
- ✅ Membros da equipe podem ver alimentos do dono
- ✅ Proteção contra acesso não autorizado

## 📚 Documentação

Consulte o arquivo `SISTEMA_ALIMENTOS_CUSTOMIZADOS.md` para:
- Guia completo de uso
- Estrutura da tabela
- Categorias sugeridas
- Exemplos de uso

## 🎯 Próximos Passos (Opcional)

1. **Importar alimentos em massa**: Criar funcionalidade para importar CSV/Excel
2. **Compartilhar alimentos**: Permitir compartilhar alimentos entre usuários
3. **Alimentos públicos**: Criar biblioteca pública de alimentos customizados
4. **Fotos de alimentos**: Adicionar suporte para fotos dos alimentos
5. **Unidades customizadas**: Permitir definir unidades além de gramas (colher, xícara, etc.)

## ❓ Problemas?

Se encontrar algum erro:

1. Verifique se o SQL foi executado completamente
2. Verifique se as policies foram criadas corretamente
3. Limpe o cache do navegador (Ctrl + Shift + R)
4. Verifique o console do navegador para erros
5. Verifique os logs do Supabase

## 🎉 Pronto!

Agora você tem um sistema completo de alimentos customizados integrado ao sistema de dietas!
