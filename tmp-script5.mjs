import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
    
    let report = [];
    for(const u of missingInUserProfiles) {
       const {data: pf} = await supabase.from('profiles').select('*').eq('id', u.id).single();
       report.push({ email: u.email, uid: u.id, in_profiles: !!pf });
    }
    
    fs.writeFileSync('missing_users.json', JSON.stringify(report, null, 2));
    console.log("Done. Check missing_users.json");
}

main();
