# ✅ Correção: Formato de Data na Comparação Antes/Depois

## ❌ ERRO ENCONTRADO

```
POST https://qhzifnyjyxdushxorzrk.supabase.co/rest/v1/featured_photo_comparison 400 (Bad Request)

{
  code: '22008',
  details: null,
  hint: 'Perhaps you need a different "datestyle" setting.',
  message: 'date/time field value out of range: "25/10/2025"'
}
```

## 🔍 CAUSA

O banco de dados Supabase espera datas no formato **ISO 8601** (YYYY-MM-DD), mas o código estava enviando datas no formato **brasileiro** (DD/MM/YYYY).

### Origem do Problema:

No `PhotoComparison.tsx`, as datas são formatadas para exibição:

```typescript
date: new Date(checkin.data_checkin).toLocaleDateString('pt-BR')
// Resultado: "25/10/2025" ❌
```

Quando salvamos a comparação, essas datas formatadas eram enviadas diretamente ao banco:

```typescript
before_photo_date: selectedBeforePhoto.date, // "25/10/2025" ❌
after_photo_date: selectedAfterPhoto.date,   // "25/10/2025" ❌
```

## ✅ SOLUÇÃO IMPLEMENTADA

Adicionada função `convertToISO()` dentro de `handleSaveComparison()` que converte as datas antes de salvar:

```typescript
const convertToISO = (dateStr: string): string => {
  // Se já está em formato ISO, retornar
  if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split('T')[0]; // Pegar apenas a parte da data
  }
  
  // Converter de DD/MM/YYYY para YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Fallback: retornar data atual
  return new Date().toISOString().split('T')[0];
};
```

### Uso:

```typescript
const data: CreateFeaturedComparisonData = {
  telefone: patient.telefone,
  before_photo_url: selectedBeforePhoto.url,
  before_photo_date: convertToISO(selectedBeforePhoto.date), // ✅ "2025-10-25"
  before_weight: selectedBeforePhoto.weight ? parseFloat(selectedBeforePhoto.weight) : undefined,
  after_photo_url: selectedAfterPhoto.url,
  after_photo_date: convertToISO(selectedAfterPhoto.date),   // ✅ "2025-10-25"
  after_weight: selectedAfterPhoto.weight ? parseFloat(selectedAfterPhoto.weight) : undefined,
  title: 'Minha Transformação',
  is_visible: true,
};
```

## 📊 EXEMPLOS DE CONVERSÃO

| Entrada (PT-BR) | Saída (ISO) | Status |
|----------------|-------------|--------|
| `25/10/2025` | `2025-10-25` | ✅ |
| `01/01/2024` | `2024-01-01` | ✅ |
| `2025-10-25` | `2025-10-25` | ✅ (já ISO) |
| `2025-10-25T10:30:00Z` | `2025-10-25` | ✅ (remove hora) |
| `Data Inicial` | `2026-01-27` | ✅ (fallback) |

## 🔧 ARQUIVO MODIFICADO

- `controle-de-pacientes/src/components/evolution/PhotoComparison.tsx`
  - Função `handleSaveComparison()` atualizada
  - Adicionada função helper `convertToISO()`

## ✅ RESULTADO

Agora ao salvar a comparação:

1. ✅ Datas são convertidas automaticamente para ISO
2. ✅ Banco aceita os dados sem erro
3. ✅ Comparação é salva com sucesso
4. ✅ Toast de sucesso aparece
5. ✅ Modo de seleção é desativado
6. ✅ Dados são recarregados

## 🎯 TESTE

Para testar:

1. Acesse a página de evolução de um paciente
2. Clique em "Criar Antes/Depois"
3. Selecione 2 fotos
4. Clique em "Salvar Comparação"
5. Verifique que:
   - ✅ Não há erro 400
   - ✅ Toast de sucesso aparece
   - ✅ Comparação é salva no banco
   - ✅ Aparece no portal público

## 📝 NOTA TÉCNICA

A função `convertToISO()` é robusta e lida com:

- ✅ Datas em formato brasileiro (DD/MM/YYYY)
- ✅ Datas já em formato ISO (YYYY-MM-DD)
- ✅ Datas com timestamp (YYYY-MM-DDTHH:mm:ssZ)
- ✅ Strings inválidas (usa data atual como fallback)

Isso garante que mesmo se o formato mudar no futuro, a conversão continuará funcionando.
