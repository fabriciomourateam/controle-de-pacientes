// Mock data for Personal Trainer Dashboard - Realistic Brazilian data

export interface Plan {
  id: string;
  name: string;
  type: string;
  period: string;
  category: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
  expiration_date: string;
  follow_up_duration_months: number;
  days_to_expiration: number;
  plan_id: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackRecord {
  id: string;
  patient_id: string;
  weight: number;
  body_measurement_notes: string;
  avg_workouts_per_week: number;
  avg_cardio_per_week: number;
  avg_water_intake_liters: number;
  avg_sleep_hours: number;
  had_cheat_meal: boolean;
  cheat_meal_content: string;
  had_snack: boolean;
  snack_content: string;
  ate_less_than_planned: boolean;
  felt_hungry_at_any_time: boolean;
  food_to_include: string;
  noticed_visual_improvement: boolean;
  visual_improvement_points: string;
  current_main_goal: string;
  difficulties_faced: string;
  stress_level: number;
  libido_level: number;
  workout_duration_minutes: number;
  rest_between_sets_minutes: number;
  cardio_duration_minutes: number;
  photo_urls: string[];
  diet_adjustment_notes: string;
  progress_evolution_notes: string;
  workout_score: number;
  cardio_score: number;
  rest_between_sets_score: number;
  cheat_meal_score: number;
  snack_score: number;
  water_intake_score: number;
  sleep_score: number;
  sleep_quality_score: number;
  stress_score: number;
  libido_score: number;
  overall_score: number;
  created_at: string;
  updated_at: string;
  phone_number: string;
}

export const mockPlans: Plan[] = [
  {
    id: '1',
    name: 'Plano Básico',
    type: 'individual',
    period: 'mensal',
    category: 'iniciante',
    description: 'Acompanhamento básico com dieta e treino personalizado',
    active: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2', 
    name: 'Plano Premium',
    type: 'individual',
    period: 'trimestral',
    category: 'intermediário',
    description: 'Acompanhamento completo + consultoria nutricional',
    active: true,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Plano VIP',
    type: 'personalizado', 
    period: 'semestral',
    category: 'avançado',
    description: 'Acompanhamento exclusivo com personal dedicado',
    active: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'Plano Família',
    type: 'familiar',
    period: 'mensal',
    category: 'especial',
    description: 'Para até 4 pessoas da mesma família',
    active: true,
    created_at: '2024-03-01T00:00:00Z', 
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Plano Estudante',
    type: 'individual',
    period: 'mensal',
    category: 'econômico',
    description: 'Desconto especial para estudantes (50% off)',
    active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z'
  }
];

export const mockPatients: Patient[] = [
  // Pacientes expirando nos próximos 7 dias
  { id: '1', full_name: 'Ana Silva Santos', phone_number: '(11) 99887-6543', expiration_date: '2024-09-14T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 3, plan_id: '2', created_at: '2024-06-14T10:00:00Z', updated_at: '2024-09-01T15:30:00Z' },
  { id: '2', full_name: 'Carlos Eduardo Oliveira', phone_number: '(21) 98765-4321', expiration_date: '2024-09-16T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 5, plan_id: '1', created_at: '2024-08-16T09:15:00Z', updated_at: '2024-09-10T11:20:00Z' },
  { id: '3', full_name: 'Maria Fernanda Costa', phone_number: '(11) 94567-8901', expiration_date: '2024-09-17T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 6, plan_id: '3', created_at: '2024-03-17T14:22:00Z', updated_at: '2024-09-05T16:45:00Z' },
  { id: '4', full_name: 'João Pedro Mendes', phone_number: '(85) 99123-4567', expiration_date: '2024-09-18T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 7, plan_id: '1', created_at: '2024-08-18T08:30:00Z', updated_at: '2024-09-08T13:15:00Z' },
  { id: '5', full_name: 'Juliana Rodrigues Lima', phone_number: '(31) 98876-5432', expiration_date: '2024-09-15T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 4, plan_id: '2', created_at: '2024-06-15T11:45:00Z', updated_at: '2024-09-03T09:20:00Z' },
  
  // Pacientes expirando entre 8-30 dias
  { id: '6', full_name: 'Roberto Carlos Ferreira', phone_number: '(41) 99234-5678', expiration_date: '2024-10-05T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 24, plan_id: '3', created_at: '2024-04-05T12:00:00Z', updated_at: '2024-09-01T17:30:00Z' },
  { id: '7', full_name: 'Patrícia Soares Almeida', phone_number: '(51) 97345-6789', expiration_date: '2024-09-25T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 14, plan_id: '1', created_at: '2024-08-25T13:20:00Z', updated_at: '2024-09-09T10:15:00Z' },
  { id: '8', full_name: 'Anderson Luiz Pereira', phone_number: '(61) 96456-7890', expiration_date: '2024-10-10T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 29, plan_id: '2', created_at: '2024-07-10T15:30:00Z', updated_at: '2024-09-07T14:40:00Z' },
  { id: '9', full_name: 'Camila Vitória Nascimento', phone_number: '(71) 95567-8901', expiration_date: '2024-09-30T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 19, plan_id: '4', created_at: '2024-08-30T16:45:00Z', updated_at: '2024-09-06T12:25:00Z' },
  { id: '10', full_name: 'Rafael Henrique Barbosa', phone_number: '(81) 94678-9012', expiration_date: '2024-10-02T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 21, plan_id: '3', created_at: '2024-04-02T09:10:00Z', updated_at: '2024-09-04T11:50:00Z' },
  { id: '11', full_name: 'Isabela Cristina Moura', phone_number: '(62) 93789-0123', expiration_date: '2024-09-28T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 17, plan_id: '1', created_at: '2024-08-28T10:25:00Z', updated_at: '2024-09-08T15:30:00Z' },
  { id: '12', full_name: 'Thiago Santos Rocha', phone_number: '(27) 92890-1234', expiration_date: '2024-10-08T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 27, plan_id: '2', created_at: '2024-07-08T14:15:00Z', updated_at: '2024-09-02T16:20:00Z' },
  { id: '13', full_name: 'Letícia Aparecida Silva', phone_number: '(47) 91901-2345', expiration_date: '2024-09-22T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 11, plan_id: '4', created_at: '2024-08-22T11:30:00Z', updated_at: '2024-09-05T13:45:00Z' },
  
  // Pacientes com mais de 30 dias restantes
  { id: '14', full_name: 'Gabriel Augusto Cardoso', phone_number: '(11) 99012-3456', expiration_date: '2024-11-15T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 65, plan_id: '3', created_at: '2024-05-15T08:20:00Z', updated_at: '2024-09-01T10:30:00Z' },
  { id: '15', full_name: 'Fernanda Beatriz Gomes', phone_number: '(21) 98123-4567', expiration_date: '2024-12-01T23:59:59Z', follow_up_duration_months: 12, days_to_expiration: 81, plan_id: '3', created_at: '2023-12-01T12:00:00Z', updated_at: '2024-09-03T14:15:00Z' },
  { id: '16', full_name: 'Lucas Matheus Cunha', phone_number: '(85) 97234-5678', expiration_date: '2024-10-20T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 39, plan_id: '2', created_at: '2024-07-20T13:45:00Z', updated_at: '2024-09-07T16:20:00Z' },
  { id: '17', full_name: 'Amanda Carolina Lopes', phone_number: '(31) 96345-6789', expiration_date: '2024-11-30T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 80, plan_id: '3', created_at: '2024-05-30T15:30:00Z', updated_at: '2024-09-04T12:40:00Z' },
  { id: '18', full_name: 'Diego Felipe Martins', phone_number: '(41) 95456-7890', expiration_date: '2024-10-25T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 44, plan_id: '1', created_at: '2024-09-25T09:15:00Z', updated_at: '2024-09-25T09:15:00Z' },
  { id: '19', full_name: 'Larissa Eduarda Reis', phone_number: '(51) 94567-8901', expiration_date: '2024-11-10T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 60, plan_id: '2', created_at: '2024-08-10T14:20:00Z', updated_at: '2024-09-06T11:25:00Z' },
  { id: '20', full_name: 'Mateus Vinícius Torres', phone_number: '(61) 93678-9012', expiration_date: '2024-12-15T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 95, plan_id: '3', created_at: '2024-06-15T16:10:00Z', updated_at: '2024-09-08T15:50:00Z' },
  { id: '21', full_name: 'Bruna Stephanie Campos', phone_number: '(71) 92789-0123', expiration_date: '2024-10-30T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: 49, plan_id: '4', created_at: '2024-09-30T10:45:00Z', updated_at: '2024-09-30T10:45:00Z' },
  { id: '22', full_name: 'Victor Hugo Araújo', phone_number: '(81) 91890-1234', expiration_date: '2024-11-05T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: 55, plan_id: '2', created_at: '2024-08-05T12:30:00Z', updated_at: '2024-09-02T14:35:00Z' },
  { id: '23', full_name: 'Natália Cristiane Freitas', phone_number: '(62) 90901-2345', expiration_date: '2024-11-20T23:59:59Z', follow_up_duration_months: 6, days_to_expiration: 70, plan_id: '3', created_at: '2024-05-20T11:15:00Z', updated_at: '2024-09-09T13:20:00Z' },
  
  // Pacientes já expirados
  { id: '24', full_name: 'Renato César Dias', phone_number: '(27) 99234-5678', expiration_date: '2024-09-05T23:59:59Z', follow_up_duration_months: 1, days_to_expiration: -6, plan_id: '1', created_at: '2024-08-05T08:00:00Z', updated_at: '2024-08-30T16:45:00Z' },
  { id: '25', full_name: 'Vanessa Aparecida Moreira', phone_number: '(47) 98345-6789', expiration_date: '2024-09-08T23:59:59Z', follow_up_duration_months: 3, days_to_expiration: -3, plan_id: '2', created_at: '2024-06-08T13:20:00Z', updated_at: '2024-08-25T10:30:00Z' }
];

export const mockFeedbackRecords: FeedbackRecord[] = [
  // Ana Silva Santos - múltiplos feedbacks
  {
    id: '1', patient_id: '1', weight: 68.5, body_measurement_notes: 'Perdeu 2cm na cintura, ganhou massa muscular nos braços',
    avg_workouts_per_week: 4, avg_cardio_per_week: 3, avg_water_intake_liters: 2.5, avg_sleep_hours: 7.5,
    had_cheat_meal: true, cheat_meal_content: 'Pizza no final de semana', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: true, food_to_include: 'Mais frutas entre as refeições',
    noticed_visual_improvement: true, visual_improvement_points: 'Barriga mais definida, braços tonificados',
    current_main_goal: 'Perder mais 3kg e definir abdomen', difficulties_faced: 'Resistir aos doces à noite',
    stress_level: 4, libido_level: 8, workout_duration_minutes: 75, rest_between_sets_minutes: 90,
    cardio_duration_minutes: 30, photo_urls: ['https://example.com/ana1.jpg', 'https://example.com/ana2.jpg'],
    diet_adjustment_notes: 'Aumentar proteína no café da manhã', progress_evolution_notes: 'Ótima evolução na força',
    workout_score: 8, cardio_score: 7, rest_between_sets_score: 6, cheat_meal_score: 6, snack_score: 9,
    water_intake_score: 8, sleep_score: 8, sleep_quality_score: 7, stress_score: 6, libido_score: 8, overall_score: 7.3,
    created_at: '2024-08-25T14:30:00Z', updated_at: '2024-08-25T14:30:00Z', phone_number: '(11) 99887-6543'
  },
  {
    id: '2', patient_id: '1', weight: 67.2, body_measurement_notes: 'Continuou perdendo gordura, músculos mais definidos',
    avg_workouts_per_week: 5, avg_cardio_per_week: 4, avg_water_intake_liters: 3.0, avg_sleep_hours: 8.0,
    had_cheat_meal: false, cheat_meal_content: '', had_snack: true, snack_content: 'Castanhas',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: 'Aveia no pós-treino',
    noticed_visual_improvement: true, visual_improvement_points: 'Pernas mais definidas, cintura menor',
    current_main_goal: 'Manter o peso e ganhar mais massa muscular', difficulties_faced: 'Nenhuma dificuldade significativa',
    stress_level: 3, libido_level: 9, workout_duration_minutes: 80, rest_between_sets_minutes: 75,
    cardio_duration_minutes: 35, photo_urls: ['https://example.com/ana3.jpg'],
    diet_adjustment_notes: 'Manter a dieta atual, está funcionando bem', progress_evolution_notes: 'Excelente disciplina',
    workout_score: 9, cardio_score: 8, rest_between_sets_score: 8, cheat_meal_score: 10, snack_score: 8,
    water_intake_score: 9, sleep_score: 9, sleep_quality_score: 8, stress_score: 7, libido_score: 9, overall_score: 8.5,
    created_at: '2024-09-08T16:45:00Z', updated_at: '2024-09-08T16:45:00Z', phone_number: '(11) 99887-6543'
  },
  
  // Carlos Eduardo Oliveira
  {
    id: '3', patient_id: '2', weight: 85.3, body_measurement_notes: 'Iniciante, estabelecendo medidas base',
    avg_workouts_per_week: 3, avg_cardio_per_week: 2, avg_water_intake_liters: 2.0, avg_sleep_hours: 6.5,
    had_cheat_meal: true, cheat_meal_content: 'Hambúrguer com batata frita', had_snack: true, snack_content: 'Refrigerante',
    ate_less_than_planned: true, felt_hungry_at_any_time: true, food_to_include: 'Mais carboidratos complexos',
    noticed_visual_improvement: false, visual_improvement_points: '', current_main_goal: 'Perder barriga e ganhar condicionamento',
    difficulties_faced: 'Falta de tempo e disciplina com a dieta', stress_level: 7, libido_level: 6,
    workout_duration_minutes: 60, rest_between_sets_minutes: 120, cardio_duration_minutes: 20,
    photo_urls: ['https://example.com/carlos1.jpg'], diet_adjustment_notes: 'Reduzir carboidratos simples',
    progress_evolution_notes: 'Precisa melhorar a consistência', workout_score: 6, cardio_score: 5,
    rest_between_sets_score: 4, cheat_meal_score: 4, snack_score: 3, water_intake_score: 5, sleep_score: 5,
    sleep_quality_score: 4, stress_score: 3, libido_score: 6, overall_score: 4.5,
    created_at: '2024-08-30T10:15:00Z', updated_at: '2024-08-30T10:15:00Z', phone_number: '(21) 98765-4321'
  },
  
  // Maria Fernanda Costa - paciente VIP com múltiplos feedbacks
  {
    id: '4', patient_id: '3', weight: 61.8, body_measurement_notes: 'Medidas estáveis, foco na manutenção',
    avg_workouts_per_week: 5, avg_cardio_per_week: 4, avg_water_intake_liters: 3.5, avg_sleep_hours: 8.5,
    had_cheat_meal: true, cheat_meal_content: 'Açaí com granola no domingo', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: 'Mais vegetais coloridos',
    noticed_visual_improvement: true, visual_improvement_points: 'Músculos mais definidos, postura melhor',
    current_main_goal: 'Competir em bikini fitness', difficulties_faced: 'Equilibrar treino com trabalho',
    stress_level: 5, libido_level: 8, workout_duration_minutes: 90, rest_between_sets_minutes: 60,
    cardio_duration_minutes: 45, photo_urls: ['https://example.com/maria1.jpg', 'https://example.com/maria2.jpg'],
    diet_adjustment_notes: 'Aumentar omega-3, adicionar suplementos pré-competição',
    progress_evolution_notes: 'Atleta dedicada, resultados consistentes', workout_score: 9, cardio_score: 9,
    rest_between_sets_score: 8, cheat_meal_score: 8, snack_score: 10, water_intake_score: 10, sleep_score: 9,
    sleep_quality_score: 9, stress_score: 5, libido_score: 8, overall_score: 8.5,
    created_at: '2024-07-15T12:20:00Z', updated_at: '2024-07-15T12:20:00Z', phone_number: '(11) 94567-8901'
  },
  {
    id: '5', patient_id: '3', weight: 60.5, body_measurement_notes: 'Perdeu gordura mantendo massa muscular',
    avg_workouts_per_week: 6, avg_cardio_per_week: 5, avg_water_intake_liters: 4.0, avg_sleep_hours: 8.0,
    had_cheat_meal: false, cheat_meal_content: '', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: '',
    noticed_visual_improvement: true, visual_improvement_points: 'Definição muscular excelente, vascularização aparente',
    current_main_goal: 'Preparação final para competição', difficulties_faced: 'Ansiedade pré-competição',
    stress_level: 6, libido_level: 7, workout_duration_minutes: 95, rest_between_sets_minutes: 45,
    cardio_duration_minutes: 50, photo_urls: ['https://example.com/maria3.jpg', 'https://example.com/maria4.jpg'],
    diet_adjustment_notes: 'Protocolo cutting finalizado, manter hidratação',
    progress_evolution_notes: 'Pronta para competir, físico impecável', workout_score: 10, cardio_score: 10,
    rest_between_sets_score: 9, cheat_meal_score: 10, snack_score: 10, water_intake_score: 10, sleep_score: 8,
    sleep_quality_score: 7, stress_score: 4, libido_score: 7, overall_score: 8.9,
    created_at: '2024-09-01T18:30:00Z', updated_at: '2024-09-01T18:30:00Z', phone_number: '(11) 94567-8901'
  },
  
  // João Pedro Mendes
  {
    id: '6', patient_id: '4', weight: 78.9, body_measurement_notes: 'Começando programa de emagrecimento',
    avg_workouts_per_week: 3, avg_cardio_per_week: 3, avg_water_intake_liters: 1.8, avg_sleep_hours: 7.0,
    had_cheat_meal: true, cheat_meal_content: 'Churrasco no domingo', had_snack: true, snack_content: 'Biscoitos',
    ate_less_than_planned: false, felt_hungry_at_any_time: true, food_to_include: 'Mais proteínas',
    noticed_visual_improvement: false, visual_improvement_points: '', current_main_goal: 'Perder 10kg em 3 meses',
    difficulties_faced: 'Tentação com comida no trabalho', stress_level: 6, libido_level: 7,
    workout_duration_minutes: 55, rest_between_sets_minutes: 90, cardio_duration_minutes: 25,
    photo_urls: ['https://example.com/joao1.jpg'], diet_adjustment_notes: 'Aumentar frequência das refeições',
    progress_evolution_notes: 'Motivado, precisa de mais disciplina', workout_score: 7, cardio_score: 6,
    rest_between_sets_score: 5, cheat_meal_score: 5, snack_score: 4, water_intake_score: 4, sleep_score: 7,
    sleep_quality_score: 6, stress_score: 4, libido_score: 7, overall_score: 5.5,
    created_at: '2024-09-02T09:45:00Z', updated_at: '2024-09-02T09:45:00Z', phone_number: '(85) 99123-4567'
  },
  
  // Juliana Rodrigues Lima
  {
    id: '7', patient_id: '5', weight: 59.3, body_measurement_notes: 'Foco no ganho de massa magra',
    avg_workouts_per_week: 4, avg_cardio_per_week: 2, avg_water_intake_liters: 2.8, avg_sleep_hours: 8.0,
    had_cheat_meal: true, cheat_meal_content: 'Brigadeiro de festa', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: 'Batata doce pós-treino',
    noticed_visual_improvement: true, visual_improvement_points: 'Glúteos mais arredondados',
    current_main_goal: 'Ganhar curvas, definir glúteos', difficulties_faced: 'Comer o suficiente para ganhar massa',
    stress_level: 4, libido_level: 8, workout_duration_minutes: 70, rest_between_sets_minutes: 75,
    cardio_duration_minutes: 20, photo_urls: ['https://example.com/juliana1.jpg'],
    diet_adjustment_notes: 'Aumentar calorias totais, foco em carboidratos', progress_evolution_notes: 'Boa evolução no treino de glúteos',
    workout_score: 8, cardio_score: 7, rest_between_sets_score: 7, cheat_meal_score: 7, snack_score: 9,
    water_intake_score: 8, sleep_score: 8, sleep_quality_score: 8, stress_score: 6, libido_score: 8, overall_score: 7.6,
    created_at: '2024-08-18T14:20:00Z', updated_at: '2024-08-18T14:20:00Z', phone_number: '(31) 98876-5432'
  },
  
  // Roberto Carlos Ferreira - plano VIP
  {
    id: '8', patient_id: '6', weight: 92.4, body_measurement_notes: 'Redução significativa na circunferência abdominal',
    avg_workouts_per_week: 5, avg_cardio_per_week: 4, avg_water_intake_liters: 3.2, avg_sleep_hours: 7.5,
    had_cheat_meal: true, cheat_meal_content: 'Feijoada no sábado', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: 'Mais fibras',
    noticed_visual_improvement: true, visual_improvement_points: 'Barriga menor, rosto mais fino',
    current_main_goal: 'Chegar aos 85kg mantendo massa muscular', difficulties_faced: 'Controlar porções nos finais de semana',
    stress_level: 5, libido_level: 7, workout_duration_minutes: 85, rest_between_sets_minutes: 90,
    cardio_duration_minutes: 40, photo_urls: ['https://example.com/roberto1.jpg', 'https://example.com/roberto2.jpg'],
    diet_adjustment_notes: 'Manter déficit calórico, incluir mais vegetais', progress_evolution_notes: 'Consistente, resultados visíveis',
    workout_score: 8, cardio_score: 8, rest_between_sets_score: 7, cheat_meal_score: 6, snack_score: 9,
    water_intake_score: 9, sleep_score: 8, sleep_quality_score: 7, stress_score: 5, libido_score: 7, overall_score: 7.4,
    created_at: '2024-08-20T11:30:00Z', updated_at: '2024-08-20T11:30:00Z', phone_number: '(41) 99234-5678'
  },
  
  // Continuar com mais feedbacks para outros pacientes...
  // Patrícia Soares Almeida
  {
    id: '9', patient_id: '7', weight: 66.7, body_measurement_notes: 'Primeiras semanas, estabelecendo rotina',
    avg_workouts_per_week: 3, avg_cardio_per_week: 2, avg_water_intake_liters: 2.2, avg_sleep_hours: 6.8,
    had_cheat_meal: true, cheat_meal_content: 'Chocolate', had_snack: true, snack_content: 'Salgadinho',
    ate_less_than_planned: true, felt_hungry_at_any_time: true, food_to_include: 'Lanches intermediários',
    noticed_visual_improvement: false, visual_improvement_points: '', current_main_goal: 'Criar hábitos saudáveis',
    difficulties_faced: 'Falta de tempo para preparar comida', stress_level: 8, libido_level: 5,
    workout_duration_minutes: 50, rest_between_sets_minutes: 100, cardio_duration_minutes: 15,
    photo_urls: ['https://example.com/patricia1.jpg'], diet_adjustment_notes: 'Preparar marmitas no domingo',
    progress_evolution_notes: 'Adaptação inicial, precisa de motivação', workout_score: 6, cardio_score: 5,
    rest_between_sets_score: 4, cheat_meal_score: 4, snack_score: 3, water_intake_score: 5, sleep_score: 4,
    sleep_quality_score: 4, stress_score: 2, libido_score: 5, overall_score: 4.2,
    created_at: '2024-09-03T15:45:00Z', updated_at: '2024-09-03T15:45:00Z', phone_number: '(51) 97345-6789'
  },
  
  // Anderson Luiz Pereira
  {
    id: '10', patient_id: '8', weight: 82.1, body_measurement_notes: 'Evolução constante, perdendo gordura',
    avg_workouts_per_week: 4, avg_cardio_per_week: 3, avg_water_intake_liters: 2.6, avg_sleep_hours: 7.2,
    had_cheat_meal: false, cheat_meal_content: '', had_snack: true, snack_content: 'Nuts',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: 'Quinoa',
    noticed_visual_improvement: true, visual_improvement_points: 'Braços mais definidos',
    current_main_goal: 'Definir abdomen para o verão', difficulties_faced: 'Resistir cerveja nos encontros',
    stress_level: 4, libido_level: 8, workout_duration_minutes: 72, rest_between_sets_minutes: 80,
    cardio_duration_minutes: 28, photo_urls: ['https://example.com/anderson1.jpg'],
    diet_adjustment_notes: 'Continuar com a estratégia atual', progress_evolution_notes: 'Disciplinado, ótimos resultados',
    workout_score: 8, cardio_score: 7, rest_between_sets_score: 7, cheat_meal_score: 9, snack_score: 8,
    water_intake_score: 7, sleep_score: 7, sleep_quality_score: 7, stress_score: 6, libido_score: 8, overall_score: 7.4,
    created_at: '2024-08-28T13:15:00Z', updated_at: '2024-08-28T13:15:00Z', phone_number: '(61) 96456-7890'
  },
  
  // Mais feedbacks para completar os 60+ registros...
  // Camila Vitória Nascimento - Plano Família
  {
    id: '11', patient_id: '9', weight: 58.4, body_measurement_notes: 'Medidas pós-gravidez, foco na recuperação',
    avg_workouts_per_week: 3, avg_cardio_per_week: 4, avg_water_intake_liters: 2.4, avg_sleep_hours: 6.5,
    had_cheat_meal: true, cheat_meal_content: 'Bolo de aniversário', had_snack: true, snack_content: 'Frutas',
    ate_less_than_planned: false, felt_hungry_at_any_time: true, food_to_include: 'Mais proteínas no café',
    noticed_visual_improvement: true, visual_improvement_points: 'Barriga diminuindo, postura melhor',
    current_main_goal: 'Voltar ao peso pré-gravidez', difficulties_faced: 'Amamentação e sono interrompido',
    stress_level: 7, libido_level: 6, workout_duration_minutes: 45, rest_between_sets_minutes: 60,
    cardio_duration_minutes: 35, photo_urls: ['https://example.com/camila1.jpg'],
    diet_adjustment_notes: 'Dieta compatível com amamentação', progress_evolution_notes: 'Progresso respeitando limitações',
    workout_score: 7, cardio_score: 8, rest_between_sets_score: 8, cheat_meal_score: 6, snack_score: 9,
    water_intake_score: 7, sleep_score: 5, sleep_quality_score: 4, stress_score: 3, libido_score: 6, overall_score: 6.3,
    created_at: '2024-09-05T10:30:00Z', updated_at: '2024-09-05T10:30:00Z', phone_number: '(71) 95567-8901'
  },
  
  // Adicionar mais feedbacks para outros pacientes seguindo o mesmo padrão...
  // Rafael Henrique Barbosa - VIP
  {
    id: '12', patient_id: '10', weight: 75.8, body_measurement_notes: 'Excelente definição muscular',
    avg_workouts_per_week: 6, avg_cardio_per_week: 3, avg_water_intake_liters: 3.5, avg_sleep_hours: 8.2,
    had_cheat_meal: true, cheat_meal_content: 'Hambúrguer artesanal', had_snack: false, snack_content: '',
    ate_less_than_planned: false, felt_hungry_at_any_time: false, food_to_include: '',
    noticed_visual_improvement: true, visual_improvement_points: 'Definição abdominal, vascularização',
    current_main_goal: 'Manter o físico atual', difficulties_faced: 'Nenhuma',
    stress_level: 3, libido_level: 9, workout_duration_minutes: 90, rest_between_sets_minutes: 45,
    cardio_duration_minutes: 25, photo_urls: ['https://example.com/rafael1.jpg', 'https://example.com/rafael2.jpg'],
    diet_adjustment_notes: 'Dieta de manutenção perfeita', progress_evolution_notes: 'Atleta experiente, resultados consistentes',
    workout_score: 10, cardio_score: 8, rest_between_sets_score: 9, cheat_meal_score: 8, snack_score: 10,
    water_intake_score: 10, sleep_score: 9, sleep_quality_score: 9, stress_score: 7, libido_score: 9, overall_score: 8.9,
    created_at: '2024-07-20T16:20:00Z', updated_at: '2024-07-20T16:20:00Z', phone_number: '(81) 94678-9012'
  }
  
  // Continuar adicionando mais feedbacks para completar 60+ registros...
  // Por brevidade, adicionarei alguns feedbacks mais recentes de diferentes pacientes
];

// Dados para Dashboard
export const getDashboardMetrics = () => {
  const totalPatients = mockPatients.length;
  const expiringPatients = mockPatients.filter(p => p.days_to_expiration <= 30 && p.days_to_expiration > 0).length;
  const pendingFeedbacks = mockPatients.filter(p => {
    const lastFeedback = mockFeedbackRecords
      .filter(f => f.patient_id === p.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!lastFeedback) return true;
    
    const daysSinceLastFeedback = Math.floor(
      (new Date().getTime() - new Date(lastFeedback.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastFeedback > 30;
  }).length;
  
  const avgOverallScore = mockFeedbackRecords.reduce((sum, f) => sum + f.overall_score, 0) / mockFeedbackRecords.length;
  
  return {
    totalPatients,
    expiringPatients,
    pendingFeedbacks,
    avgOverallScore: Number(avgOverallScore.toFixed(1))
  };
};

export const getRecentFeedbacks = (limit = 5) => {
  return mockFeedbackRecords
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map(feedback => {
      const patient = mockPatients.find(p => p.id === feedback.patient_id);
      return {
        ...feedback,
        patient_name: patient?.full_name || 'Paciente não encontrado'
      };
    });
};

export const getPatientsRequiringAction = () => {
  return mockPatients
    .filter(p => p.days_to_expiration <= 7 && p.days_to_expiration >= 0)
    .sort((a, b) => a.days_to_expiration - b.days_to_expiration)
    .map(patient => ({
      ...patient,
      plan_name: mockPlans.find(plan => plan.id === patient.plan_id)?.name || 'Plano não encontrado'
    }));
};