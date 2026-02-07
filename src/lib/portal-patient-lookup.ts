/**
 * Utilitário para o app dos alunos (portal do paciente).
 * Identifica o paciente pelo telefone no Supabase, aceitando:
 * - Com ou sem 55 (código do país)
 * - Com ou sem formatação: (62) 99914-9439, 62 999149439, etc.
 * - Apenas números: 62999149439
 *
 * Use a mesma instância do Supabase com chave ANON (não service role).
 * RLS: o paciente só é retornado se o telefone tiver um link ativo
 * (token em patient_portal_tokens) criado no painel do nutricionista.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface PatientRow {
  id: string;
  telefone: string;
  nome: string | null;
  [key: string]: unknown;
}

/**
 * Normaliza o telefone para tentativas de busca.
 * Retorna várias variantes para aumentar a chance de match no banco.
 */
export function getPhoneVariants(input: string): string[] {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10) return [];

  // Sem código do país (padrão Brasil)
  let local = digits;
  if (digits.startsWith('55') && digits.length > 10) {
    local = digits.slice(2);
  }
  // Celular Brasil: 9 dígitos após DDD; alguns bancos guardam com 9 na frente
  const with9 = local.length === 10 && !local.startsWith('9') ? '9' + local : local;
  const without9 = local.length === 11 && local.startsWith('9') ? local.slice(1) : null;

  const variants: string[] = [];
  // Só números (10 ou 11 dígitos)
  variants.push(local);
  if (local.length === 11) variants.push(local);
  if (with9 !== local) variants.push(with9);
  if (without9) variants.push(without9);
  // Com 55 na frente (alguns bancos guardam assim)
  if (local.length === 11) variants.push('55' + local);
  if (local.length === 10) variants.push('55' + local);
  // Com formatação (11) 99999-9999
  if (local.length === 11) {
    variants.push(`(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`);
  }
  if (local.length === 10) {
    variants.push(`(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`);
  }
  // Últimos 8 dígitos (para LIKE)
  if (local.length >= 8) {
    variants.push(local.slice(-8));
  }

  return [...new Set(variants)];
}

/**
 * Busca o paciente pelo telefone, tentando várias variantes.
 * Use no app dos alunos com o cliente Supabase (anon key).
 * Retorna o paciente e o telefone exato do banco (use para checkins, dieta, etc.)
 * ou null se não encontrar (ou se RLS bloquear por não ter link ativo).
 */
export async function findPatientByPhone(
  supabase: SupabaseClient,
  phoneInput: string
): Promise<{ patient: PatientRow; telefone: string } | null> {
  const variants = getPhoneVariants(phoneInput);
  if (variants.length === 0) return null;

  // 1) Busca exata por cada variante (exceto a de 8 dígitos)
  const exactVariants = variants.filter((v) => v.length >= 10);
  for (const phone of exactVariants) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, telefone, nome, *')
      .eq('telefone', phone)
      .maybeSingle();

    if (!error && data) {
      return { patient: data as PatientRow, telefone: (data as PatientRow).telefone };
    }
  }

  // 2) Busca por últimos 8 dígitos (ilike)
  const last8 = variants.find((v) => v.length === 8);
  if (last8) {
    const { data, error } = await supabase
      .from('patients')
      .select('id, telefone, nome, *')
      .ilike('telefone', `%${last8}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return { patient: data as PatientRow, telefone: (data as PatientRow).telefone };
    }
  }

  return null;
}

/**
 * Normaliza para exibição (apenas números, sem 55).
 * Útil para comparar ou exibir de forma consistente.
 */
export function normalizePhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length > 10) return digits.slice(2);
  return digits;
}
