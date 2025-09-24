@echo off
echo ========================================
echo   INICIANDO PROXY NOTION ESTAVEL
echo ========================================
echo.

cd /d "C:\Users\fhbom\CONTROLE DE PACIENTES\controle-de-pacientes"

echo Parando processos existentes...
pm2 stop notion-proxy 2>nul
pm2 delete notion-proxy 2>nul

echo.
echo Iniciando proxy com configuracoes estaveis...
pm2 start proxy-server.js --name notion-proxy --watch false --max-memory-restart 500M --restart-delay 5000

echo.
echo Salvando configuracao...
pm2 save

echo.
echo ========================================
echo   PROXY INICIADO COM SUCESSO!
echo ========================================
echo.
echo Status:
pm2 status

echo.
echo Para ver logs: pm2 logs notion-proxy
echo Para parar: pm2 stop notion-proxy
echo.
pause
