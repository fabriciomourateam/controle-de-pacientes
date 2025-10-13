# Credenciais do Notion - Configuração

## Credenciais Configuradas

As credenciais do Notion foram configuradas como padrão no código para facilitar o uso em desenvolvimento e produção.

### Valores Configurados:

- **API Key**: `ntn_E50356294261kVEmTcoS17ZLs24AVhXystP6D6Th84L8Yb`
- **Database ID**: `631cf85b608d4c1693b772bfe0822f64`

## Onde estão configuradas:

1. **`src/components/auto-sync/AutoSyncManager.tsx`**
   - Componente de sincronização automática de pacientes

2. **`src/components/dashboard/DashboardAutoSyncManager.tsx`**
   - Componente de sincronização do dashboard

3. **`src/lib/config.ts`**
   - Configuração central do aplicativo
   - Suporta override via variáveis de ambiente

## Como funciona:

### Em Desenvolvimento:
- As credenciais são usadas automaticamente
- Campos já vêm preenchidos na interface
- Você pode alterá-las se necessário

### Em Produção:
- Mesmas credenciais são usadas
- Podem ser sobrescritas via variáveis de ambiente:
  - `VITE_NOTION_API_KEY`
  - `VITE_NOTION_DATABASE_ID`

## Alterando as credenciais:

Se precisar usar credenciais diferentes:

1. **Via Interface**: Altere diretamente nos campos do componente
2. **Via Código**: Edite as constantes nos arquivos mencionados acima
3. **Via Ambiente**: Crie/edite o arquivo `.env` com:
   ```
   VITE_NOTION_API_KEY=sua_nova_api_key
   VITE_NOTION_DATABASE_ID=seu_novo_database_id
   ```

## Observações:

- ✅ As credenciais são usadas tanto para sincronização de pacientes quanto para métricas do dashboard
- ✅ Não é necessário digitar as credenciais toda vez que usar a sincronização
- ✅ Os valores ficam salvos no localStorage quando você clica em "Salvar"
- ✅ Em caso de perda das configurações salvas, os valores padrão são restaurados automaticamente

