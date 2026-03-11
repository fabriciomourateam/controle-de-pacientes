import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const phone = '553298594007';

    // Try 'users'
    const { data: users } = await supabase.from('users').select('id, phone').eq('phone', phone);
    let userId = users?.[0]?.id;

    if (!userId) {
        const { data: pts } = await supabase.from('patients').select('id, phone, name').eq('phone', phone);
        if (pts && pts.length > 0) {
            userId = pts[0].id;
            console.log('Found in patients. Nome:', pts[0].name);
        }
    }

    if (userId) {
        console.log('Paciente ID:', userId);
        const { data: plans } = await supabase.from('diet_plans').select('id, name, created_at, active').eq('patient_id', userId).order('created_at', { ascending: false });
        if (plans && plans.length > 0) {
            for (const p of plans) {
                console.log(`\nPlano: ${p.name} (Ativo: ${p.active}) | ID: ${p.id}`);
                const { data: meals } = await supabase
                    .from('diet_meals')
                    .select('id, meal_name, meal_order, created_at')
                    .eq('diet_plan_id', p.id)
                    .order('meal_order');
                console.log(' Refeições cadastradas:', meals);

                for (const m of (meals || [])) {
                    const { data: foods } = await supabase
                        .from('diet_foods')
                        .select('id, food_name')
                        .eq('meal_id', m.id);
                    console.log(`  - ${m.meal_name}: ${foods ? foods.length : 0} alimentos`);
                }
            }
        } else {
            console.log('Nenhum plano encontrado.');
        }
    } else {
        console.log('Paciente não encontrado.');
    }
}

check().catch(console.error);
