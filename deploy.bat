@echo off
echo 🚀 Iniciando deploy do Notion Proxy...

REM Verificar se PM2 está instalado
pm2 --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PM2 não está instalado. Instalando...
    npm install -g pm2
)

REM Parar serviço atual se estiver rodando
echo ⏹️ Parando serviço atual...
pm2 stop notion-proxy 2>nul

REM Atualizar código se estiver em repositório git
if exist ".git" (
    echo 📥 Atualizando código...
    git pull origin main
)

REM Instalar dependências
echo 📦 Instalando dependências...
npm install

REM Criar diretório de logs
if not exist "logs" mkdir logs

REM Iniciar serviço
echo ▶️ Iniciando serviço...
pm2 start ecosystem.config.js

REM Salvar configuração do PM2
echo 💾 Salvando configuração...
pm2 save

echo ✅ Deploy concluído!
echo 📊 Status:
pm2 status

pause












