@echo off
echo ========================================
echo Iniciando Servidor de Desenvolvimento
echo ========================================
echo.

REM Verificar se PM2 está instalado
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PM2 não está instalado. Instalando...
    npm install -g pm2
    if errorlevel 1 (
        echo ❌ Erro ao instalar PM2
        pause
        exit /b 1
    )
)

REM Parar servidor dev se já estiver rodando
echo Parando servidor dev anterior (se existir)...
pm2 stop vite-dev 2>nul
pm2 delete vite-dev 2>nul

REM Iniciar servidor dev com PM2
echo Iniciando servidor de desenvolvimento na porta 5160...
pm2 start start-dev.cjs --name vite-dev

REM Salvar configuração do PM2
pm2 save

echo.
echo ========================================
echo ✅ Servidor iniciado com sucesso!
echo ========================================
echo.
echo Servidor rodando em: http://localhost:5160
echo.
echo O servidor está rodando em BACKGROUND e continuará
echo rodando mesmo se você fechar esta janela!
echo.
echo Comandos úteis:
echo   - Ver status: pm2 status
echo   - Ver logs: pm2 logs vite-dev
echo   - Parar: pm2 stop vite-dev
echo   - Reiniciar: pm2 restart vite-dev
echo   - Parar completamente: parar-dev.bat
echo.
echo Status atual:
pm2 status
echo.
pause

