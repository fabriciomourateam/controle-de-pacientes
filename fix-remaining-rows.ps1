# Script para corrigir as linhas restantes da tabela de evolução
# Quadril, Aproveitamento, Treinos, Cardio, Tempo de Treino, Tempo de Cardio, Descanso, Água, Sono, Refeições Livres, Beliscos

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"
$encoding = [System.Text.Encoding]::UTF8

Write-Host "🔧 Corrigindo linhas restantes da tabela de evolução..." -ForegroundColor Cyan

# Ler o arquivo
$content = [System.IO.File]::ReadAllText($filePath, $encoding)

# Criar backup
$backupPath = "$filePath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
[System.IO.File]::WriteAllText($backupPath, $content, $encoding)
Write-Host "✅ Backup criado: $backupPath`n" -ForegroundColor Green

$corrections = 0

# Função auxiliar para escapar regex
function Escape-RegexChars {
    param([string]$text)
    return [regex]::Escape($text)
}

Write-Host "Aplicando correções...`n" -ForegroundColor Yellow

# As correções serão feitas manualmente via strReplace no Kiro
# Este script serve apenas como documentação do processo

Write-Host "✨ Script preparado. Use o comando strReplace do Kiro para aplicar as correções." -ForegroundColor Green
Write-Host "`n📋 Linhas a corrigir:" -ForegroundColor Cyan
Write-Host "  ✅ Peso - JÁ ESTÁ CORRETO" -ForegroundColor Green
Write-Host "  ✅ Cintura - CORRIGIDO" -ForegroundColor Green
Write-Host "  ⏳ Quadril" -ForegroundColor Yellow
Write-Host "  ⏳ Aproveitamento" -ForegroundColor Yellow
Write-Host "  ⏳ Treinos" -ForegroundColor Yellow
Write-Host "  ⏳ Cardio" -ForegroundColor Yellow
Write-Host "  ⏳ Tempo de Treino" -ForegroundColor Yellow
Write-Host "  ⏳ Tempo de Cardio" -ForegroundColor Yellow
Write-Host "  ⏳ Descanso entre as séries" -ForegroundColor Yellow
Write-Host "  ⏳ Água" -ForegroundColor Yellow
Write-Host "  ⏳ Sono" -ForegroundColor Yellow
Write-Host "  ⏳ Refeições Livres" -ForegroundColor Yellow
Write-Host "  ⏳ Beliscos" -ForegroundColor Yellow
Write-Host "  ⏳ Fotos" -ForegroundColor Yellow

Write-Host "`n💾 Backup salvo em: $backupPath" -ForegroundColor Cyan
