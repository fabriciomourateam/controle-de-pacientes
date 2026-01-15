import { z } from "zod";

// Schema para pacientes - Nova estrutura
export const patientSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  
  apelido: z.string().optional(),
  
  cpf: z.string().optional(),
  
  email: z.string().optional(),
  
  telefone: z.string().min(1, "Telefone é obrigatório"),
  
  telefone_filtro: z.string().optional(),
  
  genero: z.enum(['Masculino', 'Feminino', 'Outro']).optional(),
  
  data_nascimento: z.union([z.date(), z.string()]).optional(),
  
  plano: z.string().optional(),
  
  tempo_acompanhamento: z.union([z.number(), z.string()]).optional(),
  
  vencimento: z.union([z.date(), z.string()]).optional(),
  
  valor: z.union([z.number(), z.string()]).optional(),
  
  observacao: z.string().optional(),
  
  objetivo: z.string().optional(),
  
  peso: z.union([z.number(), z.string()]).optional(),
  
  medida: z.union([z.number(), z.string()]).optional(),
});

// Schema para planos
export const planSchema = z.object({
  name: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres"),
  
  type: z.enum(['individual', 'personalizado', 'familiar'], {
    required_error: "Selecione o tipo do plano"
  }),
  
  period: z.enum(['mensal', 'trimestral', 'semestral'], {
    required_error: "Selecione o período"
  }),
  
  category: z.enum(['iniciante', 'intermediário', 'avançado', 'especial', 'econômico'], {
    required_error: "Selecione a categoria"
  }),
  
  description: z.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  
  active: z.boolean().default(true)
});

// Schema para feedback - simplificado para demo
export const feedbackSchema = z.object({
  patient_id: z.string().min(1, "Paciente obrigatório"),
  
  // Medidas e peso
  weight: z.number()
    .min(30, "Peso mínimo: 30kg")
    .max(300, "Peso máximo: 300kg"),
  
  body_measurement_notes: z.string().optional(),
  
  // Atividade física
  avg_workouts_per_week: z.number()
    .min(0, "Mínimo 0 treinos")
    .max(14, "Máximo 14 treinos por semana"),
  
  workout_duration_minutes: z.number()
    .min(0, "Duração mínima: 0 minutos")
    .max(300, "Duração máxima: 5 horas"),
  
  avg_cardio_per_week: z.number()
    .min(0, "Mínimo 0")
    .max(14, "Máximo 14 por semana"),
  
  // Scores (1-10)
  workout_score: z.number().min(1).max(10),
  cardio_score: z.number().min(1).max(10),
  rest_between_sets_score: z.number().min(1).max(10),
  
  // Hidratação
  avg_water_intake_liters: z.number()
    .min(0, "Mínimo 0 litros")
    .max(10, "Máximo 10 litros"),
  
  water_intake_score: z.number().min(1).max(10),
  
  // Sono
  avg_sleep_hours: z.number()
    .min(0, "Mínimo 0 horas")
    .max(16, "Máximo 16 horas"),
  
  sleep_score: z.number().min(1).max(10),
  sleep_quality_score: z.number().min(1).max(10),
  
  // Alimentação
  had_cheat_meal: z.boolean(),
  cheat_meal_content: z.string().optional(),
  cheat_meal_score: z.number().min(1).max(10),
  
  had_snack: z.boolean(),
  snack_content: z.string().optional(),
  snack_score: z.number().min(1).max(10),
  
  // Bem-estar
  stress_level: z.number().min(1).max(10),
  stress_score: z.number().min(1).max(10),
  libido_level: z.number().min(1).max(10),
  libido_score: z.number().min(1).max(10),
  
  // Geral
  current_main_goal: z.string()
    .min(5, "Objetivo deve ter pelo menos 5 caracteres")
    .max(200, "Objetivo deve ter no máximo 200 caracteres"),
  
  difficulties_faced: z.string().optional(),
  
  overall_score: z.number().min(1).max(10)
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type PlanFormData = z.infer<typeof planSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;