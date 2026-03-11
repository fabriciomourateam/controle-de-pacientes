import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // Para tentar pegar a definição, vamos tentar dar select * from pg_views via rpc se existir
    // Como a RPC falhou antes, vamos apenas inserir dados e ver onde quebra? Não!
    
    // Provavelmente a view user_profiles faz um join entre public.profiles (que deve estar vazia para alguns) e auth.users.
    
    // Vamos listar os 4 usuários que não estão na user_profiles
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const { data: userProfiles } = await supabase.from('user_profiles').select('id');
    const userProfileIds = new Set(userProfiles?.map(u => u.id) || []);
    const missingInUserProfiles = usersData?.users.filter(u => !userProfileIds.has(u.id)) || [];
    
    console.log("Missing Users Info:");
    for(const u of missingInUserProfiles) {
       console.log(`- ID: ${u.id}, Email: ${u.email}, Created: ${u.created_at}`);
       // verify if they are in profiles
       const {data: pf} = await supabase.from('profiles').select('*').eq('id', u.id).single();
       console.log(`  in profiles? ${!!pf}`);
    }
}

main();
