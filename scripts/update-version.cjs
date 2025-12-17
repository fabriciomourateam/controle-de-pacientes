// Script para atualizar version.json antes do build
const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../public/version.json');

// Gerar versão baseada no timestamp
const version = Date.now().toString();
const buildTime = new Date().toISOString();

const versionData = {
  version,
  buildTime
};

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

console.log(`✅ Versão atualizada: ${version}`);
console.log(`📅 Build time: ${buildTime}`);
