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

    console.log("All Versions:", data);

    const v15 = data?.find(v => v.version === "v1.5" || v.version === "1.5");
    if (v15) {
        console.log("Found v1.5! Restoring...", v15.id);

        // Deactivate all
        await supabase.from('pop_versions').update({ is_active: false }).neq('id', 'dummy');

        // Activate v1.5
        const { data: updated, error: updErr } = await supabase
            .from('pop_versions')
            .update({ is_active: true })
            .eq('id', v15.id)
            .select();

        console.log("Restored:", updated, updErr);
    } else {
        console.log("v1.5 NOT FOUND in Database. It must have been on local storage or deleted.");
    }
}

check().catch(console.error);
