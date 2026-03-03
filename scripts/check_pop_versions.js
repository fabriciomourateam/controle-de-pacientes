import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in env vars.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVersions() {
    const { data, error } = await supabase.from('pop_versions').select('id, version, is_active, published_at');
    if (error) {
        console.error("Error fetching pop_versions:", error);
    } else {
        console.log("POP Versions found:");
        console.log(JSON.stringify(data, null, 2));
    }
}

checkVersions();
