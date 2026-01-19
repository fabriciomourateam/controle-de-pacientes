# Script para corrigir completamente o alinhamento da tabela

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# 1. Remover todas as colunas "antepenúltimo" duplicadas
$content = $content -replace '(?s)\{/\* Coluna antepenúltimo.*?\}\s*\n\s*\{!showAllCheckinsColumns.*?\n.*?</td>\s*\n\s*\}\)', ''

# 2. Envolver todas as colunas "Coluna atual" com a condição !showAllCheckinsColumns
# Padrão: encontrar {/* Coluna atual */} seguido de <td> que NÃO está dentro de uma condição
$content = $content -replace '(\s+)\}\)\s*\n\s*\{/\* Coluna atual( \(sempre visível\))? \*/\}\s*\n\s*<td className="py-1\.5', '$1})}$1{/* Coluna atual (sempre visível) */}$1{!showAllCheckinsColumns && ($1  <td className="py-1.5'

# 3. Fechar os parênteses das colunas atuais antes da coluna de evolução
# Procurar por </td> seguido de {/* Coluna de evolução */} e adicionar )}
$content = $content -replace '(\s+)</td>\s*\n\s*\{/\* Coluna de evolução \*/\}', '$1</td>$1)}$1{/* Coluna de evolução */}'

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Alinhamento da tabela corrigido completamente!" -ForegroundColor Green
Write-Host "Alterações:" -ForegroundColor Cyan
Write-Host "  - Removidas colunas 'antepenúltimo' duplicadas" -ForegroundColor Yellow
Write-Host "  - Todas as colunas 'atual' envolvidas com !showAllCheckinsColumns" -ForegroundColor Yellow
Write-Host "  - Parênteses fechados corretamente" -ForegroundColor Yellow
