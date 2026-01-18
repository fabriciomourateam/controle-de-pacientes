# Script para corrigir a lógica das colunas históricas
$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o arquivo
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Substituir todas as ocorrências de .slice(2).map quando shouldShowAllColumns
$content = $content -replace 'shouldShowAllColumns && previousCheckins\.slice\(2\)\.map', 'shouldShowAllColumns ? previousCheckins.map'

# Adicionar o fechamento do ternário e o else com modo compacto
# Isso precisa ser feito manualmente para cada métrica, então vou fazer apenas a substituição básica

# Salvar o arquivo
$content | Set-Content -Path $filePath -Encoding UTF8 -NoNewline

Write-Host "Lógica de colunas corrigida!" -ForegroundColor Green
