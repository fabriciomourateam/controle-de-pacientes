@echo off
echo ========================================
echo   CONFIGURACAO SIMPLES DE SINCRONIZACAO
echo ========================================
echo.
echo Este script configura sincronizacao sem PM2
echo O proxy precisa estar rodando manualmente
echo.
pause

echo Removendo tarefas existentes...
schtasks /delete /tn "NotionSync-06h" /f 2>nul
schtasks /delete /tn "NotionSync-14h" /f 2>nul

echo.
echo Criando tarefa para 06:00...
schtasks /create /tn "NotionSync-06h" /tr "cmd /c \"cd /d C:\Users\fhbom\CONTROLE\ DE\ PACIENTES\controle-de-pacientes && node sync-notion-scheduled.js\"" /sc daily /st 06:00 /ru SYSTEM

echo.
echo Criando tarefa para 14:00...
schtasks /create /tn "NotionSync-14h" /tr "cmd /c \"cd /d C:\Users\fhbom\CONTROLE\ DE\ PACIENTES\controle-de-pacientes && node sync-notion-scheduled.js\"" /sc daily /st 14:00 /ru SYSTEM

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo IMPORTANTE: Para funcionar, voce precisa:
echo 1. Executar "iniciar-proxy.bat" antes das 06:00
echo 2. Manter o proxy rodando durante o dia
echo 3. Ou usar PM2 quando estiver estavel
echo.
echo Tarefas criadas:
echo - NotionSync-06h  (06:00 todos os dias)
echo - NotionSync-14h  (14:00 todos os dias)
echo.
pause
