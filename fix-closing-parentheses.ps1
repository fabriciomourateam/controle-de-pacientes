# Script para adicionar parênteses de fechamento antes das colunas de evolução

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Adicionar )} antes de cada {/* Coluna de evolução */} que não tenha já
$content = $content -replace '(\s+)</td>\s*\n\s*\{/\* Coluna de evolução \*/\}', '$1</td>$1)}$1{/* Coluna de evolução */}'

# Remover duplicatas caso já existam
$content = $content -replace '\)\}\s*\)\}', ')}'

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Parênteses de fechamento adicionados!" -ForegroundColor Green
