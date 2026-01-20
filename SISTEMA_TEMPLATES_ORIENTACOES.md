# Sistema de Templates de Orientações (Orientações Favoritas)

## Visão Geral

Sistema que permite criar **orientações favoritas** (templates) que aparecem automaticamente em todos os novos planos alimentares. Você pode ativar/desativar orientações específicas em cada plano individual sem deletá-las.

## Funcionalidades Implementadas

### 1. ✅ Banco de Dados

**Arquivo SQL**: `sql/add-guideline-templates-system.sql`

**Novos Campos na Tabela `diet_guidelines`**:
- `is_template` (BOOLEAN): Indica se é um template global
- `user_id` (UUID): ID do usuário dono do template
- `is_active` (BOOLEAN): Indica se está ativo (visível)

**Função SQL**:
- `copy_guideline_templates_to_plan(p_diet_plan_id, p_user_id)`: Copia templates ativos para um novo plano

**RLS Policies**: Atualizadas para suportar templates e acesso de equipe

### 2. ✅ Hook Personalizado

**Arquivo**: `src/hooks/use-guideline-templates.ts`

**Funções Disponíveis**:
```typescript
const {
  templates,                    // Lista de templates
  loading,                      // Estado de carregamento
  loadTemplates,                // Recarregar templates
  createTemplate,               // Criar novo template
  updateTemplate,               // Atualizar template
  deleteTemplate,               // Deletar template
  toggleTemplateActive,         // Ativar/desativar template
  copyTemplatesToPlan,          // Copiar templates para plano
  toggleGuidelineInPlan         // Ativar/desativar orientação em plano
} = useGuidelineTemplates();
```

### 3. ✅ Modal de Gerenciamento

**Arquivo**: `src/components/diets/GuidelineTemplatesModal.tsx`

**Recursos**:
- ✅ Criar novos templates com editor rico
- ✅ Editar templates existentes
- ✅ Deletar templates
- ✅ Ativar/desativar templates (switch)
- ✅ Visualizar lista de templates
- ✅ Interface intuitiva com ícones de estrela

### 4. ✅ Integração no Formulário de Dieta

**Arquivo**: `src/components/diets/DietPlanForm.tsx`

**Mudanças**:
- ✅ Botão "Gerenciar Favoritas" na aba de Orientações
- ✅ Cópia automática de templates ao criar novo plano
- ✅ Templates aparecem automaticamente em novos planos

## Como Usar

### Para o Nutricionista

#### 1. Criar Orientações Favoritas

1. Abra qualquer plano alimentar (ou crie um novo)
2. Vá para a aba "Orientações"
3. Clique em "Gerenciar Favoritas" (botão amarelo com estrela)
4. Clique em "Criar Nova Orientação Favorita"
5. Preencha:
   - **Título**: Ex: "Área de Membros"
   - **Conteúdo**: Use o editor rico para formatar
6. Clique em "Salvar Template"

#### 2. Gerenciar Templates

**Ativar/Desativar**:
- Use o switch ao lado de cada template
- Templates **ativos** aparecem em novos planos
- Templates **inativos** não aparecem em novos planos

**Editar**:
- Clique no ícone de lápis (Edit2)
- Modifique o conteúdo
- Clique em "Salvar Template"

**Deletar**:
- Clique no ícone de lixeira (Trash2)
- Confirme a exclusão
- ⚠️ Ação permanente!

#### 3. Usar em Novos Planos

1. Crie um novo plano alimentar
2. Vá para a aba "Orientações"
3. **Automaticamente**: Todos os templates ativos foram copiados!
4. Você pode:
   - Editar orientações específicas deste plano
   - Adicionar mais orientações
   - Remover orientações que não quer neste plano

### Para o Paciente

- Orientações aparecem normalmente no portal do paciente
- Formato de lista minimizável
- Links clicáveis
- HTML renderizado corretamente

## Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────────┐
│ 1. NUTRICIONISTA CRIA TEMPLATES                             │
│    - Abre modal "Gerenciar Favoritas"                       │
│    - Cria orientações que usa frequentemente                │
│    - Marca como ativas                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. TEMPLATES FICAM SALVOS NO BANCO                          │
│    - is_template = TRUE                                     │
│    - user_id = ID do nutricionista                          │
│    - is_active = TRUE                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. NUTRICIONISTA CRIA NOVO PLANO                            │
│    - Preenche dados do plano                                │
│    - Clica em "Salvar"                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SISTEMA COPIA TEMPLATES AUTOMATICAMENTE                  │
│    - Função: copy_guideline_templates_to_plan()             │
│    - Copia apenas templates ATIVOS                          │
│    - Cria orientações no novo plano                         │
│    - is_template = FALSE (são cópias)                       │
│    - is_active = TRUE                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. NUTRICIONISTA PODE PERSONALIZAR                          │
│    - Editar orientações específicas deste plano             │
│    - Adicionar mais orientações                             │
│    - Remover orientações desnecessárias                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. PACIENTE VÊ AS ORIENTAÇÕES                               │
│    - No portal do paciente                                  │
│    - Formato lista minimizável                              │
│    - Links clicáveis                                        │
└─────────────────────────────────────────────────────────────┘
```

## Exemplos de Uso

### Exemplo 1: Orientação de Área de Membros

**Template Criado**:
```
Título: ☑️ ÁREA DE MEMBROS
Conteúdo:
<table>
  <tr>
    <td>NÃO SE ESQUEÇA DE ASSISTIR TODOS OS MÓDULOS DA ÁREA DE MEMBROS:</td>
  </tr>
  <tr>
    <td><a href="https://area-de-membros.com">https://area-de-membros.com</a></td>
  </tr>
</table>
```

**Resultado**:
- Aparece automaticamente em todos os novos planos
- Paciente vê a orientação formatada
- Link é clicável

### Exemplo 2: Orientação de Hidratação

**Template Criado**:
```
Título: 💧 Hidratação
Conteúdo:
<p><strong>Beba 2-3L de água por dia</strong></p>
<ul>
  <li>Ao acordar: 500ml</li>
  <li>Entre refeições: 200ml a cada hora</li>
  <li>Antes de dormir: 200ml</li>
</ul>
```

**Resultado**:
- Aparece em todos os novos planos
- Formatação HTML preservada
- Lista renderizada corretamente

## Vantagens

### Para o Nutricionista

1. **Economia de Tempo**: Não precisa reescrever orientações comuns
2. **Consistência**: Mesmas orientações em todos os planos
3. **Flexibilidade**: Pode personalizar em planos específicos
4. **Organização**: Templates centralizados em um só lugar
5. **Controle**: Ativa/desativa templates conforme necessário

### Para o Paciente

1. **Informações Completas**: Recebe todas as orientações importantes
2. **Formatação Rica**: HTML renderizado corretamente
3. **Links Funcionais**: Pode acessar recursos externos
4. **Fácil Leitura**: Lista minimizável e organizada

## Diferenças: Template vs Orientação de Plano

| Característica | Template | Orientação de Plano |
|----------------|----------|---------------------|
| **is_template** | TRUE | FALSE |
| **user_id** | ID do nutricionista | NULL |
| **diet_plan_id** | UUID dummy | ID do plano real |
| **Aparece em** | Modal de templates | Plano específico |
| **Editável** | Sim, afeta futuros planos | Sim, só este plano |
| **Deletável** | Sim, permanentemente | Sim, só deste plano |
| **Ativar/Desativar** | Sim, afeta futuros planos | Sim, só neste plano |

## Comportamentos Importantes

### 1. Templates Não Afetam Planos Existentes

- Criar/editar/deletar template **NÃO** afeta planos já criados
- Apenas novos planos recebem os templates
- Planos existentes mantêm suas orientações

### 2. Cópias São Independentes

- Orientações copiadas são **independentes** do template
- Editar orientação em um plano **NÃO** afeta o template
- Editar template **NÃO** afeta orientações já copiadas

### 3. Templates Inativos

- Templates com `is_active = FALSE` não são copiados
- Útil para orientações sazonais ou temporárias
- Pode reativar a qualquer momento

## Estrutura de Dados

### Template no Banco

```sql
INSERT INTO diet_guidelines (
  id,
  diet_plan_id,              -- UUID dummy
  guideline_type,            -- 'general'
  title,                     -- Título HTML
  content,                   -- Conteúdo HTML
  priority,                  -- Ordem de exibição
  is_template,               -- TRUE
  is_active,                 -- TRUE/FALSE
  user_id,                   -- ID do nutricionista
  created_at
) VALUES (
  uuid_generate_v4(),
  '00000000-0000-0000-0000-000000000000',
  'general',
  '<strong>Hidratação</strong>',
  '<p>Beba 2-3L de água por dia</p>',
  0,
  TRUE,
  TRUE,
  'user-uuid-here',
  NOW()
);
```

### Orientação Copiada

```sql
INSERT INTO diet_guidelines (
  id,
  diet_plan_id,              -- ID do plano real
  guideline_type,            -- 'general'
  title,                     -- Copiado do template
  content,                   -- Copiado do template
  priority,                  -- Copiado do template
  is_template,               -- FALSE
  is_active,                 -- TRUE
  user_id,                   -- NULL
  created_at
) VALUES (
  uuid_generate_v4(),
  'real-plan-uuid-here',
  'general',
  '<strong>Hidratação</strong>',
  '<p>Beba 2-3L de água por dia</p>',
  0,
  FALSE,
  TRUE,
  NULL,
  NOW()
);
```

## Segurança (RLS)

### Policies Implementadas

1. **SELECT**: Usuário vê seus templates e orientações de seus planos
2. **INSERT**: Usuário pode criar templates e orientações em seus planos
3. **UPDATE**: Usuário pode atualizar seus templates e orientações
4. **DELETE**: Usuário pode deletar seus templates e orientações

### Acesso de Equipe

- Membros da equipe podem ver/editar orientações dos planos do owner
- Membros **NÃO** podem ver/editar templates do owner
- Cada membro tem seus próprios templates

## Testes Manuais

### Teste 1: Criar Template

1. ✅ Abrir modal "Gerenciar Favoritas"
2. ✅ Clicar em "Criar Nova Orientação Favorita"
3. ✅ Preencher título e conteúdo
4. ✅ Salvar
5. ✅ Verificar que aparece na lista

### Teste 2: Copiar para Novo Plano

1. ✅ Criar template ativo
2. ✅ Criar novo plano alimentar
3. ✅ Ir para aba "Orientações"
4. ✅ Verificar que template foi copiado

### Teste 3: Template Inativo

1. ✅ Desativar template (switch OFF)
2. ✅ Criar novo plano
3. ✅ Verificar que template NÃO foi copiado

### Teste 4: Editar Template

1. ✅ Editar template existente
2. ✅ Criar novo plano
3. ✅ Verificar que novo plano tem versão atualizada
4. ✅ Verificar que planos antigos mantêm versão antiga

### Teste 5: Deletar Template

1. ✅ Deletar template
2. ✅ Verificar que sumiu da lista
3. ✅ Criar novo plano
4. ✅ Verificar que template NÃO foi copiado
5. ✅ Verificar que planos antigos mantêm orientações

## Próximos Passos (Opcional)

Melhorias futuras que podem ser implementadas:

1. **Categorias de Templates**: Agrupar templates por categoria
2. **Compartilhar Templates**: Compartilhar templates entre membros da equipe
3. **Importar/Exportar**: Exportar templates para backup
4. **Templates Padrão**: Templates pré-criados para novos usuários
5. **Estatísticas**: Mostrar quais templates são mais usados
6. **Versionamento**: Histórico de alterações em templates
7. **Duplicar Template**: Criar cópia de template existente
8. **Reordenar Templates**: Drag and drop para reordenar

## Arquivos Criados/Modificados

### Novos Arquivos

1. ✅ `sql/add-guideline-templates-system.sql`
2. ✅ `src/hooks/use-guideline-templates.ts`
3. ✅ `src/components/diets/GuidelineTemplatesModal.tsx`
4. ✅ `SISTEMA_TEMPLATES_ORIENTACOES.md` (este arquivo)

### Arquivos Modificados

1. ✅ `src/components/diets/DietPlanForm.tsx`
   - Adicionado import do modal
   - Adicionado hook useGuidelineTemplates
   - Adicionado botão "Gerenciar Favoritas"
   - Adicionado chamada para copiar templates ao criar plano
   - Adicionado renderização do modal

## Conclusão

O sistema de templates de orientações está **totalmente funcional** e pronto para uso. Ele economiza tempo do nutricionista, garante consistência nas orientações e oferece flexibilidade para personalizar planos específicos.

🎉 **Sistema implementado com sucesso!**
