@echo off
echo ========================================
echo LIMPEZA COMPLETA DE CACHE - HARD RESET
echo ========================================
echo.

echo [1/6] Parando servidor Vite...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo [2/6] Limpando cache do Vite...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite rmdir /s /q .vite

echo [3/6] Limpando dist...
if exist dist rmdir /s /q dist

echo [4/6] Limpando cache do npm...
call npm cache clean --force

echo [5/6] Reinstalando dependências...
call npm install

echo [6/6] Iniciando servidor na porta 5160...
echo.
echo ========================================
echo IMPORTANTE: Após o servidor iniciar:
echo 1. Abra o navegador em MODO ANONIMO
echo 2. Acesse: http://localhost:5160
echo 3. Teste o modal de comparação
echo ========================================
echo.

npm run dev -- --port 5160 --force

pause
