import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data: tm } = await supabase.from('team_members').select('*');
    console.log("Team members:", tm.map(t => ({name: t.name, email: t.email})));
}
main();
