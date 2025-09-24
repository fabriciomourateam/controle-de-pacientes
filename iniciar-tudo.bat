@echo off
echo ========================================
echo   INICIANDO SISTEMA COMPLETO
echo ========================================
echo.

cd /d "C:\Users\fhbom\CONTROLE DE PACIENTES\controle-de-pacientes"

echo Parando processos Node.js existentes...
taskkill /f /im node.exe 2>nul

echo.
echo Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando proxy na porta 3001...
start "Proxy Notion" cmd /k "node proxy-server.js"

echo.
echo Aguardando proxy inicializar...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando frontend na porta 5173...
start "Frontend Vite" cmd /k "npm run dev"

echo.
echo ========================================
echo   SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Servicos rodando:
echo - Frontend: http://localhost:5173/
echo - Proxy: http://localhost:3001/
echo.
echo Janelas abertas:
echo - "Proxy Notion" - Proxy do Notion
echo - "Frontend Vite" - Servidor de desenvolvimento
echo.
echo Para parar: Feche as janelas ou use Ctrl+C
echo.
pause
