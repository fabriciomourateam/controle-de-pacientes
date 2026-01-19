# Correção de Alinhamento da Tabela de Evolução

## Status: ✅ PARCIALMENTE CONCLUÍDO

## Problema
As colunas da tabela de evolução no CheckinFeedbackCard estavam desalinhadas. O usuário solicitou que a tabela mostre **5 colunas**:
1. Métrica
2. Penúltimo check-in (quando `previousCheckins.length >= 2`)
3. Último check-in (quando `previousCheckins.length > 0`)
4. Atual (sempre visível)
5. Evolução (sempre visível)

## Linhas Corrigidas

### ✅ Cabeçalho da Tabela
- 5 colunas implementadas corretamente

### ✅ Linha de Peso
- Simplificada (sem edição inline)
- 5 colunas alinhadas corretamente
- Confirmado pelo usuário

### ✅ Linha de Cintura
- Simplificada (sem edição inline)
- 5 colunas alinhadas corretamente
- Confirmado pelo usuário

### ✅ Linha de Quadril
- Simplificada (sem edição inline)
- 5 colunas alinhadas corretamente
- Removida funcionalidade de edição inline
- Usa `previousCheckins[previousCheckins.length - 2]` para penúltimo
- Usa `evolutionData.quadril_anterior` para último
- Usa `evolutionData.quadril_atual` para atual

### ✅ Linha de Aproveitamento
- Simplificada (sem edição inline)
- 5 colunas alinhadas corretamente
- Usa `previousCheckins[previousCheckins.length - 2].percentual_aproveitamento` para penúltimo
- Usa `previousCheckins[previousCheckins.length - 1].percentual_aproveitamento` para último
- Usa `evolutionData.aderencia_atual` para atual

## Próximos Passos

### Linhas Pendentes (ainda com edição inline e 4 colunas)
1. **Treinos** - Precisa ser simplificada
2. **Cardio** - Precisa ser simplificada
3. **Água** - Precisa ser simplificada
4. **Sono** - Precisa ser simplificada
5. **Refeições Livres** - Precisa ser simplificada
6. **Beliscos** - Precisa ser simplificada

## Padrão a Seguir

Para cada linha pendente, aplicar o mesmo padrão das linhas de Peso/Cintura/Quadril:

```tsx
<tr className="border-b border-slate-700/30">
  <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">🏃 Treinos</td>
  {/* Colunas históricas (todos exceto os 2 últimos) */}
  {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
    <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
      {getCheckinMetricValue(historicCheckin, 'treino') || '-'}
    </td>
  ))}
  {/* Coluna penúltimo (se houver pelo menos 2) */}
  {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
      <span className="text-slate-400">
        {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], 'treino') || '-'}
      </span>
    </td>
  )}
  {/* Coluna último (sempre visível se houver pelo menos 1) */}
  {previousCheckins.length > 0 && (
    <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
      <span className="text-slate-400">
        {evolutionData.treino_anterior || '-'}
      </span>
    </td>
  )}
  {/* Coluna atual (sempre visível) */}
  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
    <span className="text-slate-200">
      {evolutionData.treino_atual ?? '-'}
    </span>
  </td>
  {/* Coluna de evolução */}
  <td className={`py-1.5 px-2 text-center font-medium sticky right-0 z-10 ${evolutionData.treino_diferenca > 0 ? 'text-green-400' : evolutionData.treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}`}>
    {evolutionData.treino_diferenca !== 0
      ? `${evolutionData.treino_diferenca > 0 ? '+' : ''}${evolutionData.treino_diferenca}`
      : '0'}
  </td>
</tr>
```

## Arquivo Modificado
- `controle-de-pacientes/src/components/checkins/CheckinFeedbackCard.tsx`
