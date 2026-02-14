import { supabase } from "@/integrations/supabase/client";

export interface WorkspacePerson {
    id: string
    name: string
    color: string
}

export interface WorkspaceSchedule {
    id: string
    week_start_date: string
    day_of_week: number
    hour: number
    person_name: string | null
    person_id: string | null
    task_description: string | null
    created_at: string
    updated_at: string
    people?: WorkspacePerson | null // Computed/Joined
}

export const STANDARD_WEEK_DATE = '2000-01-01'; // Sentinel date for Standard Week

export const workspaceService = {
    // --- PEOPLE MANAGEMENT ---
    async getPeople() {
        const { data, error } = await supabase
            .from('workspace_people')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as WorkspacePerson[];
    },

    async addPerson(name: string, color: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('workspace_people')
            .insert({ name, color, created_by: user.id })
            .select()
            .single();

        if (error) throw error;
        return data as WorkspacePerson;
    },

    async deletePerson(id: string) {
        const { error } = await supabase
            .from('workspace_people')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- SCHEDULE MANAGEMENT ---
    async getSchedules(weekStartDate: string) {
        // Fetch schedules and join with people
        const { data, error } = await supabase
            .from('workspace_schedules')
            .select(`
        *,
        people:person_id (
          id,
          name,
          color
        )
      `)
            .eq('week_start_date', weekStartDate);

        if (error) throw error;

        // Manual mapping if needed, but Supabase returns nested objects
        // We cast to WorkspaceSchedule to help TS separate the joined data
        return data as unknown as WorkspaceSchedule[];
    },

    async saveSchedule(schedule: Partial<WorkspaceSchedule>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('workspace_schedules')
            .upsert({
                ...schedule,
                created_by: user.id,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'week_start_date,day_of_week,hour'
            })
            .select();

        if (error) throw error;
        return data;
    },

    async deleteSchedule(id: string) {
        const { error } = await supabase
            .from('workspace_schedules')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async clearSchedule(weekStartDate: string, day: number, hour: number) {
        const { error } = await supabase
            .from('workspace_schedules')
            .delete()
            .eq('week_start_date', weekStartDate)
            .eq('day_of_week', day)
            .eq('hour', hour);

        if (error) throw error;
    },

    async importFromStandard(targetWeekDate: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const standardSchedules = await this.getSchedules(STANDARD_WEEK_DATE);

        if (!standardSchedules.length) return [];

        const newSchedules = standardSchedules.map(s => ({
            week_start_date: targetWeekDate,
            day_of_week: s.day_of_week,
            hour: s.hour,
            person_name: s.person_name, // Legacy support
            person_id: s.person_id,     // New support
            task_description: s.task_description,
            created_by: user.id
        }));

        const { data, error } = await supabase
            .from('workspace_schedules')
            .upsert(newSchedules, {
                onConflict: 'week_start_date,day_of_week,hour'
            })
            .select();

        if (error) throw error;
        return data;
    }
};
