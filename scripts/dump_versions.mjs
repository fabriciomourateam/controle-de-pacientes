import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('pop_versions')
        .select('id, version, is_active, published_at')
        .order('published_at', { ascending: false });

    fs.writeFileSync('all_versions.json', JSON.stringify(data, null, 2));
    console.log("Wrote fully to all_versions.json");
}

check().catch(console.error);
