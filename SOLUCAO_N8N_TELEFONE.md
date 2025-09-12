# Solução N8N - Normalização de Telefone e Criação de Paciente

## Configuração no N8N

### 1. Node de Função - Normalização de Telefone

Adicione um **Function Node** após receber os dados do Typebot:

```javascript
// Normalizar telefone - remove +55, 9 extra e formatação
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove tudo que não é número
  const numbersOnly = phone.toString().replace(/\D/g, '');
  
  // Remove código do país (55) se presente
  let cleanPhone = numbersOnly;
  if (numbersOnly.startsWith('55') && numbersOnly.length > 10) {
    cleanPhone = numbersOnly.substring(2);
  }
  
  // Remove 9 extra se presente (formato antigo: 9XXXXXXXX)
  if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  return cleanPhone;
}

// Aplicar normalização
const normalizedPhone = normalizePhone($input.all()[0].json.telefone);

// Retornar dados com telefone normalizado
return [{
  json: {
    ...$input.all()[0].json,
    telefone_normalizado: normalizedPhone,
    telefone_original: $input.all()[0].json.telefone
  }
}];
```

### 2. Node Supabase - Buscar Paciente

Configure um **Supabase Node** para buscar o paciente:

**Query Type:** `Select`
**Table:** `patients`
**Columns:** `id, telefone, nome`
**Filter:** 
- Field: `telefone`
- Operator: `equals`
- Value: `{{ $json.telefone_normalizado }}`

### 3. Node de Condição - Verificar se Paciente Existe

Adicione um **IF Node** para verificar se o paciente foi encontrado:

**Condition:** `{{ $json.id }}` exists

### 4. Node Supabase - Buscar por Últimos 8 Dígitos (Se não encontrou)

Se o paciente não foi encontrado, adicione outro **Supabase Node**:

**Query Type:** `Select`
**Table:** `patients`
**Columns:** `id, telefone, nome`
**Filter:**
- Field: `telefone`
- Operator: `like`
- Value: `%{{ $json.telefone_normalizado.slice(-8) }}`

### 5. Node de Condição - Verificar Busca por Últimos 8 Dígitos

Adicione outro **IF Node** para verificar se encontrou pelos últimos 8 dígitos:

**Condition:** `{{ $json.id }}` exists

### 6. Node Supabase - Criar Paciente (Se não encontrou)

Se ainda não encontrou, adicione um **Supabase Node** para criar:

**Query Type:** `Insert`
**Table:** `patients`
**Columns to Insert:**
```json
{
  "telefone": "{{ $json.telefone_normalizado }}",
  "nome": "{{ $json.nome || 'Paciente ' + $json.telefone_normalizado }}",
  "apelido": "{{ $json.apelido || null }}",
  "email": "{{ $json.email || null }}",
  "genero": "{{ $json.genero || null }}",
  "data_nascimento": "{{ $json.data_nascimento || null }}",
  "inicio_acompanhamento": "{{ new Date().toISOString().split('T')[0] }}",
  "plano": "{{ $json.plano || 'Plano Básico' }}",
  "observacao": "Paciente criado automaticamente via checkin (telefone original: {{ $json.telefone_original }})"
}
```

### 7. Node de Merge - Combinar Dados

Adicione um **Merge Node** para combinar os dados do paciente com os dados do checkin:

**Mode:** `Merge By Index`
**Input 1:** Dados do Typebot
**Input 2:** Dados do Paciente (encontrado ou criado)

### 8. Node Supabase - Inserir Checkin

Finalmente, adicione um **Supabase Node** para inserir o checkin:

**Query Type:** `Insert`
**Table:** `checkin`
**Columns to Insert:**
```json
{
  "telefone": "{{ $json.telefone_normalizado }}",
  "mes_ano": "{{ $json.mes_ano }}",
  "data_checkin": "{{ $json.data_checkin || new Date().toISOString().split('T')[0] }}",
  "data_preenchimento": "{{ $json.data_preenchimento || new Date().toISOString() }}",
  "peso": "{{ $json.peso || null }}",
  "medida": "{{ $json.medida || null }}",
  "treino": "{{ $json.treino || null }}",
  "cardio": "{{ $json.cardio || null }}",
  "agua": "{{ $json.agua || null }}",
  "sono": "{{ $json.sono || null }}",
  "ref_livre": "{{ $json.ref_livre || null }}",
  "beliscos": "{{ $json.beliscos || null }}",
  "oq_comeu_ref_livre": "{{ $json.oq_comeu_ref_livre || null }}",
  "oq_beliscou": "{{ $json.oq_beliscou || null }}",
  "comeu_menos": "{{ $json.comeu_menos || null }}",
  "fome_algum_horario": "{{ $json.fome_algum_horario || null }}",
  "alimento_para_incluir": "{{ $json.alimento_para_incluir || null }}",
  "melhora_visual": "{{ $json.melhora_visual || null }}",
  "quais_pontos": "{{ $json.quais_pontos || null }}",
  "objetivo": "{{ $json.objetivo || null }}",
  "dificuldades": "{{ $json.dificuldades || null }}",
  "stress": "{{ $json.stress || null }}",
  "libido": "{{ $json.libido || null }}",
  "tempo": "{{ $json.tempo || null }}",
  "descanso": "{{ $json.descanso || null }}",
  "tempo_cardio": "{{ $json.tempo_cardio || null }}",
  "foto_1": "{{ $json.foto_1 || null }}",
  "foto_2": "{{ $json.foto_2 || null }}",
  "foto_3": "{{ $json.foto_3 || null }}",
  "foto_4": "{{ $json.foto_4 || null }}",
  "telefone_checkin": "{{ $json.telefone_checkin || null }}",
  "pontos_treinos": "{{ $json.pontos_treinos || null }}",
  "pontos_cardios": "{{ $json.pontos_cardios || null }}",
  "pontos_descanso_entre_series": "{{ $json.pontos_descanso_entre_series || null }}",
  "pontos_refeicao_livre": "{{ $json.pontos_refeicao_livre || null }}",
  "pontos_beliscos": "{{ $json.pontos_beliscos || null }}",
  "pontos_agua": "{{ $json.pontos_agua || null }}",
  "pontos_sono": "{{ $json.pontos_sono || null }}",
  "pontos_qualidade_sono": "{{ $json.pontos_qualidade_sono || null }}",
  "pontos_stress": "{{ $json.pontos_stress || null }}",
  "pontos_libido": "{{ $json.pontos_libido || null }}",
  "total_pontuacao": "{{ $json.total_pontuacao || null }}",
  "percentual_aproveitamento": "{{ $json.percentual_aproveitamento || null }}"
}
```

## Fluxo Completo no N8N

```
Typebot → Function (Normalizar) → Supabase (Buscar Exato) → IF (Encontrou?)
                                                                    ↓ Não
                                                          Supabase (Buscar 8 dígitos) → IF (Encontrou?)
                                                                                                ↓ Não
                                                                                      Supabase (Criar Paciente)
                                                                    ↓ Sim                    ↓
                                                          Merge (Combinar) ← ← ← ← ← ← ← ← ← ←
                                                                    ↓
                                                          Supabase (Inserir Checkin)
```

## Configurações Importantes

### 1. Tratamento de Erros
Configure **Error Handling** em cada node Supabase para:
- Continuar o fluxo em caso de erro
- Logar erros para debug
- Retornar mensagem de erro apropriada

### 2. Logs de Debug
Adicione **Set Node** para logar informações:
```javascript
// Log de debug
return [{
  json: {
    ...$input.all()[0].json,
    debug: {
      telefone_original: $input.all()[0].json.telefone,
      telefone_normalizado: $input.all()[0].json.telefone_normalizado,
      timestamp: new Date().toISOString()
    }
  }
}];
```

### 3. Validação de Dados
Adicione validação antes de inserir:
```javascript
// Validar dados obrigatórios
if (!$json.telefone_normalizado || !$json.mes_ano) {
  throw new Error('Telefone e mês/ano são obrigatórios');
}
```

## Benefícios desta Solução

✅ **Resolve no N8N** - Não precisa de webhook externo
✅ **Normalização automática** - Remove +55, 9 extra, formatação
✅ **Busca flexível** - Encontra por telefone exato ou últimos 8 dígitos
✅ **Criação automática** - Cria paciente se não existir
✅ **Logs detalhados** - Para debug e monitoramento
✅ **Tratamento de erros** - Fluxo robusto e confiável

## Testando

1. Configure o fluxo no N8N
2. Teste com diferentes formatos de telefone
3. Verifique os logs de debug
4. Confirme se os dados estão sendo inseridos corretamente no Supabase

Esta solução resolve completamente o problema de normalização de telefone diretamente no N8N! 🎉
