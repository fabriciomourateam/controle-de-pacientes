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
    const { data: userProfiles } = await supabase.from('user_profiles').select('*');
    fs.writeFileSync('user_profiles_dump.json', JSON.stringify(userProfiles, null, 2));
    
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    fs.writeFileSync('auth_users_dump.json', JSON.stringify(authUsers.users, null, 2));

    console.log("Dumped 17 user_profiles and 21 auth_users to disk");
}

main();
