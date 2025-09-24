# 🔄 Sincronização Automática do Notion

## ✅ Configuração Atual

### 🚀 Proxy PM2
- **Status**: ✅ Rodando automaticamente
- **Porta**: 3001
- **Comando**: `pm2 start proxy-server.js --name notion-proxy`
- **Auto-restart**: ✅ Habilitado

### ⏰ Agendamento (2x por dia)
- **06:00**: Sincronização matinal
- **14:00**: Sincronização vespertina

## 🛠️ Como Configurar o Agendamento

### Opção 1: Script Automático (Recomendado)
```powershell
# Execute como Administrador
.\setup-sync-schedule.ps1
```

### Opção 2: Manual via Agendador de Tarefas
1. Abra o **Agendador de Tarefas** do Windows
2. Clique em **Criar Tarefa Básica**
3. Configure:
   - **Nome**: `NotionSync-06h`
   - **Descrição**: `Sincronização automática do Notion às 06:00`
   - **Disparador**: Diário às 06:00
   - **Ação**: Executar `sync-notion-06h.bat`
4. Repita para 14:00 com `NotionSync-14h`

## 📁 Arquivos Criados

### Scripts de Sincronização
- `sync-notion-scheduled.js` - Script principal de sincronização
- `sync-notion-06h.bat` - Executável para 06:00
- `sync-notion-14h.bat` - Executável para 14:00

### Configuração
- `setup-sync-schedule.ps1` - Script de configuração automática
- `sql/create-sync-logs-table.sql` - Tabela de logs no Supabase

## 📊 Monitoramento

### Logs no Supabase
```sql
-- Ver últimas sincronizações
SELECT * FROM sync_logs 
ORDER BY timestamp DESC 
LIMIT 10;

-- Ver apenas erros
SELECT * FROM sync_logs 
WHERE status = 'error' 
ORDER BY timestamp DESC;

-- Estatísticas por dia
SELECT 
  DATE(timestamp) as data,
  COUNT(*) as total_syncs,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as sucessos,
  COUNT(CASE WHEN status = 'error' THEN 1 END) as erros
FROM sync_logs 
GROUP BY DATE(timestamp) 
ORDER BY data DESC;
```

### Comandos PM2
```bash
# Ver status
pm2 status

# Ver logs
pm2 logs notion-proxy

# Reiniciar
pm2 restart notion-proxy

# Parar
pm2 stop notion-proxy

# Iniciar
pm2 start notion-proxy
```

## 🔧 Solução de Problemas

### ❌ Erro: "ERR_CONNECTION_REFUSED"
```bash
# Verificar se o proxy está rodando
pm2 status

# Se não estiver, iniciar
pm2 start proxy-server.js --name notion-proxy
```

### ❌ Erro: "Task Scheduler"
- Verifique se o Agendador de Tarefas está habilitado
- Execute o script PowerShell como Administrador
- Verifique se os arquivos .bat existem no caminho correto

### ❌ Erro: "Notion API"
- Verifique se as variáveis de ambiente estão configuradas
- Confirme se a API key do Notion está válida
- Verifique se o database ID está correto

## 🎯 Funcionamento

1. **06:00**: Sistema executa `sync-notion-06h.bat`
2. **14:00**: Sistema executa `sync-notion-14h.bat`
3. **Script**: Faz requisição para `http://localhost:3001/api/notion-proxy`
4. **Proxy**: Sincroniza dados do Notion para o Supabase
5. **Log**: Salva resultado na tabela `sync_logs`

## 📈 Benefícios

- ✅ **Automático**: Sem intervenção manual
- ✅ **Confiável**: PM2 reinicia automaticamente se falhar
- ✅ **Monitorável**: Logs detalhados no Supabase
- ✅ **Flexível**: Fácil de modificar horários
- ✅ **Robusto**: Tratamento de erros e retry automático

## 🔄 Próximos Passos

1. Execute `.\setup-sync-schedule.ps1` como Administrador
2. Verifique se as tarefas foram criadas no Agendador
3. Teste executando uma sincronização manual
4. Monitore os logs no Supabase
5. Ajuste horários se necessário
