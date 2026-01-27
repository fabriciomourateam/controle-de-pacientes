# Plano de Implementação: Itens 4, 6 e 8 - Sistema de Fotos Editáveis

## Contexto
Atualmente o componente `PhotoComparison` exibe todas as fotos disponíveis automaticamente. Precisamos adicionar controles para:
- **Item 4**: Escolher quais fotos mostrar, com zoom e reposicionamento
- **Item 6**: Ocultar evolução fotográfica quando não houver evolução
- **Item 8**: Controlar visibilidade para compartilhar com aluno

## Arquitetura Proposta

### 1. Nova Tabela no Supabase: `photo_visibility_settings`
```sql
CREATE TABLE photo_visibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_telefone TEXT NOT NULL,
  photo_id TEXT NOT NULL, -- formato: "checkin-{id}-foto-{number}" ou "initial-{angle}"
  visible BOOLEAN DEFAULT true,
  zoom_level DECIMAL DEFAULT 1.0,
  position_x DECIMAL DEFAULT 0,
  position_y DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(patient_telefone, photo_id)
);
```

### 2. Componente: `PhotoVisibilityEditor`
Modal para o nutricionista editar visibilidade e ajustes das fotos:
- Lista todas as fotos do paciente
- Toggle de visibilidade para cada foto
- Editor de zoom e posição (drag & drop)
- Preview em tempo real
- Botão "Salvar Configurações"

### 3. Modificações no `PhotoComparison`
- Adicionar prop `isEditable` (true para nutricionista, false para paciente)
- Filtrar fotos baseado em `photo_visibility_settings`
- Aplicar zoom e posição salvos
- Botão "Editar Fotos" (apenas para nutricionista)

### 4. Modificações no `PatientEvolutionTab`
- Adicionar botão "Configurar Fotos" no header (apenas para nutricionista)
- Passar prop `isEditable` para PhotoComparison
- Callback para recarregar após salvar configurações

### 5. Hook: `usePhotoVisibility`
```tsx
const usePhotoVisibility = (patientTelefone: string) => {
  const [settings, setSettings] = useState<PhotoVisibilitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadSettings = async () => { /* ... */ };
  const updateSetting = async (photoId, updates) => { /* ... */ };
  const toggleVisibility = async (photoId) => { /* ... */ };
  
  return { settings, loading, updateSetting, toggleVisibility, reload: loadSettings };
};
```

## Fluxo de Uso

### Para o Nutricionista:
1. Acessa página de evolução do paciente
2. Clica em "Configurar Fotos"
3. Modal abre com todas as fotos
4. Para cada foto:
   - Toggle visibilidade ON/OFF
   - Ajusta zoom (slider 0.5x - 3x)
   - Reposiciona foto (drag & drop)
5. Clica "Salvar"
6. Fotos são filtradas e ajustadas na visualização

### Para o Paciente (Portal):
1. Acessa portal do paciente
2. Vê apenas fotos marcadas como visíveis
3. Fotos aparecem com zoom e posição ajustados
4. Não vê botão "Configurar Fotos"

## Implementação Passo a Passo

### Passo 1: Criar Tabela SQL ✅
- Arquivo: `sql/create-photo-visibility-settings.sql`
- Executar no Supabase

### Passo 2: Criar Hook `usePhotoVisibility` ✅
- Arquivo: `src/hooks/use-photo-visibility.ts`
- Funções: load, update, toggle

### Passo 3: Criar Componente `PhotoEditor` ✅
- Arquivo: `src/components/evolution/PhotoEditor.tsx`
- Interface de edição com zoom e drag

### Passo 4: Criar Modal `PhotoVisibilityEditor` ✅
- Arquivo: `src/components/evolution/PhotoVisibilityEditor.tsx`
- Lista de fotos com controles

### Passo 5: Modificar `PhotoComparison` ✅
- Adicionar filtro de visibilidade
- Aplicar zoom e posição
- Botão "Editar Fotos"

### Passo 6: Modificar `PatientEvolutionTab` ✅
- Adicionar botão no header
- Passar props necessárias

### Passo 7: Testar Fluxo Completo ✅
- Nutricionista: editar e salvar
- Paciente: ver apenas visíveis
- Zoom e posição aplicados

## Benefícios

### Item 4: Escolher Fotos
✅ Nutricionista escolhe quais fotos mostrar
✅ Zoom para destacar áreas específicas
✅ Reposicionamento para melhor enquadramento

### Item 6: Ocultar Evolução
✅ Se todas as fotos estiverem ocultas, card não aparece
✅ Útil quando não há evolução significativa
✅ Evita frustração do paciente

### Item 8: Controle de Visibilidade
✅ Nutricionista controla o que o aluno vê
✅ Pode ocultar fotos desfavoráveis temporariamente
✅ Mostra apenas fotos que geram valor

## Próximos Passos
1. ✅ Criar SQL da tabela
2. ✅ Implementar hook
3. ✅ Criar componentes de edição
4. ✅ Integrar com PhotoComparison
5. ✅ Testar fluxo completo
6. ✅ Documentar uso

## Status
🔄 **EM PLANEJAMENTO** - Aguardando aprovação para iniciar implementação
