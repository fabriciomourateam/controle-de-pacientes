import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { DietAdjustmentPromptTemplate } from '@/lib/diet-ai-adjustment-service';

interface CacheEntry {
    templates: DietAdjustmentPromptTemplate[];
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let templateCache: CacheEntry | null = null;

export const useDietAdjustmentTemplates = () => {
    const [templates, setTemplates] = useState<DietAdjustmentPromptTemplate[]>([]);
    const [activeTemplate, setActiveTemplateState] = useState<DietAdjustmentPromptTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchedRef = useRef(false);

    const fetchTemplates = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && templateCache && Date.now() - templateCache.timestamp < CACHE_TTL) {
            setTemplates(templateCache.templates);
            const active = templateCache.templates.find(t => t.is_active);
            setActiveTemplateState(active || null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('diet_adjustment_prompt_templates' as any)
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Erro ao buscar templates de ajuste:', error);
                setLoading(false);
                return;
            }

            const typedData = (data || []) as unknown as DietAdjustmentPromptTemplate[];
            templateCache = { templates: typedData, timestamp: Date.now() };
            setTemplates(typedData);

            const active = typedData.find(t => t.is_active);
            setActiveTemplateState(active || null);
        } catch (error) {
            console.error('Erro ao buscar templates:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!fetchedRef.current) {
            fetchedRef.current = true;
            fetchTemplates();
        }
    }, [fetchTemplates]);

    const saveTemplate = useCallback(async (
        template: Partial<DietAdjustmentPromptTemplate> & { name: string; prompt_template: string }
    ): Promise<DietAdjustmentPromptTemplate | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Não autenticado');

            const payload = {
                name: template.name,
                description: template.description || null,
                prompt_template: template.prompt_template,
                ai_model: template.ai_model || 'claude-sonnet-4-5-20250929',
                max_tokens: template.max_tokens || 4096,
                temperature: template.temperature || 0.3,
                user_id: user.id,
                updated_at: new Date().toISOString(),
            };

            let result;
            if (template.id) {
                const { data, error } = await supabase
                    .from('diet_adjustment_prompt_templates' as any)
                    .update(payload)
                    .eq('id', template.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                const { data, error } = await supabase
                    .from('diet_adjustment_prompt_templates' as any)
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }

            templateCache = null;
            await fetchTemplates(true);
            return result as unknown as DietAdjustmentPromptTemplate;
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            return null;
        }
    }, [fetchTemplates]);

    const setTemplateActive = useCallback(async (templateId: string): Promise<boolean> => {
        try {
            // Deactivate all
            await supabase
                .from('diet_adjustment_prompt_templates' as any)
                .update({ is_active: false })
                .neq('id', templateId);

            // Activate selected
            const { error } = await supabase
                .from('diet_adjustment_prompt_templates' as any)
                .update({ is_active: true })
                .eq('id', templateId);

            if (error) throw error;

            templateCache = null;
            await fetchTemplates(true);
            return true;
        } catch (error) {
            console.error('Erro ao ativar template:', error);
            return false;
        }
    }, [fetchTemplates]);

    const deleteTemplate = useCallback(async (templateId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('diet_adjustment_prompt_templates' as any)
                .delete()
                .eq('id', templateId);

            if (error) throw error;

            templateCache = null;
            await fetchTemplates(true);
            return true;
        } catch (error) {
            console.error('Erro ao deletar template:', error);
            return false;
        }
    }, [fetchTemplates]);

    return {
        templates,
        activeTemplate,
        loading,
        saveTemplate,
        setTemplateActive,
        deleteTemplate,
        refreshTemplates: () => fetchTemplates(true),
    };
};
