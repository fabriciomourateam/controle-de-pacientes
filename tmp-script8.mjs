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
    console.log("auth.users count:", usersData?.users?.length);
    
    // Contar the user_profiles properly.
    const { count: countUserProfiles } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true });
    console.log("user_profiles count:", countUserProfiles);
}
main();
