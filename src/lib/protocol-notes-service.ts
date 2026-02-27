import { supabase } from '@/integrations/supabase/client';

export interface ProtocolNote {
    id: string;
    telefone: string;
    content: string;
    author_name: string;
    author_id: string;
    created_at: string;
    updated_at: string;
}

export const protocolNotesService = {
    async getNotes(telefone: string): Promise<ProtocolNote[]> {
        const { data, error } = await supabase
            .from('protocol_notes' as any)
            .select('*')
            .eq('telefone', telefone)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching protocol notes:', error);
            throw error;
        }

        return (data || []) as unknown as ProtocolNote[];
    },

    async addNote(telefone: string, content: string, authorName: string): Promise<ProtocolNote> {
        const { data, error } = await supabase
            .from('protocol_notes' as any)
            .insert({
                telefone,
                content,
                author_name: authorName,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding protocol note:', error);
            throw error;
        }

        return data as unknown as ProtocolNote;
    },

    async updateNote(id: string, content: string): Promise<ProtocolNote> {
        const { data, error } = await supabase
            .from('protocol_notes' as any)
            .update({
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating protocol note:', error);
            throw error;
        }

        return data as unknown as ProtocolNote;
    },

    async deleteNote(id: string): Promise<void> {
        const { error } = await supabase
            .from('protocol_notes' as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting protocol note:', error);
            throw error;
        }
    },
};
