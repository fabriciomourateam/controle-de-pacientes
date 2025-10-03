@echo off
echo ========================================
echo    SERVIDOR DE TESTE N8N WEBHOOK
echo ========================================
echo.

echo Verificando se Node.js esta instalado...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Instalando dependencias...
npm install express cors
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo Dependencias instaladas com sucesso!
echo.

echo Iniciando servidor de teste na porta 3000...
echo.
echo IMPORTANTE: Mantenha esta janela aberta!
echo O servidor deve estar rodando para o teste funcionar.
echo.
echo URLs disponiveis:
echo - Webhook: http://localhost:3000/api/n8n-webhook
echo - Teste: http://localhost:3000/health
echo - Debug: http://localhost:3000/debug-n8n-data.html
echo.

node servidor-teste.js

pause
