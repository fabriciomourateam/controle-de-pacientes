#!/bin/bash

echo "🚀 Iniciando deploy do Notion Proxy..."

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado. Instalando..."
    npm install -g pm2
fi

# Parar serviço atual se estiver rodando
echo "⏹️ Parando serviço atual..."
pm2 stop notion-proxy 2>/dev/null || true

# Atualizar código se estiver em repositório git
if [ -d ".git" ]; then
    echo "📥 Atualizando código..."
    git pull origin main
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar diretório de logs
mkdir -p logs

# Iniciar serviço
echo "▶️ Iniciando serviço..."
pm2 start ecosystem.config.js

# Salvar configuração do PM2
echo "💾 Salvando configuração..."
pm2 save

echo "✅ Deploy concluído!"
echo "📊 Status:"
pm2 status



















