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
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(1);

    console.log("Error:", error);
    console.log("Data:", data);
    console.log("Type of data:", Array.isArray(data) ? 'Array' : typeof data);

    if (data && data.length > 0) {
        const active = data[0];
        console.log("active.version:", active.version);
    }
}

check().catch(console.error);
