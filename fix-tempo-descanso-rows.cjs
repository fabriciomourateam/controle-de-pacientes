const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/checkins/CheckinFeedbackCard.tsx');

console.log('🔧 Corrigindo linhas de Tempo de Treino, Tempo de Cardio e Descanso...\n');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Criar backup
const backupPath = filePath + '.backup-tempo-' + Date.now();
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup criado: ${backupPath}\n`);

let corrections = 0;

// Padrão para Tempo de Treino (texto, sem unidade)
const tempoTreinoPattern = `                          {/* Tempo de Treino */}
                          {evolutionData && ((evolutionData as any).tempo_treino_atual_text || evolutionData.tempo_treino_atual !== undefined) && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">⏱️ Tempo de Treino</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {historicCheckin.tempo || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {previousCheckins[previousCheckins.length - 2].tempo || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {(evolutionData as any).tempo_treino_anterior_text || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {(evolutionData as any).tempo_treino_atual_text || '-'}
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${
                                evolutionData.tempo_treino_diferenca !== null && evolutionData.tempo_treino_diferenca !== undefined
                                  ? (evolutionData.tempo_treino_diferenca > 0 ? 'text-green-400' : evolutionData.tempo_treino_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                  : 'text-slate-400'
                              }\`}>
                                {evolutionData.tempo_treino_diferenca !== null && evolutionData.tempo_treino_diferenca !== undefined
                                  ? (evolutionData.tempo_treino_diferenca !== 0
                                      ? \`\${evolutionData.tempo_treino_diferenca > 0 ? '+' : ''}\${evolutionData.tempo_treino_diferenca}\`
                                      : '0')
                                  : '-'}
                              </td>
                            </tr>
                          )}`;

// Padrão para Tempo de Cardio (texto, sem unidade)
const tempoCardioPattern = `                          {/* Tempo de Cardio */}
                          {evolutionData && ((evolutionData as any).tempo_cardio_atual_text || evolutionData.tempo_cardio_atual !== undefined) && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">🏃 Tempo de Cardio</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {historicCheckin.tempo_cardio || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {previousCheckins[previousCheckins.length - 2].tempo_cardio || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {(evolutionData as any).tempo_cardio_anterior_text || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {(evolutionData as any).tempo_cardio_atual_text || '-'}
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${
                                evolutionData.tempo_cardio_diferenca !== null && evolutionData.tempo_cardio_diferenca !== undefined
                                  ? (evolutionData.tempo_cardio_diferenca > 0 ? 'text-green-400' : evolutionData.tempo_cardio_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                  : 'text-slate-400'
                              }\`}>
                                {evolutionData.tempo_cardio_diferenca !== null && evolutionData.tempo_cardio_diferenca !== undefined
                                  ? (evolutionData.tempo_cardio_diferenca !== 0
                                      ? \`\${evolutionData.tempo_cardio_diferenca > 0 ? '+' : ''}\${evolutionData.tempo_cardio_diferenca}\`
                                      : '0')
                                  : '-'}
                              </td>
                            </tr>
                          )}`;

// Padrão para Descanso entre as séries (texto, sem unidade)
const descansoPattern = `                          {/* Descanso entre Séries */}
                          {evolutionData && ((evolutionData as any).descanso_atual_text || evolutionData.descanso_atual !== undefined) && (
                            <tr className="border-b border-white/20">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">⏸️ Descanso entre as séries</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {getCheckinMetricValue(historicCheckin, 'descanso') || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], 'descanso') || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {(evolutionData as any).descanso_anterior_text || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {(evolutionData as any).descanso_atual_text || '-'}
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${
                                evolutionData.descanso_diferenca !== null && evolutionData.descanso_diferenca !== undefined
                                  ? (evolutionData.descanso_diferenca > 0 ? 'text-green-400' : evolutionData.descanso_diferenca < 0 ? 'text-red-400' : 'text-slate-400')
                                  : 'text-slate-400'
                              }\`}>
                                {evolutionData.descanso_diferenca !== null && evolutionData.descanso_diferenca !== undefined
                                  ? (evolutionData.descanso_diferenca !== 0
                                      ? \`\${evolutionData.descanso_diferenca > 0 ? '+' : ''}\${evolutionData.descanso_diferenca}\`
                                      : '0')
                                  : '-'}
                              </td>
                            </tr>
                          )}`;

console.log('📝 Aplicando correções...\n');

// 1. Tempo de Treino
const tempoTreinoOld = /\{\/\* Tempo de Treino \*\/\}[\s\S]*?\)\}/;
if (content.match(tempoTreinoOld)) {
  content = content.replace(tempoTreinoOld, tempoTreinoPattern);
  console.log('✅ Tempo de Treino corrigido');
  corrections++;
}

// 2. Tempo de Cardio
const tempoCardioOld = /\{\/\* Tempo de Cardio \*\/\}[\s\S]*?\)\}/;
if (content.match(tempoCardioOld)) {
  content = content.replace(tempoCardioOld, tempoCardioPattern);
  console.log('✅ Tempo de Cardio corrigido');
  corrections++;
}

// 3. Descanso entre Séries
const descansoOld = /\{\/\* Descanso entre Séries \*\/\}[\s\S]*?\)\}/;
if (content.match(descansoOld)) {
  content = content.replace(descansoOld, descansoPattern);
  console.log('✅ Descanso entre as séries corrigido');
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
console.log(`\n⚠️  NOTA: A linha de Fotos ainda precisa de correção manual.`);
