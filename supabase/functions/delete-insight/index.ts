// Edge Function: delete-insight
// Deleta (soft delete) um insight, permitindo que admins apaguem de outros usuários.
// Uso: POST com body JSON { insight_id: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseDispatcher = createClient(supabaseUrl, serviceRoleKey);

        const { insight_id } = await req.json();

        if (!insight_id) {
            return new Response(
                JSON.stringify({ error: "insight_id is required" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Perform soft delete
        const { error } = await supabaseDispatcher
            .from('ai_insights_custom')
            .update({ is_hidden: true })
            .eq('id', insight_id);

        if (error) throw error;

        return new Response(
            JSON.stringify({ success: true, message: "Insight deleted successfully" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
