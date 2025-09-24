@echo off
echo ========================================
echo   INICIANDO PROXY NOTION
echo ========================================
echo.

cd /d "C:\Users\fhbom\CONTROLE DE PACIENTES\controle-de-pacientes"

echo Parando processos Node.js existentes...
taskkill /f /im node.exe 2>nul

echo.
echo Iniciando proxy na porta 3001...
echo Pressione Ctrl+C para parar
echo.

node proxy-server.js

echo.
echo Proxy encerrado.
pause
