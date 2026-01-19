# Script para corrigir alinhamento das colunas na tabela

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Substituir todas as ocorrências de "Coluna atual" sem condição por "Coluna atual (sempre visível)" com condição
$pattern = '(\s+)\{/\* Coluna atual \*/\}\s+<td className="py-1\.5 px-1\.5 text-center bg-slate-800/95 z-10">'
$replacement = '$1{/* Coluna atual (sempre visível) */}$1{!showAllCheckinsColumns && ($1  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">'

$content = $content -replace $pattern, $replacement

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Alinhamento corrigido!" -ForegroundColor Green
