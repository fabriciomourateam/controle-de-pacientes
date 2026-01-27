// 🔍 TESTE RÁPIDO: Sistema de Comparação Antes/Depois
// Cole este código no console do navegador (F12) para diagnosticar

console.log('🔍 ===== DIAGNÓSTICO DO SISTEMA DE COMPARAÇÃO =====');
console.log('');

// 1. Verificar URL atual
console.log('1️⃣ URL ATUAL:');
console.log('   ', window.location.href);
const isPrivatePortal = window.location.href.includes('/portal/') && !window.location.href.includes('/public/');
const isPublicPortal = window.location.href.includes('/public/portal/');
console.log('   Portal Privado?', isPrivatePortal ? '✅ SIM' : '❌ NÃO');
console.log('   Portal Público?', isPublicPortal ? '✅ SIM' : '❌ NÃO');
console.log('');

// 2. Verificar se há paciente carregado
console.log('2️⃣ PACIENTE:');
const patientName = document.querySelector('h1')?.textContent;
console.log('   Nome:', patientName || '❌ Não encontrado');
console.log('');

// 3. Verificar se há fotos
console.log('3️⃣ FOTOS:');
const allImages = document.querySelectorAll('img');
const photoImages = Array.from(allImages).filter(img => 
  img.src.includes('drive.google.com') || 
  img.src.includes('supabase') ||
  img.alt?.toLowerCase().includes('foto')
);
console.log('   Total de imagens:', allImages.length);
console.log('   Fotos de check-in:', photoImages.length);
if (photoImages.length === 0) {
  console.log('   ⚠️ PROBLEMA: Nenhuma foto encontrada!');
}
console.log('');

// 4. Verificar se o dropdown existe
console.log('4️⃣ DROPDOWN (⋮):');
const dropdownTrigger = document.querySelector('[data-radix-dropdown-trigger]');
const dropdownButton = Array.from(document.querySelectorAll('button')).find(btn => {
  const svg = btn.querySelector('svg');
  return svg && btn.classList.contains('hide-in-pdf');
});
console.log('   Botão dropdown existe?', dropdownButton ? '✅ SIM' : '❌ NÃO');
console.log('');

// 5. Verificar se o botão "Criar Antes/Depois" existe
console.log('5️⃣ BOTÃO "CRIAR ANTES/DEPOIS":');
if (isPrivatePortal) {
  // Simular clique no dropdown para verificar o menu
  if (dropdownButton) {
    console.log('   Clicando no dropdown para verificar...');
    dropdownButton.click();
    
    setTimeout(() => {
      const createButton = Array.from(document.querySelectorAll('[role="menuitem"]')).find(item => 
        item.textContent?.includes('Criar Antes/Depois') || 
        item.textContent?.includes('Editar Antes/Depois')
      );
      
      console.log('   Botão "Criar Antes/Depois" existe?', createButton ? '✅ SIM' : '❌ NÃO');
      
      if (createButton) {
        console.log('   Texto do botão:', createButton.textContent?.trim());
        console.log('   ✅ TUDO CERTO! Clique no botão para criar a comparação.');
      } else {
        console.log('   ❌ PROBLEMA: Botão não encontrado!');
        console.log('   Possíveis causas:');
        console.log('   - Paciente não tem check-ins');
        console.log('   - Check-ins não têm fotos');
        console.log('   - Erro no código');
      }
      
      // Fechar dropdown
      dropdownButton.click();
    }, 500);
  } else {
    console.log('   ❌ Dropdown não encontrado!');
  }
} else {
  console.log('   ⚠️ Você está no portal público. Acesse o portal privado para criar comparações.');
}
console.log('');

// 6. Verificar se há comparação criada
console.log('6️⃣ COMPARAÇÃO EXISTENTE:');
const comparisonCard = document.querySelector('[class*="from-purple-900"]');
const comparisonTitle = document.querySelector('h3')?.textContent;
if (comparisonCard) {
  console.log('   ✅ Comparação encontrada!');
  console.log('   Título:', comparisonTitle);
} else {
  console.log('   ❌ Nenhuma comparação criada ainda.');
  console.log('   Isso é NORMAL se você ainda não criou uma.');
}
console.log('');

// 7. Resumo final
console.log('📊 ===== RESUMO =====');
console.log('');
if (isPrivatePortal && patientName && photoImages.length > 0 && dropdownButton) {
  console.log('✅ TUDO PRONTO PARA CRIAR A COMPARAÇÃO!');
  console.log('');
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. Clique no botão dropdown (⋮) no canto superior direito');
  console.log('2. Clique em "Criar Antes/Depois"');
  console.log('3. Selecione 2 fotos (ANTES e DEPOIS)');
  console.log('4. Preencha título e descrição');
  console.log('5. Clique em "Criar Comparação"');
} else {
  console.log('⚠️ PROBLEMAS ENCONTRADOS:');
  if (!isPrivatePortal) {
    console.log('❌ Você não está no portal privado');
    console.log('   Acesse: http://localhost:5160/portal/SEU_TOKEN');
  }
  if (!patientName) {
    console.log('❌ Paciente não carregado');
  }
  if (photoImages.length === 0) {
    console.log('❌ Nenhuma foto encontrada');
    console.log('   Verifique se os check-ins têm fotos cadastradas');
  }
  if (!dropdownButton) {
    console.log('❌ Dropdown não encontrado');
  }
}
console.log('');
console.log('🆘 Precisa de ajuda? Leia: PASSO_A_PASSO_CRIAR_COMPARACAO.md');
console.log('');
