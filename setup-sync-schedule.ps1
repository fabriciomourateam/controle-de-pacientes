# Script para configurar agendamento automático da sincronização do Notion
# Execute como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO DE SINCRONIZACAO NOTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

$projectPath = "C:\Users\fhbom\CONTROLE DE PACIENTES\controle-de-pacientes"
$batFile06h = "$projectPath\sync-notion-06h.bat"
$batFile14h = "$projectPath\sync-notion-14h.bat"

Write-Host "📁 Caminho do projeto: $projectPath" -ForegroundColor Green
Write-Host ""

# Verificar se os arquivos existem
if (-not (Test-Path $batFile06h)) {
    Write-Host "❌ Arquivo não encontrado: $batFile06h" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $batFile14h)) {
    Write-Host "❌ Arquivo não encontrado: $batFile14h" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Arquivos de sincronização encontrados!" -ForegroundColor Green
Write-Host ""

# Remover tarefas existentes se houver
Write-Host "🗑️ Removendo tarefas existentes..." -ForegroundColor Yellow
try {
    Unregister-ScheduledTask -TaskName "NotionSync-06h" -Confirm:$false -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName "NotionSync-14h" -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "✅ Tarefas antigas removidas" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Nenhuma tarefa antiga encontrada" -ForegroundColor Blue
}

# Criar ação para 06h
$action06h = New-ScheduledTaskAction -Execute $batFile06h -WorkingDirectory $projectPath

# Criar trigger para 06h (todos os dias às 06:00)
$trigger06h = New-ScheduledTaskTrigger -Daily -At "06:00"

# Criar configurações
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Criar tarefa para 06h
Write-Host "⏰ Criando tarefa para 06:00..." -ForegroundColor Yellow
Register-ScheduledTask -TaskName "NotionSync-06h" -Action $action06h -Trigger $trigger06h -Settings $settings -Description "Sincronização automática do Notion às 06:00" -User "SYSTEM"

# Criar ação para 14h
$action14h = New-ScheduledTaskAction -Execute $batFile14h -WorkingDirectory $projectPath

# Criar trigger para 14h (todos os dias às 14:00)
$trigger14h = New-ScheduledTaskTrigger -Daily -At "14:00"

# Criar tarefa para 14h
Write-Host "⏰ Criando tarefa para 14:00..." -ForegroundColor Yellow
Register-ScheduledTask -TaskName "NotionSync-14h" -Action $action14h -Trigger $trigger14h -Settings $settings -Description "Sincronização automática do Notion às 14:00" -User "SYSTEM"

Write-Host ""
Write-Host "✅ CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Tarefas criadas:" -ForegroundColor Cyan
Write-Host "   • NotionSync-06h  - Executa às 06:00 todos os dias" -ForegroundColor White
Write-Host "   • NotionSync-14h  - Executa às 14:00 todos os dias" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para gerenciar as tarefas:" -ForegroundColor Cyan
Write-Host "   1. Abra o 'Agendador de Tarefas' do Windows" -ForegroundColor White
Write-Host "   2. Procure por 'NotionSync-06h' e 'NotionSync-14h'" -ForegroundColor White
Write-Host "   3. Voce pode executar manualmente, editar ou desabilitar" -ForegroundColor White
Write-Host ""
Write-Host "Logs serao salvos no Supabase na tabela sync_logs" -ForegroundColor Cyan
Write-Host ""

Read-Host "Pressione Enter para sair"
