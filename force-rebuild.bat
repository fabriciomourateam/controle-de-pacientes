@echo off
echo ========================================
echo Forcando recompilacao do projeto
echo ========================================
echo.

echo [1/4] Parando servidor (se estiver rodando)...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [2/4] Limpando cache do Vite...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

echo.
echo [3/4] Limpando cache do navegador...
echo IMPORTANTE: Apos iniciar o servidor, pressione Ctrl+Shift+R no navegador!
echo.

echo [4/4] Iniciando servidor de desenvolvimento...
echo.
npm run dev

pause
