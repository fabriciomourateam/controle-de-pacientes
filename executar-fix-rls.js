// Script para executar correção de RLS do sistema de feedback
// Execute: node executar-fix-rls.js

const fs = require('fs');
const path = require('path');

console.log('🔧 Script para corrigir RLS do Sistema de Feedback');
console.log('');
console.log('📋 INSTRUÇÕES:');
console.log('1. Abra o Supabase Dashboard');
console.log('2. Vá para SQL Editor');
console.log('3. Cole e execute o SQL abaixo:');
console.log('');
console.log('=' .repeat(80));

// Ler o arquivo SQL
const sqlPath = path.join(__dirname, 'sql', 'fix-feedback-system-rls.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log(sqlContent);
console.log('=' .repeat(80));
console.log('');
console.log('✅ Após executar o SQL, o sistema de feedback funcionará corretamente!');
console.log('🔄 Recarregue a página para testar.');