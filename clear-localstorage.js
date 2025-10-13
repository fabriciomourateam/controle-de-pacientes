// Script para limpar localStorage antigo e forçar uso das credenciais padrão
// Execute este script no console do navegador (F12) em produção

console.log('🧹 Limpando configurações antigas do localStorage...');

// Limpar configurações antigas
localStorage.removeItem('dashboardAutoSyncConfig');
localStorage.removeItem('autoSyncConfig');

console.log('✅ localStorage limpo!');
console.log('🔄 Recarregue a página (F5) para ver as credenciais padrão preenchidas.');

