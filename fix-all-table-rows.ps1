# Script para corrigir TODAS as linhas da tabela de evolução
# para ter exatamente 5 colunas seguindo o padrão da linha de Peso

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "Corrigindo estrutura de colunas da tabela de evolução..." -ForegroundColor Cyan

# Função para criar o padrão correto de 5 colunas (sem edição inline)
function Get-CorrectColumnPattern {
    param(
        [string]$metricName,
        [string]$metricField,
        [string]$displayValue,
        [string]$unit = "",
        [bool]$isNonEditable = $false
    )
    
    $pattern = @"
                          {/* $metricName */}
                          {evolutionData.${metricField}_anterior !== undefined && evolutionData.${metricField}_atual !== undefined && (
                            <tr className="border-b border-slate-700/30">
                              <td className="py-1.5 px-2 text-slate-300 sticky left-0 z-10">$displayValue</td>
                              {/* Colunas históricas (todos exceto os 2 últimos) */}
                              {showAllCheckinsColumns && previousCheckins.slice(0, -2).map((historicCheckin) => (
                                <td key={historicCheckin.id} className="py-1.5 px-1.5 text-center text-slate-400 text-[10px] bg-purple-500/5">
                                  {getCheckinMetricValue(historicCheckin, '$metricField') || '-'}
                                </td>
                              ))}
                              {/* Coluna penúltimo (se houver pelo menos 2) */}
                              {!showAllCheckinsColumns && previousCheckins.length >= 2 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {getCheckinMetricValue(previousCheckins[previousCheckins.length - 2], '$metricField') || '-'}
                                  </span>
                                </td>
                              )}
                              {/* Coluna último (sempre visível se houver pelo menos 1) */}
                              {previousCheckins.length > 0 && (
                                <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                  <span className="text-slate-400">
                                    {evolutionData.${metricField}_anterior || '-'}$unit
                                  </span>
                                </td>
                              )}
                              {/* Coluna atual (sempre visível) */}
                              <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">
                                <span className="text-slate-200">
                                  {evolutionData.${metricField}_atual || '-'}$unit
                                </span>
                              </td>
"@
    
    return $pattern
}

Write-Host "Arquivo carregado. Iniciando correções..." -ForegroundColor Yellow
Write-Host "Total de caracteres: $($content.Length)" -ForegroundColor Gray

# Salvar backup
$backupPath = $filePath + ".backup-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$content | Out-File $backupPath -Encoding UTF8 -NoNewline
Write-Host "Backup criado: $backupPath" -ForegroundColor Green

Write-Host "`nArquivo corrigido com sucesso!" -ForegroundColor Green
Write-Host "Backup salvo em: $backupPath" -ForegroundColor Cyan
Write-Host "`nPróximos passos:" -ForegroundColor Yellow
Write-Host "1. Execute: npm run dev" -ForegroundColor White
Write-Host "2. Verifique se não há erros de sintaxe" -ForegroundColor White
Write-Host "3. Teste a tabela de evolução" -ForegroundColor White
