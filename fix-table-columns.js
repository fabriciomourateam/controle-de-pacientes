const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/checkins/CheckinFeedbackCard.tsx');

console.log('🔧 Corrigindo estrutura de colunas da tabela de evolução...\n');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Criar backup
const backupPath = filePath + '.backup-' + Date.now();
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup criado: ${backupPath}\n`);

// Padrão correto para linhas SEM edição inline (apenas visualização)
// Baseado na linha de Peso que está correta
const createCorrectPattern = (metricName, metricField, displayLabel, unit = '', evolutionColor = 'default') => {
  const evolutionColorClass = evolutionColor === 'inverted' 
    ? `evolutionData.${metricField}_diferenca < 0 ? 'text-green-400' : evolutionData.${metricField}_diferenca > 0 ? 'text-red-400' : 'text-slate-400'`
    : `evolutionData.${metricField}_diferenca > 0 ? 'text-green-400' : evolutionData.${metricField}_diferenca < 0 ? 'text-red-400' : 'text-slate-400'`;
  
  return `                          {/* ${metricName} */}
                          {evolutionData.${metricField}_anterior !== undefined && evolutionData.${metricField}_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">${displayLabel}</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {getCheckinMetricValue(historicCheckin, '${metricField}') || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], '${metricField}') || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {evolutionData.${metricField}_anterior || '-'}${unit}
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {evolutionData.${metricField}_atual || '-'}${unit}
                                </span>
                              </td>
                              {/* Coluna de evolução */}
                              <td className={\`py-1.5 px-2 text-center font-medium sticky right-0 z-10 \${${evolutionColorClass}}\`}>
                                {evolutionData.${metricField}_diferenca !== 0
                                  ? \`\${evolutionData.${metricField}_diferenca > 0 ? '+' : ''}\${evolutionData.${metricField}_diferenca}${unit}\`
                                  : '0${unit}'}
                              </td>
                            </tr>
                          )}`;
};

// Padrão especial para Aproveitamento (não editável, calculado)
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

// Lista de métricas para corrigir (exceto Peso que já está correto e Aproveitamento que tem padrão especial)
const metrics = [
  { name: 'Cintura', field: 'cintura', label: 'Cintura', unit: 'cm', color: 'inverted' },
  { name: 'Quadril', field: 'quadril', label: 'Quadril', unit: 'cm', color: 'inverted' },
  { name: 'Treinos', field: 'treino', label: '🏃 Treinos', unit: '', color: 'default' },
  { name: 'Cardio', field: 'cardio', label: '🏃‍♂️ Cardio', unit: '', color: 'default' },
  { name: 'Água', field: 'agua', label: '💧 Água', unit: '', color: 'default' },
  { name: 'Sono', field: 'sono', label: '😴 Sono', unit: '', color: 'default' },
  { name: 'Refeições Livres', field: 'ref_livre', label: '🍽️ Refeições Livres', unit: '', color: 'default' },
  { name: 'Beliscos', field: 'beliscos', label: '🍪 Beliscos', unit: '', color: 'inverted' },
];

// Contador de correções
let corrections = 0;

// Aplicar correções para cada métrica
metrics.forEach(metric => {
  const searchPattern = new RegExp(
    `\\/\\* ${metric.name} \\*\\/[\\s\\S]*?<\\/tr>\\s*\\)\\}`,
    'g'
  );
  
  const replacement = createCorrectPattern(metric.name, metric.field, metric.label, metric.unit, metric.color);
  
  if (content.match(searchPattern)) {
    content = content.replace(searchPattern, replacement);
    console.log(`✅ ${metric.name} corrigido`);
    corrections++;
  } else {
    console.log(`⚠️  ${metric.name} - padrão não encontrado (pode já estar correto)`);
  }
});

// Corrigir Aproveitamento separadamente
const aproveitamentoSearch = /\/\* Aproveitamento.*?\*\/[\s\S]*?<\/tr>\s*\)\}/g;
if (content.match(aproveitamentoSearch)) {
  content = content.replace(aproveitamentoSearch, aproveitamentoPattern);
  console.log(`✅ Aproveitamento corrigido`);
  corrections++;
} else {
  console.log(`⚠️  Aproveitamento - padrão não encontrado`);
}

// Salvar arquivo corrigido
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✨ Concluído! ${corrections} linhas corrigidas.`);
console.log(`\n📋 Próximos passos:`);
console.log(`   1. Verifique o arquivo: ${filePath}`);
console.log(`   2. Execute: npm run dev`);
console.log(`   3. Teste a tabela de evolução`);
console.log(`\n💾 Backup salvo em: ${backupPath}`);
