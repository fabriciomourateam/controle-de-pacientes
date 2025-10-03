const { Service } = require('node-windows');

// Criar um novo objeto de serviço
const svc = new Service({
  name: 'Notion Proxy Service'
});

// Desinstalar o serviço
svc.on('uninstall', function(){
  console.log('✅ Serviço desinstalado com sucesso!');
});

svc.on('error', function(err){
  console.error('❌ Erro ao desinstalar serviço:', err);
});

// Desinstalar o serviço
console.log('🗑️ Desinstalando serviço Windows...');
svc.uninstall();
















