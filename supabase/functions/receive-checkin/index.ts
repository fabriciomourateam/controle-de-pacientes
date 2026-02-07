// Edge Function: receive-checkin
// Recebe POST do Typebot/n8n, normaliza telefone, busca paciente (telefone ou nome). Não cria paciente novo.
// Só insere check-in se encontrar um paciente. Uso: POST com body JSON { telefone, nome?, peso?, mes_ano?, ... }

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function normalizePhone(phone: string): string {
  const numbersOnly = phone.replace(/\D/g, "");
  let clean = numbersOnly;
  if (numbersOnly.startsWith("55") && numbersOnly.length > 10) {
    clean = numbersOnly.substring(2);
  }
  if (clean.length === 11 && clean.startsWith("9")) {
    clean = clean.substring(1);
  }
  return clean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Método não permitido" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const rawPhone = body.telefone ?? body.Telefone ?? body.phone ?? "";
    if (!rawPhone || String(rawPhone).trim() === "") {
      return new Response(
        JSON.stringify({ success: false, error: "Campo 'telefone' é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const normalizedPhone = normalizePhone(String(rawPhone));

    // 1) Buscar paciente: telefone exato, depois telefone_filtro, depois últimos 8 dígitos
    let patient: { id: string; telefone: string; user_id?: string | null } | null = null;

    const { data: byPhone } = await supabase
      .from("patients")
      .select("id, telefone, user_id")
      .eq("telefone", normalizedPhone)
      .maybeSingle();
    if (byPhone) patient = byPhone as any;

    if (!patient) {
      const { data: byFiltro } = await supabase
        .from("patients")
        .select("id, telefone, user_id")
        .eq("telefone_filtro", normalizedPhone)
        .maybeSingle();
      if (byFiltro) patient = byFiltro as any;
    }

    if (!patient && normalizedPhone.length >= 8) {
      const last8 = normalizedPhone.slice(-8);
      const { data: list } = await supabase
        .from("patients")
        .select("id, telefone, user_id")
        .like("telefone", `%${last8}`);
      if (list && list.length > 0) patient = list[0] as any;
    }

    // 2) Se ainda não achou: buscar por nome (ilike, primeiro resultado)
    const rawNome = (body.nome ?? body.Nome ?? "").trim();
    if (!patient && rawNome.length >= 2) {
      const { data: listByName } = await supabase
        .from("patients")
        .select("id, telefone, user_id")
        .ilike("nome", `%${rawNome}%`)
        .limit(1);
      if (listByName?.length) patient = listByName[0] as any;
    }

    // Não cria paciente novo: se não encontrou, retorna sucesso mas sem inserir check-in
    if (!patient) {
      return new Response(
        JSON.stringify({
          success: true,
          patient_matched: false,
          checkin_id: null,
          message: "Paciente não encontrado (telefone e nome). Verifique o cadastro. Check-in não foi criado.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const telefoneParaCheckin = patient.telefone;

    // 3) Montar linha do check-in
    const now = new Date();
    const dataCheckin = body.data_checkin ?? body["Data do check-in"] ?? now.toISOString().split("T")[0];
    const mesAno = body.mes_ano ?? body["Mês/Ano"] ?? `${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;

    const checkinRow: Record<string, unknown> = {
      telefone: telefoneParaCheckin,
      mes_ano: String(mesAno),
      data_checkin: String(dataCheckin).split("T")[0],
      data_preenchimento: body.data_preenchimento ?? now.toISOString(),
    };

    const optionalFields = [
      "peso", "medida", "treino", "cardio", "agua", "sono", "ref_livre", "beliscos",
      "oq_comeu_ref_livre", "oq_beliscou", "comeu_menos", "fome_algum_horario",
      "alimento_para_incluir", "melhora_visual", "quais_pontos", "objetivo",
      "dificuldades", "stress", "libido", "tempo", "descanso", "tempo_cardio",
      "foto_1", "foto_2", "foto_3", "foto_4", "telefone_checkin",
      "pontos_treinos", "pontos_cardios", "pontos_descanso_entre_series",
      "pontos_refeicao_livre", "pontos_beliscos", "pontos_agua", "pontos_sono",
      "pontos_qualidade_sono", "pontos_stress", "pontos_libido",
      "total_pontuacao", "percentual_aproveitamento",
    ];

    for (const field of optionalFields) {
      const v = body[field] ?? body[field.replace(/_/g, " ")];
      if (v !== undefined && v !== null) checkinRow[field] = String(v);
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("checkin")
      .insert(checkinRow)
      .select("id")
      .single();

    if (insertErr) {
      return new Response(
        JSON.stringify({ success: false, error: insertErr.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        patient_matched: true,
        checkin_id: inserted?.id,
        message: "Check-in criado e vinculado ao paciente.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
