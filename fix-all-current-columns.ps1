# Script para envolver todas as colunas "atual" com a condição !showAllCheckinsColumns

$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o conteúdo do arquivo
$content = Get-Content $filePath -Raw -Encoding UTF8

# Padrão para encontrar blocos de "Coluna atual" que NÃO estão envolvidos por condição
# Procura por: {/* Coluna atual */} seguido de <td> sem estar dentro de um bloco condicional

# Substituir padrões específicos onde a coluna atual não está envolvida por condição
$patterns = @(
    # Padrão 1: Coluna atual sem condição (com comentário genérico)
    @{
        Pattern = '(\s+)\}\)\s*\n\s+\{/\* Coluna atual \*/\}\s*\n\s+<td className="py-1\.5 px-1\.5 text-center bg-slate-800/95 z-10">'
        Replacement = '$1})}$1{/* Coluna atual (sempre visível) */}$1{!showAllCheckinsColumns && ($1  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10">'
    },
    # Padrão 2: Coluna atual com texto específico
    @{
        Pattern = '(\s+)\}\)\s*\n\s+\{/\* Coluna atual \*/\}\s*\n\s+<td className="py-1\.5 px-1\.5 text-center bg-slate-800/95 z-10 text-slate-200">'
        Replacement = '$1})}$1{/* Coluna atual (sempre visível) */}$1{!showAllCheckinsColumns && ($1  <td className="py-1.5 px-1.5 text-center bg-slate-800/95 z-10 text-slate-200">'
    }
)

foreach ($p in $patterns) {
    $content = $content -replace $p.Pattern, $p.Replacement
}

# Salvar o arquivo
$content | Set-Content $filePath -Encoding UTF8 -NoNewline

Write-Host "✅ Todas as colunas 'atual' foram envolvidas com condição!" -ForegroundColor Green
