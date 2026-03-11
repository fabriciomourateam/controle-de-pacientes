import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await supabase.rpc('query_schema', {
        query_text: `
      SELECT column_name, data_type, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name IN ('patients', 'checkin', 'patient_anamnesis')
      AND data_type IN ('numeric', 'decimal', 'real', 'double precision', 'integer', 'smallint')
    `
    });

    if (error) {
        // If we don't have this RPC, let's just make a REST call to PostgREST using exact types route or something.
        console.error("RPC failed, maybe missing.", error);

        // An alternative way via direct fetch to Supabase API describing tables, if needed.
    } else {
        console.log(data);
    }
}

main();
