export type PopRole = 'admin' | 'supervisor' | 'intern';

export interface PopUser {
    id: string;
    name: string;
    role: PopRole;
    avatar_url?: string;
}

export interface PopStep {
    id: string;
    title: string;
    content: string; // HTML or Markdown
    is_active: boolean;
    order: number;
}

export interface PopChecklistCategory {
    id: string;
    name: string;
    weight: number;
}

export interface PopChecklistItem {
    id: string;
    category_id: string;
    text: string;
    is_mandatory: boolean;
}

export interface PopCommonError {
    id: string;
    title: string;
    impact: string;
    how_to_avoid: string;
    prevention_checklist: string[];
}

export interface PopVersion {
    id: string;
    version: string;
    published_at: string;
    author_id: string;
    changelog: string;
    is_active: boolean;

    // The actual content at the time of this version
    steps: PopStep[];
    checklist_categories: PopChecklistCategory[];
    checklist_items: PopChecklistItem[];
    common_errors: PopCommonError[];
}

export type PopSessionStatus = 'draft' | 'in_progress' | 'ready_for_review' | 'in_correction' | 'approved';

export interface PopPatientCase {
    patient_id: string;
    name: string;
    objective: string;
    weight: number;
    height: number;
    tmb: number;
    get_base: number;
    can_weigh_food: boolean;
    intolerances: string;
    wake_time: string;
    work_time: string;
    study_time: string;
    training_time: string;
    sleep_time: string;
    highest_hunger_time: string;
    lowest_hunger_time: string;
    likes: string;
    dislikes: string;
    must_have: string;
    supplements: string;
    current_habits: string;
    observations: string;
}

export interface PopSession {
    id: string;
    version_id: string; // Which POP version this session used
    intern_id: string;
    supervisor_id?: string;
    created_at: string;
    updated_at: string;
    status: PopSessionStatus;

    patient_case: PopPatientCase;

    // Execution tracking
    completed_step_ids: string[];
    step_notes: Record<string, string>; // step_id -> note
    intern_general_notes: string;
    intern_questions: string;

    // Checklist execution
    checked_item_ids: string[];

    // Supervisor Review
    supervisor_feedback: string;
    supervisor_adjustments: string;
    score: number;
}
