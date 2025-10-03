@echo off
echo ========================================
echo    INICIANDO PROXY N8N PARA CORS
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

echo Instalando dependencias do proxy...
npm install express http-proxy-middleware cors node-fetch
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo Dependencias instaladas com sucesso!
echo.

echo Iniciando proxy N8N na porta 3002...
echo.
echo IMPORTANTE: Mantenha esta janela aberta!
echo O proxy deve estar rodando para o site funcionar.
echo.
echo Para parar o proxy, feche esta janela ou pressione Ctrl+C
echo.

node proxy-n8n.js

pause
