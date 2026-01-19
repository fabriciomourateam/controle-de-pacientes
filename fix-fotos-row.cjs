const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/checkins/CheckinFeedbackCard.tsx');

console.log('🔧 Corrigindo linha de Fotos...\n');

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Criar backup
const backupPath = filePath + '.backup-fotos-' + Date.now();
fs.writeFileSync(backupPath, content, 'utf8');
console.log(`✅ Backup criado: ${backupPath}\n`);

// Padrão correto para a linha de Fotos (5 colunas)
const fotosPattern = `                          {/* Linha de botões de fotos */}
                          <tr className="border-b border-slate-700/30">
                            <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">📷 Fotos</td>
                            
                            {/* Colunas históricas de fotos (todos exceto os 2 últimos) */}
                            {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => {
                              const hasPhotos = !!(
                                historicCheckin.foto_1 || 
                                historicCheckin.foto_2 || 
                                historicCheckin.foto_3 || 
                                historicCheckin.foto_4
                              );
                              
                              return (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center bg-purple-500/5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const { data, error } = await supabase
                                          .from('checkin')
                                          .select('foto_1, foto_2, foto_3, foto_4')
                                          .eq('id', historicCheckin.id)
                                          .single();
                                        
                                        if (data && (data.foto_1 || data.foto_2 || data.foto_3 || data.foto_4)) {
                                          setShowPhotosViewer(true);
                                          toast.info(\`Fotos de \${new Date(historicCheckin.data_checkin).toLocaleDateString('pt-BR')}\`);
                                        } else {
                                          toast.info('Sem fotos neste check-in');
                                        }
                                      } catch (error) {
                                        console.error('Erro ao buscar fotos:', error);
                                        toast.error('Erro ao carregar fotos');
                                      }
                                    }}
                                    className={\`text-[10px] h-5 px-1.5 \${
                                      hasPhotos
                                        ? 'text-purple-400 font-semibold bg-purple-500/20 border border-purple-500/30 hover:text-purple-300 hover:bg-purple-500/30'
                                        : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700/30'
                                    }\`}
                                    title={hasPhotos ? \`Ver fotos de \${new Date(historicCheckin.data_checkin).toLocaleDateString('pt-BR')}\` : 'Sem fotos'}
                                  >
                                    <Camera className={\`w-2.5 h-2.5 \${hasPhotos ? 'text-purple-400' : ''}\`} />
                                  </Button>
                                </td>
                              );
                            })}
                            
                            {/* Coluna do penúltimo (se houver pelo menos 2) */}
                            {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const { data, error } = await supabase
                                        .from('checkin')
                                        .select('foto_1, foto_2, foto_3, foto_4')
                                        .eq('id', previousCheckins[previousCheckins.length - 2].id)
                                        .single();
                                      
                                      if (data && (data.foto_1 || data.foto_2 || data.foto_3 || data.foto_4)) {
                                        setShowPhotosViewer(true);
                                        toast.info(\`Fotos de \${new Date(previousCheckins[previousCheckins.length - 2].data_checkin).toLocaleDateString('pt-BR')}\`);
                                      } else {
                                        toast.info('Sem fotos neste check-in');
                                      }
                                    } catch (error) {
                                      console.error('Erro ao buscar fotos:', error);
                                      toast.error('Erro ao carregar fotos');
                                    }
                                  }}
                                  className={\`text-xs h-6 px-2 \${
                                    previousCheckins[previousCheckins.length - 2].foto_1 || previousCheckins[previousCheckins.length - 2].foto_2 || previousCheckins[previousCheckins.length - 2].foto_3 || previousCheckins[previousCheckins.length - 2].foto_4
                                      ? 'text-purple-400 font-semibold bg-purple-500/20 border border-purple-500/30 hover:text-purple-300 hover:bg-purple-500/30'
                                      : 'text-slate-500 hover:text-slate-400 hover:bg-slate-700/30'
                                  }\`}
                                  title="Ver fotos do penúltimo check-in"
                                >
                                  <Camera className="w-3 h-3 mr-1" />
                                  {previousCheckins[previousCheckins.length - 2].foto_1 || previousCheckins[previousCheckins.length - 2].foto_2 || previousCheckins[previousCheckins.length - 2].foto_3 || previousCheckins[previousCheckins.length - 2].foto_4 ? 'Ver' : '-'}
                                </Button>
                              </td>
                            )}
                            
                            {/* Coluna do último (sempre visível se houver pelo menos 1) */}
                            {previousCheckins.length > 0 && (
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPhotoViewerSource('previous');
                                    setShowPhotosViewer(true);
                                  }}
                                  className={\`text-xs h-6 px-2 \${
                                    hasPreviousPhotos 
                                      ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30' 
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                  }\`}
                                  title={hasPreviousPhotos ? "Ver fotos do check-in anterior (há fotos)" : "Ver fotos do check-in anterior"}
                                >
                                  <Camera className={\`w-3 h-3 mr-1 \${hasPreviousPhotos ? 'text-slate-200' : ''}\`} />
                                  {evolutionData.checkin_anterior_data 
                                    ? new Date(evolutionData.checkin_anterior_data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                                    : 'Anterior'}
                                </Button>
                              </td>
                            )}
                            
                            {/* Coluna do check-in atual (sempre visível) */}
                            <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPhotoViewerSource('current');
                                  setShowPhotosViewer(true);
                                }}
                                className={\`text-xs h-6 px-2 \${
                                  hasCurrentPhotos 
                                    ? 'text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30' 
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }\`}
                                title={hasCurrentPhotos ? "Ver fotos do check-in atual (há fotos)" : "Ver fotos do check-in atual"}
                              >
                                <Camera className={\`w-3 h-3 mr-1 \${hasCurrentPhotos ? 'text-slate-200' : ''}\`} />
                                {new Date(checkin.data_checkin || checkin.data_preenchimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                              </Button>
                            </td>
                            
                            {/* Coluna de Fotos Iniciais (sticky right) */}
                            <td className="py-1.5 px-2 text-center sticky right-0 z-10">
                              {hasInitialPhotos ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPhotoViewerSource('initial');
                                    setShowPhotosViewer(true);
                                  }}
                                  className="text-xs h-6 px-2 text-slate-200 font-semibold bg-blue-500/20 border border-blue-500/30 hover:text-blue-300 hover:bg-blue-500/30"
                                  title="Ver fotos iniciais (há fotos)"
                                >
                                  <Camera className="w-3 h-3 mr-1 text-slate-200" />
                                  Iniciais
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPhotoViewerSource('initial');
                                    setShowPhotosViewer(true);
                                  }}
                                  className="text-xs h-6 px-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                                  title="Adicionar fotos iniciais"
                                >
                                  <Camera className="w-3 h-3 mr-1" />
                                  Iniciais
                                </Button>
                              )}
                            </td>
                          </tr>`;

console.log('📝 Aplicando correção...\n');

// Corrigir linha de Fotos
const fotosOld = /\{\/\* Linha de botões de fotos \*\/\}[\s\S]*?<\/tr>/;
if (content.match(fotosOld)) {
  content = content.replace(fotosOld, fotosPattern);
  console.log('✅ Linha de Fotos corrigida');
  
  // Salvar arquivo
  fs.writeFileSync(filePath, content, 'utf8');
  
  console.log(`\n✨ Concluído! Linha de Fotos corrigida com sucesso.`);
  console.log(`\n📋 Próximos passos:`);
  console.log(`   1. Execute: npm run dev`);
  console.log(`   2. Verifique se não há erros de sintaxe`);
  console.log(`   3. Teste a tabela de evolução`);
  console.log(`\n💾 Backup salvo em: ${backupPath}`);
  console.log(`\n✅ TODAS as linhas da tabela foram corrigidas!`);
} else {
  console.log('⚠️  Padrão da linha de Fotos não encontrado');
}
