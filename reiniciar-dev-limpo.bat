@echo off
echo ========================================
echo REINICIANDO SERVIDOR DE DESENVOLVIMENTO
echo ========================================
echo.

echo [1/3] Parando processos Node na porta 5160...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5160 ^| findstr LISTENING') do (
    echo Matando processo %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo [2/3] Limpando cache do Vite...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Cache do Vite removido!
) else (
    echo Cache do Vite ja estava limpo.
)

echo.
echo [3/3] Iniciando servidor...
echo.
echo ========================================
echo Servidor iniciando em http://localhost:5160
echo Pressione Ctrl+C para parar
echo ========================================
echo.

npm run dev
