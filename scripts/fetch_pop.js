const fs = require('fs');
const dotenv = require('dotenv');

const envLocal = dotenv.parse(fs.readFileSync('.env.local'));
const supabaseUrl = envLocal.VITE_SUPABASE_URL;
const supabaseKey = envLocal.VITE_SUPABASE_ANON_KEY;

async function check() {
    const response = await fetch(`${supabaseUrl}/rest/v1/pop_versions?select=id,version,is_active,published_at`, {
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        }
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error);
