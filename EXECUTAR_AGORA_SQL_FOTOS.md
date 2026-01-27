# 🚀 EXECUTAR AGORA - SQL para Sistema de Fotos

## ⚠️ IMPORTANTE: Execute este SQL no Supabase AGORA!

O sistema de configuração de fotos está pronto, mas precisa da tabela no banco de dados.

---

## 📋 Passo a Passo Rápido

### 1️⃣ Acesse o Supabase
- URL: https://supabase.com/dashboard
- Selecione seu projeto
- Clique em **SQL Editor** no menu lateral

### 2️⃣ Copie e Execute o SQL Abaixo

Clique em **New Query**, cole o SQL abaixo e clique em **Run**:

```sql
-- ============================================
-- TABELA: photo_visibility_settings
-- Sistema de controle de visibilidade de fotos
-- ============================================

-- Criar tabela
CREATE TABLE IF NOT EXISTS photo_visibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_telefone TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  zoom_level DECIMAL DEFAULT 1.0,
  position_x DECIMAL DEFAULT 0,
  position_y DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(patient_telefone, photo_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone 
ON photo_visibility_settings(patient_telefone);

CREATE INDEX IF NOT EXISTS idx_photo_visibility_telefone_photo 
ON photo_visibility_settings(patient_telefone, photo_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_photo_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_photo_visibility_updated_at
BEFORE UPDATE ON photo_visibility_settings
FOR EACH ROW
EXECUTE FUNCTION update_photo_visibility_updated_at();

-- Habilitar RLS
ALTER TABLE photo_visibility_settings ENABLE ROW LEVEL SECURITY;

-- Política: Owner pode ver e editar suas configurações
CREATE POLICY photo_visibility_owner_policy ON photo_visibility_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.telefone = photo_visibility_settings.patient_telefone
    AND patients.user_id = auth.uid()
  )
);

-- Política: Membros da equipe podem ver configurações (CORRIGIDA)
-- Usa user_id ao invés de member_id
CREATE POLICY photo_visibility_team_policy ON photo_visibility_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients p
    INNER JOIN team_members tm ON tm.owner_id = p.user_id
    WHERE p.telefone = photo_visibility_settings.patient_telefone
    AND tm.user_id = auth.uid()
    AND tm.is_active = true
  )
);

-- Comentários
COMMENT ON TABLE photo_visibility_settings IS 'Configurações de visibilidade e ajustes (zoom, posição) das fotos de evolução';
COMMENT ON COLUMN photo_visibility_settings.patient_telefone IS 'Telefone do paciente';
COMMENT ON COLUMN photo_visibility_settings.photo_id IS 'ID único da foto: initial-{angle} ou checkin-{id}-foto-{number}';
COMMENT ON COLUMN photo_visibility_settings.visible IS 'Se true, foto é visível para o paciente';
COMMENT ON COLUMN photo_visibility_settings.zoom_level IS 'Nível de zoom (0.5 a 3.0)';
COMMENT ON COLUMN photo_visibility_settings.position_x IS 'Posição horizontal (-100 a 100)';
COMMENT ON COLUMN photo_visibility_settings.position_y IS 'Posição vertical (-100 a 100)';
```

### 3️⃣ Verificar se Funcionou

Execute este SQL para verificar:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'photo_visibility_settings'
ORDER BY ordinal_position;
```

**Deve retornar 9 colunas:** id, patient_telefone, photo_id, visible, zoom_level, position_x, position_y, created_at, updated_at

### 4️⃣ Recarregar o Sistema

1. Volte para o sistema
2. Pressione **Ctrl+F5** para recarregar (limpa cache)
3. Acesse a página de evolução de um paciente
4. Clique no botão **"Configurar Fotos"** (ícone de engrenagem)
5. ✅ Deve abrir o modal sem erros!

---

## ✅ O Que Foi Implementado

### Item 4: Controle de Visibilidade
- ✅ Nutricionista pode ocultar fotos específicas
- ✅ Paciente só vê fotos marcadas como visíveis
- ✅ Toggle on/off para cada foto

### Item 6: Ajuste de Zoom
- ✅ Zoom de 0.5x a 3.0x
- ✅ Preview em tempo real
- ✅ Salvar configuração por foto

### Item 8: Ajuste de Posição
- ✅ Posição horizontal (-100% a +100%)
- ✅ Posição vertical (-100% a +100%)
- ✅ Centralizar com um clique

### Bônus: Evolução Fotográfica Expandida
- ✅ Seção inicia sempre expandida por padrão
- ✅ Estado salvo no sessionStorage
- ✅ Preserva preferência do usuário

---

## 🎯 Como Usar Após Executar o SQL

### Para Nutricionista:
1. Acesse a página de evolução do paciente
2. Clique no botão **"Configurar Fotos"** (Settings icon no header)
3. No modal:
   - **Lista à esquerda:** Todas as fotos disponíveis
   - **Toggle:** Mostrar/ocultar foto para o paciente
   - **Clique na foto:** Abre controles de zoom e posição
   - **Sliders:** Ajuste zoom e posição em tempo real
   - **Preview:** Veja como ficará antes de salvar
   - **Salvar:** Clique em "Salvar Ajustes desta Foto"

### Para Paciente (Portal):
- Verá apenas as fotos marcadas como visíveis
- Fotos com zoom/posição ajustados aparecem otimizados
- Não tem acesso ao botão de configuração

---

## 🐛 Troubleshooting

### Erro 404 persiste?
1. Aguarde 1-2 minutos (cache do Supabase)
2. Recarregue com Ctrl+F5
3. Verifique se o SQL foi executado sem erros

### Erro de permissão?
1. Verifique se você está logado
2. Verifique se o RLS foi criado (execute SQL de verificação acima)

### Fotos não aparecem?
1. Verifique se o telefone do paciente está correto
2. Verifique se as fotos têm URLs válidas
3. Abra o console (F12) e veja se há erros

---

## 📁 Arquivos Relacionados

- **SQL:** `sql/create-photo-visibility-settings.sql`
- **Hook:** `src/hooks/use-photo-visibility.ts`
- **Modal:** `src/components/evolution/PhotoVisibilityModal.tsx`
- **Componente:** `src/components/evolution/PhotoComparison.tsx`
- **Documentação:** `IMPLEMENTACAO_ITENS_4_6_8_FOTOS.md`

---

## 🎉 Pronto!

Após executar o SQL, o sistema estará 100% funcional!

**Próximos passos sugeridos:**
1. Testar com um paciente real
2. Configurar visibilidade de algumas fotos
3. Ajustar zoom/posição conforme necessário
4. Verificar no portal do paciente como ficou

**Dúvidas?** Consulte `EXECUTAR_SQL_PHOTO_VISIBILITY.md` para mais detalhes.
