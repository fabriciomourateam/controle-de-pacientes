import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data: usersData, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching auth.users:", error);
        return;
    }

    const { data: userProfiles } = await supabase.from('user_profiles').select('id, email, created_at');
    const { data: profiles } = await supabase.from('profiles').select('id, email, created_at, name');
    
    console.log(`Total in auth.users: ${usersData.users.length}`);
    console.log(`Total in user_profiles: ${userProfiles?.length}`);
    console.log(`Total in profiles: ${profiles?.length}`);
    
    // Identificar usuários do auth que não estão no user_profiles
    const userProfileIds = new Set(userProfiles?.map(u => u.id) || []);
    const missingInUserProfiles = usersData.users.filter(u => !userProfileIds.has(u.id));
    
    console.log("\nUsers in auth.users NOT in user_profiles:");
    missingInUserProfiles.forEach(u => console.log(`- ${u.email} (created: ${u.created_at})`));

    // Identificar usuários do auth que não estão em profiles
    const profilesIds = new Set(profiles?.map(p => p.id) || []);
    const missingInProfiles = usersData.users.filter(u => !profilesIds.has(u.id));
    
    console.log("\nUsers in auth.users NOT in profiles:");
    missingInProfiles.forEach(u => console.log(`- ${u.email} (created: ${u.created_at})`));
}

main();
