# Visão Compacta - Leads que vão para Call

## Implementação Concluída

Criada uma visão compacta para a seção "Leads que vão para Call" na página de Métricas Comerciais, com ordenação por taxa de conversão e salvamento automático da preferência do usuário.

## Funcionalidades Implementadas

### 1. Visão Compacta (Padrão)
- **Layout em tabela**: Uma linha por funil, mostrando todas as informações de forma condensada
- **Colunas**:
  - Nome do Funil
  - Total de Leads (azul)
  - Total de Calls (verde)
  - Taxa de Conversão (colorida por performance)
  - Barra de progresso visual

### 2. Visão Expandida (Opcional)
- **Layout em cards**: Grid responsivo com cards detalhados
- Mantém a mesma estrutura visual anterior
- Ideal para análise mais detalhada

### 3. Ordenação Inteligente
- **Critério principal**: Taxa de conversão (do melhor para o pior)
- Funis com melhor performance aparecem primeiro
- Facilita identificação rápida dos melhores e piores performers

### 4. Salvamento Automático de Preferência
- **LocalStorage**: Preferência salva automaticamente ao alternar visualização
- **Padrão**: Visão compacta (mais eficiente)
- **Persistência**: Mantém a escolha entre sessões
- **Feedback**: Toast notification ao salvar preferência

## Código de Cores (Taxa de Conversão)

| Taxa | Cor | Classificação |
|------|-----|---------------|
| ≥ 21% | 🟢 Verde | Excelente |
| 15-20% | 🟡 Amarelo | Bom |
| 10-14% | 🟠 Laranja | Regular |
| < 10% | 🔴 Vermelho | Baixo |

## Estrutura da Visão Compacta

```
┌─────────────────────────────────────────────────────────────────┐
│ Funil          │ Leads │ Calls │ Taxa  │ ████████░░░░░░░░░░░░ │
├─────────────────────────────────────────────────────────────────┤
│ Funil A        │  150  │   45  │ 30.0% │ ████████████████████ │ 🟢
│ Funil B        │  200  │   40  │ 20.0% │ ████████████░░░░░░░░ │ 🟡
│ Funil C        │  180  │   25  │ 13.9% │ ████████░░░░░░░░░░░░ │ 🟠
│ Funil D        │  120  │    8  │  6.7% │ ████░░░░░░░░░░░░░░░░ │ 🔴
└─────────────────────────────────────────────────────────────────┘
```

## Benefícios

### Para o Usuário
1. **Visualização rápida**: Todos os funis visíveis de uma vez
2. **Identificação imediata**: Cores destacam performance
3. **Comparação fácil**: Ordenação automática por performance
4. **Economia de espaço**: Mais informação em menos scroll
5. **Preferência salva**: Não precisa reconfigurar a cada acesso

### Para a Análise
1. **Foco em performance**: Melhores funis aparecem primeiro
2. **Decisões rápidas**: Identificação imediata de problemas
3. **Acompanhamento eficiente**: Visão geral em um único olhar
4. **Flexibilidade**: Pode alternar para visão detalhada quando necessário

## Uso

### Alternar Visualização
1. Clique no botão "Visão Compacta" ou "Visão Expandida" no canto superior direito do card
2. A preferência é salva automaticamente
3. Um toast confirma o salvamento

### Interpretar Cores
- **Verde**: Funil está performando muito bem (≥21%)
- **Amarelo**: Funil está performando bem (15-20%)
- **Laranja**: Funil precisa de atenção (10-14%)
- **Vermelho**: Funil precisa de ação urgente (<10%)

## Detalhes Técnicos

### LocalStorage
- **Chave**: `funnelConversionViewExpanded`
- **Valores**: `'true'` (expandida) ou `'false'` (compacta)
- **Padrão**: `false` (compacta)

### Ordenação
```typescript
.sort((a, b) => b.conversionRate - a.conversionRate)
```
Ordena do maior para o menor (melhor para pior)

### Responsividade
- **Desktop**: Grid de 12 colunas
- **Mobile**: Layout adaptativo mantém legibilidade
- **Hover**: Destaque visual ao passar o mouse

## Arquivos Modificados

- `controle-de-pacientes/src/pages/CommercialMetrics.tsx`

## Melhorias Futuras (Sugestões)

1. **Filtros adicionais**:
   - Filtrar por faixa de conversão
   - Buscar por nome de funil
   
2. **Exportação**:
   - Exportar dados em CSV
   - Gerar relatório PDF

3. **Alertas**:
   - Notificação quando funil cai abaixo de threshold
   - Sugestões de ação baseadas em performance

4. **Histórico**:
   - Comparar performance entre períodos
   - Gráfico de evolução por funil

## Exemplo de Uso

```typescript
// A preferência é carregada automaticamente ao abrir a página
const [isFunnelConversionExpanded, setIsFunnelConversionExpanded] = useState(() => {
  const saved = localStorage.getItem('funnelConversionViewExpanded');
  return saved === 'true' ? true : false;
});

// Ao alternar, salva automaticamente
const toggleFunnelView = () => {
  const newValue = !isFunnelConversionExpanded;
  setIsFunnelConversionExpanded(newValue);
  localStorage.setItem('funnelConversionViewExpanded', String(newValue));
  toast({
    title: newValue ? "Visão expandida ativada" : "Visão compacta ativada",
    description: "Sua preferência foi salva automaticamente",
  });
};
```

## Conclusão

A visão compacta oferece uma maneira eficiente de visualizar e comparar a performance de todos os funis de conversão, com ordenação automática por taxa de conversão e salvamento de preferência do usuário. A implementação mantém a flexibilidade de alternar para a visão expandida quando necessário, oferecendo o melhor dos dois mundos.
