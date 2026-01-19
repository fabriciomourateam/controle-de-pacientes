# Script para corrigir alinhamento - remover condição apenas da abertura da coluna atual

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Padrão: encontrar {/* Coluna atual (sempre visível) */} seguido de {!showAllCheckinsColumns && (
# e substituir removendo a condição
$pattern = '(\s+)\{/\* Coluna atual \(sempre visível\) \*/\}\s*\n\s*\{!showAllCheckinsColumns && \(\s*\n\s*<td'
$replacement = '$1{/* Coluna atual (sempre visível) */}$1<td'

$content = $content -replace $pattern, $replacement

# Remover os )} que fecham essa condição antes de {/* Coluna de evolução */}
$pattern2 = '(\s+)</td>\s*\n\s*\)\}\s*\n\s*\{/\* Coluna de evolução \*/\}'
$replacement2 = '$1</td>$1{/* Coluna de evolução */}'

$content = $content -replace $pattern2, $replacement2

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Alinhamento corrigido corretamente!" -ForegroundColor Green
