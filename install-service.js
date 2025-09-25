const { Service } = require('node-windows');
const path = require('path');

// Criar um novo objeto de serviço
const svc = new Service({
  name: 'Notion Proxy Service',
  description: 'Proxy server para API do Notion - Controle de Pacientes',
  script: path.join(__dirname, 'proxy-server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '3001'
    }
  ]
});

// Instalar o serviço
svc.on('install', function(){
  console.log('✅ Serviço instalado com sucesso!');
  console.log('🚀 Iniciando serviço...');
  svc.start();
});

svc.on('start', function(){
  console.log('✅ Serviço iniciado!');
  console.log('📊 Status: Rodando');
  console.log('🌐 URL: http://localhost:3001');
});

svc.on('error', function(err){
  console.error('❌ Erro no serviço:', err);
});

// Instalar o serviço
console.log('🔧 Instalando serviço Windows...');
svc.install();











