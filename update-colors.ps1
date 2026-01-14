$file = "src/components/checkins/CheckinFeedbackCard.tsx"
$content = Get-Content $file -Raw

# SEÇÃO 1 - MEDIDAS CORPORAIS (Azul) - bg-blue-900/30
# Peso - já foi feito
# Cintura
$content = $content -replace '(\{/\* Peso \*/\}[\s\S]{1,300}?<tr className="[^"]*")bg-[^"]+', '$1bg-blue-900/30 hover:bg-blue-900/50 transition-colors'
$content = $content -replace '(Cintura[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-blue-900/30 hover:bg-blue-900/50 transition-colors'
$content = $content -replace '(Quadril[\s\S]{1,300}?<tr className="[^"]*")bg-blue-900/30[^"]*', '$1bg-blue-900/30 hover:bg-blue-900/50 transition-colors'

# SEÇÃO 2 - ATIVIDADES FÍSICAS (Verde) - bg-green-900/20
$content = $content -replace '(Aproveitamento[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'
$content = $content -replace '(🏃 Treinos[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/40[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'
$content = $content -replace '(🏃‍♂️ Cardio[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'
$content = $content -replace '(⏱️ Tempo de Treino[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/40[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'
$content = $content -replace '(🏃 Tempo de Cardio[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/40[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'
$content = $content -replace '(⏸️ Descanso[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/40[^"]*', '$1bg-green-900/20 hover:bg-green-900/40 transition-colors'

# SEÇÃO 3 - HÁBITOS (Amarelo/Laranja) - bg-amber-900/20
$content = $content -replace '(💧 Água[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-amber-900/20 hover:bg-amber-900/40 transition-colors'
$content = $content -replace '(😴 Sono[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-amber-900/20 hover:bg-amber-900/40 transition-colors'
$content = $content -replace '(🍽️ Refeições Livres[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-amber-900/20 hover:bg-amber-900/40 transition-colors'
$content = $content -replace '(🍪 Beliscos[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/20[^"]*', '$1bg-amber-900/20 hover:bg-amber-900/40 transition-colors'

# SEÇÃO 4 - FOTOS (Roxo) - bg-purple-900/20
$content = $content -replace '(📷 Fotos[\s\S]{1,300}?<tr className="[^"]*")bg-slate-800/40[^"]*', '$1bg-purple-900/20 hover:bg-purple-900/40 transition-colors'

$content | Set-Content $file -NoNewline
Write-Host "Cores atualizadas com sucesso!"
