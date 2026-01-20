# Script para corrigir colunas de dados iniciais no CheckinFeedbackCard
$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Padrão a ser substituído
$oldPattern = @'
                              {/* Coluna antepenúltimo (se houver pelo menos 2 anteriores e não estiver mostrando todas) */}
                              {!showAllCheckinsColumns && previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
'@

# Novo padrão
$newPattern = @'
                              {/* Quando há exatamente 1 check-in anterior, mostrar coluna vazia (dados iniciais) */}
                              {!showAllCheckinsColumns && previousCheckins.length === 1 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-500 text-xs"></span>
                                </td>
                              )}
                              {/* Coluna do check-in anterior (quando há 2+ check-ins anteriores) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
'@

# Fazer a substituição
$newContent = $content -replace [regex]::Escape($oldPattern), $newPattern

# Salvar o arquivo
$newContent | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Arquivo corrigido com sucesso!"
Write-Host "Total de substituições feitas"
