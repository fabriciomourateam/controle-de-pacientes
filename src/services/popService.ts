import {
    PopUser,
    PopVersion,
    PopSession,
    PopSessionStatus,
    PopPatientCase
} from '@/types/pop';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEYS = {
    USERS: '@fmteam:pop_users',
    CURRENT_USER_ID: '@fmteam:pop_current_user_id'
};

export const popService = {
    // --- USER MANGEMENT (Mock) ---
    // Kept local to allow easy role-switching during training/testing
    getUsers: (): PopUser[] => {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
    },

    getCurrentUser: (): PopUser | null => {
        const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
        if (!id) return null;
        return popService.getUsers().find(u => u.id === id) || null;
    },

    setCurrentUser: (id: string) => {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    },

    // --- VERSION MANAGEMENT (Supabase) ---
    getVersions: async (): Promise<PopVersion[]> => {
        const { data, error } = await (supabase as any)
            .from('pop_versions')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) {
            console.error("Error fetching POP versions", error);
            return [];
        }
        return data as PopVersion[];
    },

    getActiveVersion: async (): Promise<PopVersion | null> => {
        const { data, error } = await (supabase as any)
            .from('pop_versions')
            .select('*')
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching active POP version", error);
            return null;
        }
        return data && data.length > 0 ? (data[0] as PopVersion) : null;
    },

    saveVersion: async (version: PopVersion) => {
        if (version.is_active) {
            await (supabase as any)
                .from('pop_versions')
                .update({ is_active: false })
                .neq('id', version.id); // Deactivate all others
        }

        const { error } = await (supabase as any)
            .from('pop_versions')
            .upsert({
                id: version.id,
                version: version.version,
                published_at: version.published_at,
                author_id: version.author_id,
                changelog: version.changelog,
                is_active: version.is_active,
                steps: version.steps as any,
                checklist_categories: version.checklist_categories as any,
                checklist_items: version.checklist_items as any,
                common_errors: version.common_errors as any
            });

        if (error) {
            console.error("Error saving POP version", error);
            throw error;
        }
    },

    // --- SESSION MANAGEMENT (Supabase) ---
    getSessions: async (): Promise<PopSession[]> => {
        const { data, error } = await (supabase as any)
            .from('pop_sessions')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error("Error fetching POP sessions", error);
            return [];
        }
        return data as PopSession[];
    },

    getSessionId: async (id: string): Promise<PopSession | null> => {
        const { data, error } = await (supabase as any)
            .from('pop_sessions')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching POP session", error);
            return null;
        }
        return data as PopSession || null;
    },

    saveSession: async (session: PopSession) => {
        session.updated_at = new Date().toISOString();

        const { error } = await (supabase as any)
            .from('pop_sessions')
            .upsert({
                id: session.id,
                version_id: session.version_id,
                intern_id: session.intern_id,
                supervisor_id: session.supervisor_id,
                created_at: session.created_at,
                updated_at: session.updated_at,
                status: session.status,
                patient_case: session.patient_case as any,
                completed_step_ids: session.completed_step_ids as any,
                step_notes: session.step_notes as any,
                intern_general_notes: session.intern_general_notes,
                intern_questions: session.intern_questions,
                checked_item_ids: session.checked_item_ids as any,
                supervisor_feedback: session.supervisor_feedback,
                supervisor_adjustments: session.supervisor_adjustments,
                score: session.score
            });

        if (error) {
            console.error("Error saving POP session", error);
            throw error;
        }
    },

    deleteSession: async (sessionId: string) => {
        const { error } = await (supabase as any)
            .from('pop_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) {
            console.error("Error deleting POP session", error);
            throw error;
        }
    },

    // --- PATIENTS INTEGRATION (Real DB but minimal fetch) ---
    getPatientsForMock: async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('patients')
                .select('id, nome')
                .order('nome')
                .limit(2000);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Error fetching patients for POP", err);
            return [];
        }
    },

    fetchPatientCaseData: async (patientId: string): Promise<Partial<PopPatientCase>> => {
        try {
            const result: Partial<PopPatientCase> = {};

            // 1. Fetch Patient Info
            const { data: patient } = await (supabase as any)
                .from('patients')
                .select('nome, data_nascimento, genero, telefone, altura_inicial, peso_inicial')
                .eq('id', patientId)
                .maybeSingle() as any;

            if (patient) {
                result.name = patient.nome;
                if (patient.altura_inicial) result.height = Number(patient.altura_inicial);
                if (patient.peso_inicial) result.weight = Number(patient.peso_inicial);
            }

            const telefone = patient?.telefone;

            // 2. Fetch Latest Evolution for Weight, Height, TMB
            if (telefone) {
                const { data: latestEvo } = await (supabase as any)
                    .from('body_composition')
                    .select('peso, tmb')
                    .eq('telefone', telefone)
                    .order('data_avaliacao', { ascending: false })
                    .limit(1)
                    .maybeSingle() as any;

                if (latestEvo) {
                    if (latestEvo.peso) result.weight = Number(latestEvo.peso);
                    if (latestEvo.tmb) result.tmb = Number(latestEvo.tmb);
                }
            }

            // 3. Fetch Anamnesis for Preferences and Habits
            const { data: anamnesis } = await (supabase as any)
                .from('patient_anamnesis')
                .select('data')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle() as any;

            if (anamnesis && anamnesis.data) {
                const resp = anamnesis.data as Record<string, any>;

                result.objective = resp.objetivo || resp.objective || "";
                result.intolerances = resp.alergias_alimentares || resp.intolerancias || resp.intolerances || "";
                result.wake_time = resp.horario_acordar || resp.wake_up_time || "";
                result.sleep_time = resp.horario_dormir || resp.sleep_time || "";
                result.work_time = resp.rotina_trabalho || resp.work_routine || "";
                result.training_time = resp.horario_treino || resp.training_time || "";
                result.highest_hunger_time = resp.pico_fome || resp.peak_hunger_time || "";
                result.likes = resp.alimentos_favoritos || resp.alimentos_gosta || resp.foods_liked || "";
                result.dislikes = resp.alimentos_nao_gosta || resp.foods_disliked || "";
                result.must_have = resp.alimentos_indispensaveis || resp.indispensable_foods || "";
                result.supplements = resp.suplementos_atuais || resp.supplements || "";
                result.current_habits = resp.habitos_alimentares || resp.eating_habits || "";
                result.can_weigh_food = resp.pesa_alimentos === 'yes' || resp.can_weigh_food === true;
            }

            return result;
        } catch (err) {
            console.error("Error fetching detailed patient case data", err);
            return {};
        }
    }
};
