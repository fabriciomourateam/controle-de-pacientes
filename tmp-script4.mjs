import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const { data: userProfiles } = await supabase.from('user_profiles').select('id');
    const userProfileIds = new Set(userProfiles?.map(u => u.id) || []);
    const missingInUserProfiles = usersData?.users.filter(u => !userProfileIds.has(u.id)) || [];
    
    for(const u of missingInUserProfiles) {
       console.log(`Missing User: ${u.email} (ID: ${u.id})`);
       const {data: pf} = await supabase.from('profiles').select('*').eq('id', u.id).single();
       if (pf) {
          console.log(` -> Found in profiles: YES!`);
       } else {
          console.log(` -> Found in profiles: NO!`);
       }
    }
}

main();
