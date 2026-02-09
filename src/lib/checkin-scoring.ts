/**
 * Sistema de pontuação do check-in.
 * Calcula pontos para cada campo e totaliza.
 */

export function calculateCheckinScore(data: Record<string, string>): Record<string, string> {
  const scores: Record<string, number> = {};

  // Treinos (0-10)
  const treino = data.treino || '0';
  const treinoNum = treino === 'Nenhum' ? 0 : parseInt(treino) || 0;
  if (treinoNum === 0) scores.pontos_treinos = 0;
  else if (treinoNum <= 2) scores.pontos_treinos = 2.5;
  else if (treinoNum <= 4) scores.pontos_treinos = 5;
  else if (treinoNum <= 5) scores.pontos_treinos = 7.5;
  else scores.pontos_treinos = 10;

  // Cardios (0-10)
  const cardio = data.cardio || '0';
  const cardioNum = cardio === 'Nenhum' ? 0 : parseInt(cardio) || 0;
  if (cardioNum === 0) scores.pontos_cardios = 0;
  else if (cardioNum <= 2) scores.pontos_cardios = 2.5;
  else if (cardioNum <= 4) scores.pontos_cardios = 5;
  else if (cardioNum <= 5) scores.pontos_cardios = 7.5;
  else scores.pontos_cardios = 10;

  // Descanso entre séries (0-10)
  const descanso = data.descanso || '';
  if (descanso.includes('30')) scores.pontos_descanso = 2.5;
  else if (descanso.includes('45')) scores.pontos_descanso = 5;
  else if (descanso.includes('1 minuto')) scores.pontos_descanso = 10;
  else if (descanso.includes('Mais')) scores.pontos_descanso = 7.5;
  else scores.pontos_descanso = 5;

  // Refeição livre (0-10, invertido: menos = melhor)
  const refLivre = data.ref_livre || '0';
  const refNum = parseInt(refLivre) || 0;
  if (refNum === 0) scores.pontos_refeicao_livre = 10;
  else if (refNum <= 1) scores.pontos_refeicao_livre = 7.5;
  else if (refNum <= 2) scores.pontos_refeicao_livre = 5;
  else if (refNum <= 3) scores.pontos_refeicao_livre = 2.5;
  else scores.pontos_refeicao_livre = 0;

  // Beliscos (0-10, invertido)
  const beliscos = data.beliscos || '0';
  const beliscosNum = parseInt(beliscos) || 0;
  if (beliscosNum === 0) scores.pontos_beliscos = 10;
  else if (beliscosNum <= 1) scores.pontos_beliscos = 7.5;
  else if (beliscosNum <= 2) scores.pontos_beliscos = 5;
  else if (beliscosNum <= 3) scores.pontos_beliscos = 2.5;
  else scores.pontos_beliscos = 0;

  // Água (0-10)
  const agua = data.agua || '';
  if (agua.includes('4')) scores.pontos_agua = 10;
  else if (agua.includes('3,5') || agua.includes('3.5')) scores.pontos_agua = 10;
  else if (agua.includes('3')) scores.pontos_agua = 7.5;
  else if (agua.includes('2,5') || agua.includes('2.5')) scores.pontos_agua = 5;
  else if (agua.includes('2')) scores.pontos_agua = 5;
  else scores.pontos_agua = 2.5;

  // Sono horas (0-10)
  const sono = data.sono || '';
  if (sono.includes('8') || sono.includes('mais')) scores.pontos_sono = 10;
  else if (sono.includes('7')) scores.pontos_sono = 7.5;
  else if (sono.includes('6')) scores.pontos_sono = 5;
  else if (sono.includes('5')) scores.pontos_sono = 2.5;
  else scores.pontos_sono = 0;

  // Estresse (valor já vem na escala)
  const stress = data.stress || '';
  const stressMatch = stress.match(/\((\d+\.?\d*)\)/);
  scores.pontos_stress = stressMatch ? parseFloat(stressMatch[1]) : 5;

  // Libido (valor já vem na escala)
  const libido = data.libido || '';
  const libidoMatch = libido.match(/\((\d+\.?\d*)\)/);
  scores.pontos_libido = libidoMatch ? parseFloat(libidoMatch[1]) : 5;

  // Total e percentual
  const allScores = [
    scores.pontos_treinos,
    scores.pontos_cardios,
    scores.pontos_descanso,
    scores.pontos_refeicao_livre,
    scores.pontos_beliscos,
    scores.pontos_agua,
    scores.pontos_sono,
    scores.pontos_stress,
    scores.pontos_libido,
  ];

  const total = allScores.reduce((a, b) => a + b, 0);
  const max = allScores.length * 10;
  const percentual = ((total / max) * 100).toFixed(1);

  return {
    pontos_treinos: scores.pontos_treinos.toString(),
    pontos_cardios: scores.pontos_cardios.toString(),
    pontos_descanso_entre_series: scores.pontos_descanso.toString(),
    pontos_refeicao_livre: scores.pontos_refeicao_livre.toString(),
    pontos_beliscos: scores.pontos_beliscos.toString(),
    pontos_agua: scores.pontos_agua.toString(),
    pontos_sono: scores.pontos_sono.toString(),
    pontos_stress: scores.pontos_stress.toString(),
    pontos_libido: scores.pontos_libido.toString(),
    total_pontuacao: total.toString(),
    percentual_aproveitamento: percentual,
  };
}
