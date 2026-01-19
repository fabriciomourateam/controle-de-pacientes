const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/checkins/CheckinFeedbackCard.tsx');

console.log('🔧 Corrigindo TODAS as linhas da tabela de evolução...\n');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Criar backup
const backupPath = filePath + '.backup-' + Date.now();
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup criado: ${backupPath}\n`);

// Padrão correto baseado na linha de Peso (5 colunas, sem edição inline)
const createSimplePattern = (comment, field, label, unit, colorLogic) => `                          {/* ${comment} */}
                          {evolutionData.${field}_anterior !== undefined && evolutionData.${field}_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">${label}</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {getCheckinMetricValue(historicCheckin, '${field}') || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], '${field}') || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {evolutionData.${field}_anterior || '-'}${unit}
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {evolutionData.${field}_atual || '-'}${unit}
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${${colorLogic}}\`}>
                                {evolutionData.${field}_diferenca !== 0
                                  ? \`\${evolutionData.${field}_diferenca > 0 ? '+' : ''}\${evolutionData.${field}_diferenca}${unit}\`
                                  : '0${unit}'}
                              </td>
                            </tr>
                          )}`;

// Padrão especial para Aproveitamento
const aproveitamentoPattern = `                          {/* Aproveitamento - não editável, calculado automaticamente */}
                          {evolutionData.aderencia_anterior !== undefined && evolutionData.aderencia_atual !== undefined && (
                            <tr className="border-b border-white/20">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">🎯 Aproveitamento</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {historicCheckin.percentual_aproveitamento ? \`\${historicCheckin.percentual_aproveitamento}%\` : '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {previousCheckins[previousCheckins.length - 2].percentual_aproveitamento ? \`\${previousCheckins[previousCheckins.length - 2].percentual_aproveitamento}%\` : '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {evolutionData.aderencia_anterior || 0}%
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {evolutionData.aderencia_atual || 0}%
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${evolutionData.aderencia_diferenca > 0 ? 'text-green-400' : evolutionData.aderencia_diferenca < 0 ? 'text-red-400' : 'text-slate-400'}\`}>
                                {evolutionData.aderencia_diferenca !== 0
                                  ? \`\${evolutionData.aderencia_diferenca > 0 ? '+' : ''}\${evolutionData.aderencia_diferenca}%\`
                                  : '0%'}
                              </td>
                            </tr>
                          )}`;

console.log('📝 Aplicando correções...\n');

// Contador
let corrections = 0;

// 1. Quadril (similar a Cintura - já corrigida)
const quadrilOld = /\{\/\* Quadril \*\/\}[\s\S]*?\) : null\}/;
const quadrilNew = createSimplePattern(
  'Quadril',
  'quadril',
  'Quadril',
  'cm',
  "evolutionData.quadril_diferenca < 0 ? 'text-green-400' : evolutionData.quadril_diferenca > 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(quadrilOld)) {
  content = content.replace(quadrilOld, quadrilNew);
  console.log('✅ Quadril corrigido');
  corrections++;
}

// 2. Aproveitamento
const aproveitamentoOld = /\{\/\* Aproveitamento.*?\*\/\}[\s\S]*?\)\}/;
if (content.match(aproveitamentoOld)) {
  content = content.replace(aproveitamentoOld, aproveitamentoPattern);
  console.log('✅ Aproveitamento corrigido');
  corrections++;
}

// 3. Treinos
const treinosOld = /\{\/\* Treinos \*\/\}[\s\S]*?\)\}/;
const treinosNew = createSimplePattern(
  'Treinos',
  'treino',
  '🏃 Treinos',
  '',
  "evolutionData.treino_diferenca > 0 ? 'text-green-400' : evolutionData.treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(treinosOld)) {
  content = content.replace(treinosOld, treinosNew);
  console.log('✅ Treinos corrigido');
  corrections++;
}

// 4. Cardio
const cardioOld = /\{\/\* Cardio \*\/\}[\s\S]*?\)\}/;
const cardioNew = createSimplePattern(
  'Cardio',
  'cardio',
  '🏃‍♂️ Cardio',
  '',
  "evolutionData.cardio_diferenca > 0 ? 'text-green-400' : evolutionData.cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(cardioOld)) {
  content = content.replace(cardioOld, cardioNew);
  console.log('✅ Cardio corrigido');
  corrections++;
}

// 5. Água
const aguaOld = /\{\/\* Água \*\/\}[\s\S]*?\)\}/;
const aguaNew = createSimplePattern(
  'Água',
  'agua',
  '💧 Água',
  '',
  "evolutionData.agua_diferenca > 0 ? 'text-green-400' : evolutionData.agua_diferenca < 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(aguaOld)) {
  content = content.replace(aguaOld, aguaNew);
  console.log('✅ Água corrigido');
  corrections++;
}

// 6. Sono
const sonoOld = /\{\/\* Sono \*\/\}[\s\S]*?\)\}/;
const sonoNew = createSimplePattern(
  'Sono',
  'sono',
  '😴 Sono',
  '',
  "evolutionData.sono_diferenca > 0 ? 'text-green-400' : evolutionData.sono_diferenca < 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(sonoOld)) {
  content = content.replace(sonoOld, sonoNew);
  console.log('✅ Sono corrigido');
  corrections++;
}

// 7. Refeições Livres
const refLivreOld = /\{\/\* Refeições Livres \*\/\}[\s\S]*?\)\}/;
const refLivreNew = createSimplePattern(
  'Refeições Livres',
  'ref_livre',
  '🍽️ Refeições Livres',
  '',
  "evolutionData.ref_livre_diferenca > 0 ? 'text-green-400' : evolutionData.ref_livre_diferenca < 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(refLivreOld)) {
  content = content.replace(refLivreOld, refLivreNew);
  console.log('✅ Refeições Livres corrigido');
  corrections++;
}

// 8. Beliscos
const beliscosOld = /\{\/\* Beliscos \*\/\}[\s\S]*?\)\}/;
const beliscosNew = createSimplePattern(
  'Beliscos',
  'beliscos',
  '🍪 Beliscos',
  '',
  "evolutionData.beliscos_diferenca < 0 ? 'text-green-400' : evolutionData.beliscos_diferenca > 0 ? 'text-red-400' : 'text-slate-400'"
);
if (content.match(beliscosOld)) {
  content = content.replace(beliscosOld, beliscosNew);
  console.log('✅ Beliscos corrigido');
  corrections++;
}

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✨ Concluído! ${corrections} linhas corrigidas.`);
console.log(`\n📋 Próximos passos:`);
console.log(`   1. Execute: npm run dev`);
console.log(`   2. Verifique se não há erros de sintaxe`);
console.log(`   3. Teste a tabela de evolução`);
console.log(`\n💾 Backup salvo em: ${backupPath}`);
console.log(`\n⚠️  NOTA: Tempo de Treino, Tempo de Cardio, Descanso e Fotos precisam de correção manual devido à complexidade.`);
