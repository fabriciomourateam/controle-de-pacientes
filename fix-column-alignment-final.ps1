# Script para corrigir o alinhamento removendo condições da coluna atual

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# 1. Remover {!showAllCheckinsColumns && ( antes de <td> da coluna atual
$content = $content -replace '\{!showAllCheckinsColumns && \(\s*<td className="py-1\.5 px-1\.5 text-center', '<td className="py-1.5 px-1.5 text-center'

# 2. Remover )} antes de {/* Coluna de evolução */}
$content = $content -replace '</td>\s*\)\}\s*\{/\* Coluna de evolução \*/\}', '</td>$1{/* Coluna de evolução */}'

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Alinhamento corrigido - colunas atuais sem condição!" -ForegroundColor Green
