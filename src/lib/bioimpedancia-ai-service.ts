import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// TYPES
// ============================================

export interface BioimpedanciaAIResult {
    percentual_gordura: number;
    classificacao: string;
    massa_gorda_kg: number;
    massa_magra_kg: number;
    imc: number;
    tmb: number;
    observacoes: string;
    confianca: 'alta' | 'media' | 'baixa';
    tokenUsage?: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
        estimated_cost_usd: number;
    };
}

export interface BioimpedanciaAIParams {
    telefone: string;
    checkinId?: string;
    customPhotoUrls?: string[];
    customPromptInstructions?: string;
}

export interface CheckinOption {
    id: string;
    data_checkin: string;
    peso: string | null;
    hasPhotos: boolean;
    photoCount: number;
}

interface PatientFullData {
    nome: string;
    idade: number | null;
    altura_inicial: number | null;
    peso_inicial: number | null;
    genero: string | null;
    data_nascimento: string | null;
    created_at: string;
    medida_cintura_inicial?: number | null;
    medida_quadril_inicial?: number | null;
}

interface CheckinFullData {
    id: string;
    data_checkin: string;
    peso: string | null;
    foto_1: string | null;
    foto_2: string | null;
    foto_3: string | null;
    foto_4: string | null;
    [key: string]: any;
}

interface BioHistoryData {
    data_avaliacao: string;
    percentual_gordura: number;
    peso: number;
    massa_gorda: number;
    massa_magra: number;
    imc: number;
    classificacao: string | null;
}

// ============================================
// PROMPT BUILDER
// ============================================

function calcularIdade(dataNascimento: string | null): number | null {
    if (!dataNascimento) return null;
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }
    return idade;
}

function formatMedidas(patient: PatientFullData): string {
    const medidas: string[] = [];
    if (patient.medida_cintura_inicial) medidas.push(`Cintura: ${patient.medida_cintura_inicial}cm`);
    if (patient.medida_quadril_inicial) medidas.push(`Quadril: ${patient.medida_quadril_inicial}cm`);
    return medidas.length > 0 ? medidas.join('\n') : 'Nenhuma medida informada';
}

function formatBioHistory(history: BioHistoryData[]): string {
    if (history.length === 0) return 'Nenhuma avaliação anterior registrada.';

    return history.map((bio, i) => {
        const data = new Date(bio.data_avaliacao).toLocaleDateString('pt-BR');
        return `${i + 1}. ${data}: ${bio.percentual_gordura}% BF | ${bio.peso}kg | IMC ${bio.imc.toFixed(1)} | ${bio.classificacao || 'Sem classificação'}`;
    }).join('\n');
}

function buildPrompt(
    patient: PatientFullData,
    checkin: CheckinFullData | null,
    bioHistory: BioHistoryData[],
    allCheckins: CheckinFullData[],
    customPromptInstructions?: string
): string {
    const idade = calcularIdade(patient.data_nascimento);
    const sexoLabel = patient.genero === 'M' ? 'Masculino' : patient.genero === 'F' ? 'Feminino' : 'Não informado';
    const pesoAtual = checkin?.peso ? parseFloat(checkin.peso) : (patient.peso_inicial || 0);
    const altura = patient.altura_inicial || 0;

    // Evolution tracking
    const pesoHistory = allCheckins
        .filter(c => c.peso)
        .slice(0, 6)
        .map(c => {
            const data = new Date(c.data_checkin).toLocaleDateString('pt-BR');
            return `${data}: ${c.peso}kg`;
        });

    const medidasSection = formatMedidas(patient);

    return `Você é um avaliador corporal inteligente especializado em estimar o percentual de gordura corporal (%BF) com base em fotos e dados antropométricos. Sua análise se baseia em conhecimento profundo de fisiologia muscular, tipos de fibra (I, IIa, IIx), composição corporal e biotipos (ectomorfo, mesomorfo, endomorfo).

CONTEXTO TÉCNICO:
- O músculo é composto por fibras (15-25%) e sarcoplasma (75-85%, que inclui água ~75%, glicogênio, gordura)
- Proteína ideal para manutenção/ganho muscular: 1.6-2.5g/kg/dia
- Análise visual considera: definição muscular, vascularização, separação entre grupos musculares, retenção hídrica, contornos musculares, dobras cutâneas visíveis

DADOS DO PACIENTE:
Nome: ${patient.nome}
Sexo: ${sexoLabel}
Idade: ${idade !== null ? `${idade} anos` : 'Não informado'}
Altura: ${altura ? `${altura}m` : 'Não informado'}
Peso Atual: ${pesoAtual ? `${pesoAtual}kg` : 'Não informado'}
Peso Inicial: ${patient.peso_inicial ? `${patient.peso_inicial}kg` : 'Não informado'}

MEDIDAS ATUAIS:
${medidasSection}

EVOLUÇÃO DE PESO (últimos check-ins):
${pesoHistory.length > 0 ? pesoHistory.join('\n') : 'Sem histórico de peso'}

BIOIMPEDÂNCIAS ANTERIORES:
${formatBioHistory(bioHistory)}

INSTRUÇÕES DE ANÁLISE:
1. Analise as fotos recebidas (frente, costas e/ou lateral)
2. Estime o percentual de gordura corporal visualmente, considerando:
   - Definição muscular e vascularização
   - Separação entre grupos musculares
   - Retenção hídrica e gordura subcutânea
   - Contornos musculares e volume
3. Classifique o shape como: "Percentual de gordura alto", "Percentual de gordura mediano", "Atlético", "Definido" ou "Extremamente Seco"
4. Compare com avaliações anteriores se disponíveis, mencionando a evolução
5. Dê uma justificativa visual clara, de fácil entendimento, amigável (não causar desconforto no paciente)
6. Sugira uma meta para %BF e direcionamento (perda de gordura, ganho muscular, recomposição)

FORMATO DE RESPOSTA - OBRIGATÓRIO retornar APENAS um JSON válido, sem texto adicional:
{
  "percentual_gordura": <número decimal, ex: 15.5>,
  "classificacao": "<Percentual de gordura alto | Percentual de gordura mediano | Atlético | Definido | Extremamente Seco>",
  "massa_gorda_kg": <calculado: peso * %gordura / 100>,
  "massa_magra_kg": <calculado: peso - massa_gorda>,
  "imc": <calculado: peso / (altura^2)>,
  "tmb": <calculado pela fórmula Mifflin-St Jeor, ${sexoLabel === 'Masculino' ? 'homem: 10*peso + 6.25*altura_cm - 5*idade + 5' : 'mulher: 10*peso + 6.25*altura_cm - 5*idade - 161'}>,
  "observacoes": "<RELATÓRIO COMPLETO no formato abaixo>",
  "confianca": "<alta | media | baixa>"
}

O campo "observacoes" deve conter o relatório completo neste formato:
🧾 Relatório de Avaliação Corporal
📆 Data: ${new Date().toLocaleDateString('pt-BR')}
🧍 Percentual de Gordura Estimado: [valor]%
🏅 Classificação do Shape: [classificação]

📍 OBJETIVO PRINCIPAL:
[Baseado na análise visual e dados, definir se o foco é perda de gordura, ganho muscular ou recomposição]

🧠 ESTRATÉGIA INICIAL:
[Sugestão de estratégia baseada nos dados e na análise visual${bioHistory.length > 0 ? ', comparando com avaliações anteriores' : ''}]

📊 Análise Visual:
[Justificativa detalhada, clara e motivadora dos indicadores visuais observados]

🎯 Meta Recomendada:
[Meta de %BF e direcionamento para os próximos meses]

IMPORTANTE:
- Seja preciso e use os dados fornecidos nos cálculos
- A estimativa é visual e aproximada - mencione isso
- Nunca invente valores irreais (ex: 3% BF natural)
- Se não houver fotos suficientes, indique confiança "baixa"
- Use linguagem clara, técnica e objetiva
- Retorne SOMENTE o JSON, sem markdown ou texto antes/depois

${customPromptInstructions ? `
INSTRUÇÕES ADICIONAIS DO AVALIADOR:
${customPromptInstructions}` : ''}`;
}

// ============================================
// PHOTO FETCHER
// ============================================

function extractGoogleDriveFileId(url: string): string | null {
    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) return null;
    // Match /d/{id}, ?id={id}, or id={id}
    const patterns = [
        /\/d\/([a-zA-Z0-9_-]+)/,
        /[?&]id=([a-zA-Z0-9_-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function getDirectImageUrl(url: string): string {
    const fileId = extractGoogleDriveFileId(url);
    if (fileId) {
        // lh3.googleusercontent.com serves images without CORS restrictions
        return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    }
    return url;
}

function loadImageViaCanvas(url: string): Promise<{ data: string; mediaType: string } | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timeout = setTimeout(() => {
            console.warn(`Timeout loading image: ${url}`);
            resolve(null);
        }, 15000);

        img.onload = () => {
            clearTimeout(timeout);
            try {
                const canvas = document.createElement('canvas');
                // Limit size to avoid huge base64 strings
                const maxDim = 1200;
                let w = img.naturalWidth;
                let h = img.naturalHeight;
                if (w > maxDim || h > maxDim) {
                    const ratio = Math.min(maxDim / w, maxDim / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(null); return; }
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                const base64 = dataUrl.split(',')[1];
                resolve({ data: base64, mediaType: 'image/jpeg' });
            } catch (e) {
                console.warn(`Canvas export failed for: ${url}`, e);
                resolve(null);
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            console.warn(`Failed to load image via img tag: ${url}`);
            resolve(null);
        };

        img.src = getDirectImageUrl(url);
    });
}

async function fetchPhotoAsBase64(url: string): Promise<{ data: string; mediaType: string } | null> {
    const directUrl = getDirectImageUrl(url);
    const isGoogleDrive = !!extractGoogleDriveFileId(url);

    // For Google Drive: use img+canvas approach (bypasses CORS)
    if (isGoogleDrive) {
        return loadImageViaCanvas(url);
    }

    // For Supabase/other URLs: try direct fetch first
    try {
        const response = await fetch(directUrl);
        if (!response.ok) {
            console.warn(`Fetch failed (${response.status}), trying canvas: ${url}`);
            return loadImageViaCanvas(url);
        }

        const blob = await response.blob();
        const contentType = blob.type || 'image/jpeg';

        if (!contentType.startsWith('image/')) {
            console.warn(`Skipping non-image: ${contentType} - ${url}`);
            return null;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({ data: base64, mediaType: contentType });
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        // Fallback to canvas approach
        return loadImageViaCanvas(url);
    }
}

async function fetchPhotos(urls: string[]): Promise<Array<{ data: string; mediaType: string }>> {
    const validUrls = urls.filter(u => u && u.trim() !== '');
    if (validUrls.length === 0) return [];

    const results = await Promise.allSettled(
        validUrls.map(url => fetchPhotoAsBase64(url))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<{ data: string; mediaType: string } | null> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter((v): v is { data: string; mediaType: string } => v !== null);
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

export async function analyzeBioimpedancia(
    params: BioimpedanciaAIParams,
    onProgress?: (step: string) => void
): Promise<BioimpedanciaAIResult> {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('Chave da API do Anthropic não configurada (VITE_ANTHROPIC_API_KEY)');
    }

    // Step 1: Fetch patient data
    onProgress?.('Buscando dados do paciente...');

    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('telefone', params.telefone)
        .single();

    if (patientError || !patient) {
        throw new Error('Paciente não encontrado');
    }

    // Step 2: Fetch check-ins
    onProgress?.('Carregando check-ins...');

    const { data: checkins } = await supabase
        .from('checkin')
        .select('id, data_checkin, peso, foto_1, foto_2, foto_3, foto_4')
        .eq('telefone', params.telefone)
        .order('data_checkin', { ascending: false })
        .limit(10);

    const allCheckins = (checkins || []) as unknown as CheckinFullData[];

    // Select target check-in (specific or latest)
    let targetCheckin: CheckinFullData | null = null;
    if (params.checkinId) {
        targetCheckin = allCheckins.find(c => c.id === params.checkinId) || null;
    }
    if (!targetCheckin && allCheckins.length > 0) {
        targetCheckin = allCheckins[0];
    }

    // Step 3: Fetch photos
    onProgress?.('Buscando fotos do check-in...');

    let photoUrls: string[] = [];
    if (params.customPhotoUrls && params.customPhotoUrls.length > 0) {
        photoUrls = params.customPhotoUrls;
    } else if (targetCheckin) {
        photoUrls = [
            targetCheckin.foto_1,
            targetCheckin.foto_2,
            targetCheckin.foto_3,
            targetCheckin.foto_4
        ].filter((u): u is string => !!u);
    }

    // If no check-in photos, try initial patient photos
    if (photoUrls.length === 0) {
        const patientAny = patient as any;
        const initialPhotos = [
            patientAny.foto_inicial_frente,
            patientAny.foto_inicial_lado,
            patientAny.foto_inicial_lado_2,
            patientAny.foto_inicial_costas,
        ].filter((u): u is string => !!u);
        photoUrls = initialPhotos;
    }

    if (photoUrls.length === 0) {
        throw new Error('Nenhuma foto encontrada para este paciente. É necessário pelo menos 1 foto para a análise visual.');
    }

    onProgress?.('Processando fotos...');
    const photos = await fetchPhotos(photoUrls);

    if (photos.length === 0) {
        throw new Error('Não foi possível carregar as fotos do paciente. Verifique se as URLs estão acessíveis.');
    }

    // Step 4: Fetch bio history
    onProgress?.('Carregando histórico de bioimpedâncias...');

    const { data: bioHistory } = await supabase
        .from('body_composition' as any)
        .select('data_avaliacao, percentual_gordura, peso, massa_gorda, massa_magra, imc, classificacao')
        .eq('telefone', params.telefone)
        .order('data_avaliacao', { ascending: false })
        .limit(5);

    // Step 5: Build prompt and call Claude
    onProgress?.('Analisando composição corporal com IA...');

    const patientData: PatientFullData = {
        nome: patient.nome,
        idade: calcularIdade(patient.data_nascimento),
        altura_inicial: (patient as any).altura_inicial || null,
        peso_inicial: (patient as any).peso_inicial || null,
        genero: patient.genero || null,
        data_nascimento: patient.data_nascimento || null,
        created_at: patient.created_at,
        medida_cintura_inicial: (patient as any).medida_cintura_inicial || null,
        medida_quadril_inicial: (patient as any).medida_quadril_inicial || null,
    };

    // Load custom prompt if available
    let customInstructions = params.customPromptInstructions;
    if (!customInstructions) {
        const savedPrompt = await getCustomPrompt();
        if (savedPrompt) customInstructions = savedPrompt;
    }

    const prompt = buildPrompt(
        patientData,
        targetCheckin,
        (bioHistory || []) as unknown as BioHistoryData[],
        allCheckins,
        customInstructions || undefined
    );

    const anthropic = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    const messageContent: Anthropic.MessageParam['content'] = [
        ...photos.map(photo => ({
            type: 'image' as const,
            source: {
                type: 'base64' as const,
                media_type: photo.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: photo.data,
            },
        })),
        { type: 'text' as const, text: prompt },
    ];

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 3000,
        messages: [{ role: 'user', content: messageContent }],
    });

    // Step 6: Parse response
    onProgress?.('Processando resultado...');

    const responseText = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as any).text)
        .join('');

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    } else {
        // Try to find raw JSON
        const braceMatch = responseText.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            jsonStr = braceMatch[0];
        }
    }

    try {
        const result: BioimpedanciaAIResult = JSON.parse(jsonStr);

        // Validate required fields
        if (typeof result.percentual_gordura !== 'number' || isNaN(result.percentual_gordura)) {
            throw new Error('percentual_gordura inválido');
        }

        // Ensure all fields exist with sensible defaults
        const peso = targetCheckin?.peso ? parseFloat(targetCheckin.peso) : (patientData.peso_inicial || 0);
        const altura = patientData.altura_inicial || 1.7;
        const idade = patientData.idade || 25;

        return {
            percentual_gordura: result.percentual_gordura,
            classificacao: result.classificacao || 'Não classificado',
            massa_gorda_kg: result.massa_gorda_kg || parseFloat(((peso * result.percentual_gordura) / 100).toFixed(2)),
            massa_magra_kg: result.massa_magra_kg || parseFloat((peso - ((peso * result.percentual_gordura) / 100)).toFixed(2)),
            imc: result.imc || parseFloat((peso / (altura * altura)).toFixed(2)),
            tmb: result.tmb || Math.round(
                patientData.genero === 'M'
                    ? 10 * peso + 6.25 * (altura * 100) - 5 * idade + 5
                    : 10 * peso + 6.25 * (altura * 100) - 5 * idade - 161
            ),
            observacoes: result.observacoes || 'Análise gerada por IA',
            confianca: result.confianca || 'media',
            tokenUsage: response.usage ? {
                input_tokens: response.usage.input_tokens,
                output_tokens: response.usage.output_tokens,
                total_tokens: response.usage.input_tokens + response.usage.output_tokens,
                // Claude Sonnet 4.5: $3/1M input, $15/1M output
                estimated_cost_usd: parseFloat(
                    ((response.usage.input_tokens * 3 / 1_000_000) +
                        (response.usage.output_tokens * 15 / 1_000_000)).toFixed(4)
                ),
            } : undefined,
        };
    } catch (parseError) {
        console.error('Failed to parse AI response:', responseText);
        throw new Error(`Erro ao processar resposta da IA. A resposta não está no formato esperado. Tente novamente.`);
    }
}

// ============================================
// HELPER: AVAILABLE CHECK-INS
// ============================================

export async function getAvailableCheckins(telefone: string): Promise<CheckinOption[]> {
    const { data, error } = await supabase
        .from('checkin')
        .select('id, data_checkin, peso, foto_1, foto_2, foto_3, foto_4')
        .eq('telefone', telefone)
        .order('data_checkin', { ascending: false })
        .limit(20);

    if (error || !data) return [];

    return (data as any[]).map(c => {
        const photos = [c.foto_1, c.foto_2, c.foto_3, c.foto_4].filter(Boolean);
        return {
            id: c.id,
            data_checkin: c.data_checkin,
            peso: c.peso,
            hasPhotos: photos.length > 0,
            photoCount: photos.length,
        };
    });
}

// ============================================
// HELPER: CUSTOM PROMPT CONFIG
// ============================================

const PROMPT_CONFIG_KEY = 'bioimpedancia_ai_prompt';

export async function getCustomPrompt(): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('system_config' as any)
            .select('value')
            .eq('key', PROMPT_CONFIG_KEY)
            .maybeSingle();

        if (error || !data) return null;
        return (data as any).value?.prompt || null;
    } catch {
        return null;
    }
}

export async function saveCustomPrompt(prompt: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('system_config' as any)
            .upsert({
                key: PROMPT_CONFIG_KEY,
                value: { prompt, savedAt: new Date().toISOString() },
                description: 'Instruções customizadas para análise de bioimpedância por IA'
            }, {
                onConflict: 'key'
            });

        return !error;
    } catch {
        return false;
    }
}
