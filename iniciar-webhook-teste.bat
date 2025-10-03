@echo off
echo ========================================
echo    WEBHOOK PUBLICO PARA TESTE N8N
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

echo Iniciando webhook publico na porta 3003...
echo.
echo IMPORTANTE: Mantenha esta janela aberta!
echo O webhook deve estar rodando para o N8N funcionar.
echo.
echo URL para usar no N8N: http://localhost:3003/api/n8n-webhook
echo Teste: http://localhost:3003/health
echo.

node webhook-publico-teste.js

pause
