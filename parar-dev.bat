@echo off
echo ========================================
echo Parando Servidor de Desenvolvimento
echo ========================================
echo.

REM Verificar se PM2 está instalado
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 não está instalado.
    pause
    exit /b 1
)

REM Parar servidor dev
echo Parando servidor de desenvolvimento...
pm2 stop vite-dev 2>nul
pm2 delete vite-dev 2>nul

echo.
echo ✅ Servidor parado com sucesso!
echo.
pause

