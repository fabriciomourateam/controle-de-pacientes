@echo off
echo Iniciando servidor de desenvolvimento com proxy...
echo.

echo Iniciando proxy na porta 3001...
start "Proxy Server" cmd /k "node proxy-server.js"

echo Aguardando proxy inicializar...
timeout /t 3 /nobreak > nul

echo Iniciando Vite na porta 5160...
npm run dev:vite-only

echo.
echo Desenvolvimento finalizado.
pause