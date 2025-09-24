@echo off
echo ========================================
echo   CONFIGURACAO DE SINCRONIZACAO NOTION
echo ========================================
echo.
echo Este script precisa ser executado como ADMINISTRADOR
echo.
pause

echo Criando tarefa para 06:00...
schtasks /create /tn "NotionSync-06h" /tr "%~dp0sync-notion-06h.bat" /sc daily /st 06:00 /ru SYSTEM

echo.
echo Criando tarefa para 14:00...
schtasks /create /tn "NotionSync-14h" /tr "%~dp0sync-notion-14h.bat" /sc daily /st 14:00 /ru SYSTEM

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Tarefas criadas:
echo - NotionSync-06h  (06:00 todos os dias)
echo - NotionSync-14h  (14:00 todos os dias)
echo.
echo Para gerenciar: Abra o Agendador de Tarefas do Windows
echo.
pause
