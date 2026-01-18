# Script para corrigir encoding de caracteres no CheckinFeedbackCard.tsx
$filePath = "src/components/checkins/CheckinFeedbackCard.tsx"

# Ler o arquivo com encoding UTF-8
$content = Get-Content -Path $filePath -Raw -Encoding UTF8

# Substituições de caracteres corrompidos
$replacements = @{
    'M�trica' = 'Métrica'
    'Evolu��o' = 'Evolução'
    'Refei��es' = 'Refeições'
    '�gua' = 'Água'
    'Informa��es' = 'Informações'
    'Elabora��o' = 'Elaboração'
    'Percep��es' = 'Percepções'
    'Observa��es' = 'Observações'
    'hor�rio' = 'horário'
    'refei��o' = 'refeição'
    's�ries' = 'séries'
    'bioimped�ncia' = 'bioimpedância'
    'exporta��o' = 'exportação'
    'espec�fico' = 'específico'
    'depend�ncia' = 'dependência'
    'hist�ricas' = 'históricas'
    'antepen�ltimo' = 'antepenúltimo'
    'pen�ltimo' = 'penúltimo'
    'L�GICA' = 'LÓGICA'
    '�ltimas' = 'últimas'
}

# Aplicar todas as substituições
foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
}

# Salvar o arquivo com encoding UTF-8
$content | Set-Content -Path $filePath -Encoding UTF8 -NoNewline

Write-Host "Encoding corrigido com sucesso!" -ForegroundColor Green
