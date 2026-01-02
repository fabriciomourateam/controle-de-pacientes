const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando servidor de desenvolvimento Vite...');

const viteProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

viteProcess.on('error', (error) => {
  console.error('❌ Erro ao iniciar Vite:', error);
  process.exit(1);
});

viteProcess.on('exit', (code) => {
  console.log(`⚠️ Vite encerrado com código ${code}`);
  process.exit(code || 0);
});

// Manter o processo vivo
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando servidor...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando servidor...');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});

