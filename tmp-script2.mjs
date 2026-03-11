import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // Buscar definição da view
    const { data: viewDef, error: viewErr } = await supabase.rpc('query_schema', {
        query_text: `
          SELECT table_name, view_definition 
          FROM information_schema.views 
          WHERE table_name = 'user_profiles'
        `
    });

    console.log("View definition:", viewDef);

    // Se não for uma view, buscar como tabela
    const { data: cols, error: colsErr } = await supabase.rpc('query_schema', {
        query_text: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_name = 'user_profiles'
        `
    });

    console.log("Table columns user_profiles:", cols);

    // Buscar triggers em auth.users
    const { data: triggers, error: triggersErr } = await supabase.rpc('query_schema', {
        query_text: `
          SELECT event_object_table, trigger_name, action_statement
          FROM information_schema.triggers
          WHERE event_object_table = 'users' OR event_object_table = 'profiles'
        `
    });
    
    console.log("\nTriggers on auth.users/profiles:", triggers);
    if(triggersErr) console.log("error", triggersErr);
}

main();
