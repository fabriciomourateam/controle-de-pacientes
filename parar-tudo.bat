@echo off
echo ========================================
echo   PARANDO SISTEMA COMPLETO
echo ========================================
echo.

echo Parando todos os processos Node.js...
taskkill /f /im node.exe 2>nul

echo.
echo Fechando janelas do sistema...
taskkill /f /fi "WINDOWTITLE eq Proxy Notion*" 2>nul
taskkill /f /fi "WINDOWTITLE eq Frontend Vite*" 2>nul

echo.
echo ========================================
echo   SISTEMA PARADO COM SUCESSO!
echo ========================================
echo.
pause
