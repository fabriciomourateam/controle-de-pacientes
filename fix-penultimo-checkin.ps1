# Script para corrigir referências ao penúltimo check-in

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Substituir previousCheckins.slice(2) por previousCheckins.slice(0, -1)
$content = $content -replace 'previousCheckins\.slice\(2\)', 'previousCheckins.slice(0, -1)'

# Substituir previousCheckins[1] por previousCheckins[previousCheckins.length - 1]
$content = $content -replace 'previousCheckins\[1\]', 'previousCheckins[previousCheckins.length - 1]'

# Substituir previousCheckins.length >= 2 por previousCheckins.length > 0
$content = $content -replace 'previousCheckins\.length >= 2', 'previousCheckins.length > 0'

# Remover linhas de "antepenúltimo" que não são mais necessárias
$content = $content -replace '(?s)\{/\* Coluna antepenúltimo.*?\}\s*\)', ''
$content = $content -replace '(?s)\{/\* Coluna do antepenúltimo.*?\}\s*\)', ''

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Arquivo corrigido com sucesso!" -ForegroundColor Green
Write-Host "Alterações realizadas:" -ForegroundColor Cyan
Write-Host "  - previousCheckins.slice(2) → previousCheckins.slice(0, -1)" -ForegroundColor Yellow
Write-Host "  - previousCheckins[1] → previousCheckins[previousCheckins.length - 1]" -ForegroundColor Yellow
Write-Host "  - Removidas colunas de 'antepenúltimo'" -ForegroundColor Yellow
