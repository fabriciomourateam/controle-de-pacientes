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
    VERSIONS: '@fmteam:pop_versions',
    SESSIONS: '@fmteam:pop_sessions',
    CURRENT_USER_ID: '@fmteam:pop_current_user_id'
};

export const popService = {
    // --- USER MANGEMENT (Mock) ---
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

    // --- VERSION MANAGEMENT (Mock) ---
    getVersions: (): PopVersion[] => {
        const data = localStorage.getItem(STORAGE_KEYS.VERSIONS);
        return data ? JSON.parse(data) : [];
    },

    getActiveVersion: (): PopVersion | null => {
        const versions = popService.getVersions();
        return versions.find(v => v.is_active) || versions[0] || null;
    },

    saveVersion: (version: PopVersion) => {
        const versions = popService.getVersions();
        const existingIndex = versions.findIndex(v => v.id === version.id);

        // If setting to active, deactivate others
        if (version.is_active) {
            versions.forEach(v => v.is_active = false);
        }

        if (existingIndex >= 0) {
            versions[existingIndex] = version;
        } else {
            versions.push(version);
        }

        localStorage.setItem(STORAGE_KEYS.VERSIONS, JSON.stringify(versions));
    },

    // --- SESSION MANAGEMENT (Mock) ---
    getSessions: (): PopSession[] => {
        const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        return data ? JSON.parse(data) : [];
    },

    getSessionId: (id: string): PopSession | null => {
        return popService.getSessions().find(s => s.id === id) || null;
    },

    saveSession: (session: PopSession) => {
        const sessions = popService.getSessions();
        const existingIndex = sessions.findIndex(s => s.id === session.id);

        session.updated_at = new Date().toISOString();

        if (existingIndex >= 0) {
            sessions[existingIndex] = session;
        } else {
            sessions.push(session);
        }

        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    },

    // --- PATIENTS INTEGRATION (Real DB but minimal fetch) ---
    getPatientsForMock: async () => {
        try {
            const { data, error } = await supabase
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
            const { data: patient } = await supabase
                .from('patients')
                .select('nome, data_nascimento, genero, telefone, altura_inicial, peso_inicial')
                .eq('id', patientId)
                .single() as any;

            if (patient) {
                result.name = patient.nome;
                if (patient.altura_inicial) result.height = Number(patient.altura_inicial);
                if (patient.peso_inicial) result.weight = Number(patient.peso_inicial);
            }

            const telefone = patient?.telefone;

            // 2. Fetch Latest Evolution for Weight, Height, TMB
            if (telefone) {
                const { data: latestEvo } = await supabase
                    .from('body_composition')
                    .select('peso, tmb')
                    .eq('telefone', telefone)
                    .order('data_avaliacao', { ascending: false })
                    .limit(1)
                    .single() as any;

                if (latestEvo) {
                    if (latestEvo.peso) result.weight = Number(latestEvo.peso);
                    if (latestEvo.tmb) result.tmb = Number(latestEvo.tmb);
                }
            }

            // 3. Fetch Anamnesis for Preferences and Habits
            const { data: anamnesis } = await supabase
                .from('patient_anamnesis')
                .select('data')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single() as any;

            if (anamnesis && anamnesis.data) {
                const resp = anamnesis.data as Record<string, any>;

                // Extract relevant fields based on typical anamnesis structure (mapping the Portuguese keys)
                result.objective = resp.objetivo || resp.objective || "";
                result.intolerances = resp.alergias_alimentares || resp.intolerancias || resp.intolerances || "";

                // Routine
                result.wake_time = resp.horario_acordar || resp.wake_up_time || "";
                result.sleep_time = resp.horario_dormir || resp.sleep_time || "";
                result.work_time = resp.rotina_trabalho || resp.work_routine || "";
                result.training_time = resp.horario_treino || resp.training_time || "";
                result.highest_hunger_time = resp.pico_fome || resp.peak_hunger_time || "";

                // Preferences
                result.likes = resp.alimentos_favoritos || resp.alimentos_gosta || resp.foods_liked || "";
                result.dislikes = resp.alimentos_nao_gosta || resp.foods_disliked || "";
                result.must_have = resp.alimentos_indispensaveis || resp.indispensable_foods || "";
                result.supplements = resp.suplementos_atuais || resp.supplements || "";
                result.current_habits = resp.habitos_alimentares || resp.eating_habits || "";

                // Weighs food
                result.can_weigh_food = resp.pesa_alimentos === 'yes' || resp.can_weigh_food === true;
            }

            return result;
        } catch (err) {
            console.error("Error fetching detailed patient case data", err);
            return {};
        }
    }
};
