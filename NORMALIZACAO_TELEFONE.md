# Normalização de Telefone - Sistema de Checkin

## Problema Resolvido

O Typebot/Sheets envia telefones em diferentes formatos:
- `+553497226444` (com código do país)
- `5534997226444` (com 9 extra)
- `3497226444` (formato normal)
- `(34) 97226-4444` (com formatação)

## Solução Implementada

### 1. Normalização Automática

O sistema agora normaliza automaticamente todos os telefones para o formato padrão:

```javascript
// Exemplos de normalização:
"+553497226444" → "3497226444"
"5534997226444" → "3497226444" 
"(34) 97226-4444" → "3497226444"
"3497226444" → "3497226444"
```

### 2. Busca Flexível

O sistema busca pacientes usando duas estratégias:

1. **Busca Exata**: Procura pelo telefone normalizado
2. **Busca por Últimos 8 Dígitos**: Se não encontrar, busca pelos últimos 8 dígitos

### 3. Criação Automática

Se não encontrar o paciente, cria automaticamente com:
- Telefone normalizado
- Nome do checkin (se disponível)
- Observação com telefone original

## Como Funciona

### Passo 1: Normalização
```javascript
const normalizePhone = (phone: string): string => {
  // Remove tudo que não é número
  const numbersOnly = phone.replace(/\D/g, '');
  
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
};
```

### Passo 2: Busca de Paciente
```javascript
// 1. Busca exata
const { data: patient } = await supabase
  .from('patients')
  .select('id, telefone')
  .eq('telefone', normalizedPhone)
  .single();

// 2. Se não encontrou, busca pelos últimos 8 dígitos
if (!patient) {
  const last8Digits = normalizedPhone.slice(-8);
  const { data: patients } = await supabase
    .from('patients')
    .select('id, telefone')
    .like('telefone', `%${last8Digits}`);
}
```

### Passo 3: Criação Automática
```javascript
if (!patient) {
  const newPatient = {
    telefone: normalizedPhone,
    nome: inputData.nome || `Paciente ${normalizedPhone}`,
    observacao: `Paciente criado automaticamente via checkin (telefone original: ${telefone})`
  };
  // Criar paciente...
}
```

## Logs de Debug

O sistema mostra logs detalhados:

```
Buscando paciente com telefone normalizado: 3497226444
Buscando pelos últimos 8 dígitos: 7226444
Paciente encontrado pelos últimos 8 dígitos: 3497226444
Paciente encontrado: 3497226444 (ID: abc123-def456)
```

## Benefícios

✅ **Aceita qualquer formato de telefone**
✅ **Encontra pacientes mesmo com erros de digitação**
✅ **Cria pacientes automaticamente se necessário**
✅ **Mantém histórico do telefone original**
✅ **Busca flexível por últimos 8 dígitos**

## Testando

Use o arquivo `test-webhook-checkin.js` para testar diferentes formatos:

```bash
node test-webhook-checkin.js
```

O teste verifica:
- Telefone com +55
- Telefone com 9 extra
- Telefone normal
- Telefone com formatação

## Exemplo Prático

**Dados do Typebot:**
```json
{
  "telefone": "+553497226444",
  "mes_ano": "2024-01",
  "peso": "70.5",
  "nome": "João Silva"
}
```

**Processamento:**
1. Normaliza: `+553497226444` → `3497226444`
2. Busca paciente com `3497226444`
3. Se não encontrar, busca por `7226444`
4. Se ainda não encontrar, cria paciente
5. Salva checkin com telefone normalizado

**Resultado:**
- Paciente encontrado/criado com telefone `3497226444`
- Checkin vinculado ao paciente correto
- Logs mostram o processo completo
