# Exemplo Prático - Configuração dos Nodes no N8N

## 1. Node Function - Normalização de Telefone

**Tipo:** Function
**Nome:** "Normalizar Telefone"

```javascript
// Função para normalizar telefone
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove tudo que não é número
  const numbersOnly = phone.toString().replace(/\D/g, '');
  
  // Remove código do país (55) se presente
  let cleanPhone = numbersOnly;
  if (numbersOnly.startsWith('55') && numbersOnly.length > 10) {
    cleanPhone = numbersOnly.substring(2);
  }
  
  // Remove 9 extra se presente
  if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
    cleanPhone = cleanPhone.substring(1);
  }
  
  return cleanPhone;
}

// Aplicar normalização
const inputData = $input.all()[0].json;
const normalizedPhone = normalizePhone(inputData.telefone);

// Retornar dados com telefone normalizado
return [{
  json: {
    ...inputData,
    telefone_normalizado: normalizedPhone,
    telefone_original: inputData.telefone,
    debug_normalizacao: {
      original: inputData.telefone,
      normalizado: normalizedPhone,
      timestamp: new Date().toISOString()
    }
  }
}];
```

## 2. Node Supabase - Buscar Paciente (Exato)

**Tipo:** Supabase
**Nome:** "Buscar Paciente Exato"
**Ação:** Select
**Tabela:** patients
**Colunas:** id, telefone, nome, email
**Filtros:**
- Campo: `telefone`
- Operador: `equals`
- Valor: `{{ $json.telefone_normalizado }}`

## 3. Node IF - Verificar se Encontrou

**Tipo:** IF
**Nome:** "Paciente Encontrado?"
**Condição:** `{{ $json.id }}` exists

**True:** Continuar para Merge
**False:** Ir para busca por últimos 8 dígitos

## 4. Node Supabase - Buscar por Últimos 8 Dígitos

**Tipo:** Supabase
**Nome:** "Buscar por Últimos 8 Dígitos"
**Ação:** Select
**Tabela:** patients
**Colunas:** id, telefone, nome, email
**Filtros:**
- Campo: `telefone`
- Operador: `like`
- Valor: `%{{ $json.telefone_normalizado.slice(-8) }}`

## 5. Node IF - Verificar Busca por 8 Dígitos

**Tipo:** IF
**Nome:** "Encontrou por 8 Dígitos?"
**Condição:** `{{ $json.id }}` exists

**True:** Continuar para Merge
**False:** Ir para criar paciente

## 6. Node Supabase - Criar Paciente

**Tipo:** Supabase
**Nome:** "Criar Paciente"
**Ação:** Insert
**Tabela:** patients

**Dados para inserir:**
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

## 7. Node Merge - Combinar Dados

**Tipo:** Merge
**Nome:** "Combinar Dados"
**Modo:** Merge By Index
**Input 1:** Dados originais do Typebot
**Input 2:** Dados do paciente (encontrado ou criado)

## 8. Node Set - Preparar Dados do Checkin

**Tipo:** Set
**Nome:** "Preparar Checkin"

**Campos:**
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

## 9. Node Supabase - Inserir Checkin

**Tipo:** Supabase
**Nome:** "Inserir Checkin"
**Ação:** Insert
**Tabela:** checkin

**Dados:** Usar todos os campos do node anterior

## 10. Node Set - Resposta de Sucesso

**Tipo:** Set
**Nome:** "Resposta Sucesso"

```json
{
  "success": true,
  "message": "Checkin inserido com sucesso",
  "checkin_id": "{{ $json.id }}",
  "paciente_telefone": "{{ $json.telefone }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

## Fluxo Visual no N8N

```
Typebot
    ↓
[Function: Normalizar Telefone]
    ↓
[Supabase: Buscar Paciente Exato]
    ↓
[IF: Paciente Encontrado?]
    ↓ Sim                    ↓ Não
[Set: Resposta]    [Supabase: Buscar 8 Dígitos]
                        ↓
                    [IF: Encontrou 8 Dígitos?]
                        ↓ Sim                    ↓ Não
                    [Set: Resposta]    [Supabase: Criar Paciente]
                                            ↓
                                    [Merge: Combinar Dados]
                                            ↓
                                    [Set: Preparar Checkin]
                                            ↓
                                    [Supabase: Inserir Checkin]
                                            ↓
                                    [Set: Resposta Sucesso]
```

## Configurações de Error Handling

Para cada node Supabase, configure:

**Error Handling:**
- ✅ Continue on Error
- ✅ Retry on Error (3 tentativas)
- ✅ Set Error Message

**Error Message:**
```json
{
  "success": false,
  "error": "{{ $json.error.message }}",
  "node": "{{ $json.node }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

## Logs de Debug

Adicione um **Set Node** após cada operação importante:

```json
{
  "debug": {
    "node": "Nome do Node",
    "telefone_original": "{{ $json.telefone_original }}",
    "telefone_normalizado": "{{ $json.telefone_normalizado }}",
    "paciente_encontrado": "{{ $json.id ? 'Sim' : 'Não' }}",
    "timestamp": "{{ new Date().toISOString() }}"
  }
}
```

Esta configuração resolve completamente o problema de normalização de telefone diretamente no N8N! 🎉
