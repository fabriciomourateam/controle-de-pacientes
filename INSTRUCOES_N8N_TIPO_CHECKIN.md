# Instruções N8N - Campo tipo_checkin

## ✅ Configuração Atualizada: N8N Envia o Campo Diretamente

O fluxo do N8N já foi configurado para enviar `tipo_checkin: 'completo'` nos dados. O webhook apenas recebe e salva o valor.

## O Que Foi Feito

### Configuração no N8N

No seu fluxo do N8N, ao enviar dados para o Supabase, você já está incluindo:

```json
{
  "telefone": "...",
  "peso": "...",
  "medida": "...",
  "tipo_checkin": "completo",  // ← Campo enviado pelo N8N
  // ... outros campos
}
```

### Webhook Atualizado: `src/pages/api/n8n-webhook.ts`

O webhook agora apenas passa os dados adiante, sem modificar o `tipo_checkin`:

```typescript
// Para arrays de check-ins
const processedDataWithUserId = processedData.map((item: any) => ({
  ...item,
  user_id: defaultUserId
  // tipo_checkin já vem do N8N, não precisa adicionar
}));

// Para check-in único
const mappedDataWithUserId = {
  ...mappedData,
  user_id: defaultUserId
  // tipo_checkin já vem do N8N, não precisa adicionar
};
```

## Como Funciona

1. **N8N envia dados** para o webhook com `tipo_checkin: 'completo'`
2. **Webhook recebe** os dados
3. **Webhook adiciona apenas:**
   - `user_id` (do usuário padrão)
4. **Dados são salvos** no Supabase com o tipo que veio do N8N

## Resultado

- ✅ Check-ins do N8N aparecem na página de Check-ins (porque vêm com `tipo_checkin: 'completo'`)
- ✅ Check-ins do N8N aparecem na Timeline de Evolução
- ✅ Check-ins do N8N aparecem no Card de Feedback
- ✅ N8N controla o tipo do check-in diretamente

## Diferença com Registros de Evolução

| Origem | tipo_checkin | Aparece em Check-ins? |
|--------|--------------|----------------------|
| N8N (formulário completo) | `'completo'` | ✅ Sim |
| Botão "+" nos gráficos | `'evolucao'` | ❌ Não |
| Botão "Adicionar Dados" (Timeline) | `'evolucao'` | ❌ Não |

## Migração de Dados Existentes

Todos os check-ins existentes (incluindo os do N8N) foram automaticamente marcados como `tipo_checkin: 'completo'` através do SQL:

```sql
UPDATE checkin 
SET tipo_checkin = 'completo' 
WHERE tipo_checkin IS NULL;
```

## Próximos Passos

1. ✅ Executar SQL no Supabase (`sql/add-tipo-checkin-field.sql`)
2. ✅ Deploy do código atualizado
3. ✅ Testar envio de check-in pelo N8N
4. ✅ Verificar que aparece na página de Check-ins

## Teste Rápido

Após executar o SQL e fazer deploy:

1. Envie um check-in pelo N8N (como sempre fez)
2. Acesse a página de Check-ins
3. Verifique que o check-in aparece normalmente
4. Acesse a página de Evolução do Paciente
5. Clique no botão "+" em um gráfico
6. Adicione dados de evolução
7. Verifique que:
   - ✅ Dados aparecem na Timeline
   - ✅ Dados aparecem no Card de Feedback
   - ❌ Dados **NÃO** aparecem na página de Check-ins

## Suporte

Se algo não funcionar como esperado:

1. Verifique se o SQL foi executado no Supabase
2. Verifique se o deploy foi feito com sucesso
3. Verifique os logs do webhook no Vercel/console
4. Verifique se o campo `tipo_checkin` existe na tabela `checkin`

## Status

✅ **IMPLEMENTADO E PRONTO**

Nenhuma ação necessária no N8N. O webhook cuida de tudo automaticamente!
