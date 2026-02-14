/**
 * Fluxo padrão da anamnese nutricional.
 * Cada step define uma seção do formulário com N campos configuráveis.
 *
 * Tipos de campo:
 * - "text": campo de texto livre
 * - "textarea": campo de texto multilinha
 * - "select": seleção única entre opções (dropdown)
 * - "number": campo numérico
 * - "date": campo de data
 * - "time": campo de hora
 * - "photo": upload de foto
 * - "checkbox": checkbox (aceite de termos, etc.)
 * - "phone": campo de telefone internacional com seletor de país
 */

export interface AnamnesisFieldDef {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'time' | 'photo' | 'checkbox' | 'phone';
    label: string;
    placeholder?: string;
    required: boolean;
    field: string;
    options?: string[];
    targetField: 'anamnese' | 'form';
    showIf?: { field: string; value: string };
    gridCols?: number;
    icon?: string;
    requiresConfirmation?: boolean;
    hasCountrySelector?: boolean;
}

export interface AnamnesisFlowStep {
    id: string;
    sectionTitle: string;
    sectionEmoji: string;
    fields: AnamnesisFieldDef[];
}

export interface FinalMessageConfig {
    title: string;
    subtitle: string;
    footer: string;
}

export const DEFAULT_FINAL_MESSAGE: FinalMessageConfig = {
    title: 'Anamnese enviada!',
    subtitle: 'Seus dados foram enviados com sucesso.\nEm até **72 horas úteis** seu planejamento será entregue!',
    footer: 'Tenho certeza que você terá ótimos resultados! 🎯',
};

export const DEFAULT_TERMS_URL = 'https://drive.google.com/file/d/1KuLkE5WpEeqX6MYFI46VhySng5UOK-nY/view?usp=sharing';
export const DEFAULT_TERMS_TEXT = 'Antes de seguir, é importante que você conheça os termos do nosso acompanhamento.\n\nEste é o **contrato que formaliza sua adesão ao plano escolhido** e explica de forma transparente como funciona o serviço, prazos, deveres e garantias — pra que tudo fique claro desde o início.';

export const DEFAULT_ANAMNESIS_FLOW: AnamnesisFlowStep[] = [
    // === 1. DADOS PESSOAIS ===
    {
        id: 'dados_pessoais',
        sectionTitle: 'Dados Pessoais',
        sectionEmoji: '👤',
        fields: [
            { id: 'nome', type: 'text', label: 'Nome Completo', placeholder: 'Seu nome completo', required: true, field: 'nome', targetField: 'form', icon: '👤', gridCols: 2 },
            { id: 'telefone', type: 'text', label: 'Telefone', placeholder: 'DDD + Número', required: true, field: 'telefone', targetField: 'form', icon: '📱', gridCols: 2, requiresConfirmation: true },
            { id: 'data_nascimento', type: 'date', label: 'Data de Nascimento', required: true, field: 'data_nascimento', targetField: 'form', icon: '📅', gridCols: 2 },
            { id: 'genero', type: 'select', label: 'Sexo', required: false, field: 'genero', targetField: 'form', options: ['Masculino', 'Feminino', 'Outro'], gridCols: 2 },
            { id: 'cpf', type: 'text', label: 'CPF', placeholder: '000.000.000-00', required: true, field: 'cpf', targetField: 'form', icon: '🪪', gridCols: 2 },
            { id: 'email', type: 'text', label: 'Email', placeholder: 'email@exemplo.com', required: true, field: 'email', targetField: 'form', icon: '✉️', gridCols: 2 },
            { id: 'instagram', type: 'text', label: 'Rede Social (Instagram)', placeholder: '@seuusuario', required: false, field: 'instagram', targetField: 'anamnese', icon: '📷' },
        ],
    },

    // === 2. ENDEREÇO ===
    {
        id: 'endereco',
        sectionTitle: 'Endereço',
        sectionEmoji: '📍',
        fields: [
            { id: 'rua', type: 'text', label: 'Rua/Avenida', placeholder: 'Nome da rua ou avenida', required: true, field: 'rua', targetField: 'anamnese', icon: '🏠' },
            { id: 'numero', type: 'text', label: 'Número', placeholder: '123', required: true, field: 'numero', targetField: 'anamnese', gridCols: 3 },
            { id: 'bairro', type: 'text', label: 'Bairro', placeholder: 'Bairro', required: true, field: 'bairro', targetField: 'anamnese', gridCols: 3 },
            { id: 'cidade', type: 'text', label: 'Cidade', placeholder: 'Cidade', required: true, field: 'cidade', targetField: 'anamnese', gridCols: 3 },
            { id: 'estado', type: 'select', label: 'Estado', required: true, field: 'estado', targetField: 'anamnese', options: ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'Exterior'], gridCols: 2 },
            { id: 'cep', type: 'text', label: 'CEP', placeholder: '00000-000', required: true, field: 'cep', targetField: 'anamnese', gridCols: 2 },
            { id: 'detalhes_endereco_exterior', type: 'text', label: 'País/Detalhes do Endereço', placeholder: 'Digite seu país e detalhes do endereço', required: false, field: 'detalhes_endereco_exterior', targetField: 'anamnese', showIf: { field: 'estado', value: 'Exterior' } },
        ],
    },

    // === 3. MEDIDAS E FOTOS ===
    {
        id: 'medidas_fotos',
        sectionTitle: 'Medidas e Fotos',
        sectionEmoji: '📏',
        fields: [
            { id: 'peso', type: 'number', label: 'Peso (kg)', placeholder: '70.5', required: true, field: 'peso', targetField: 'form', gridCols: 4 },
            { id: 'altura', type: 'number', label: 'Altura (cm)', placeholder: '175', required: true, field: 'altura', targetField: 'form', gridCols: 4 },
            { id: 'cintura', type: 'number', label: 'Cintura (cm)', placeholder: '80', required: true, field: 'cintura', targetField: 'form', gridCols: 4 },
            { id: 'quadril', type: 'number', label: 'Quadril (cm)', placeholder: '95', required: true, field: 'quadril', targetField: 'form', gridCols: 4 },
            { id: 'foto_frente', type: 'photo', label: 'Frente', required: false, field: 'foto_frente', targetField: 'form', gridCols: 4 },
            { id: 'foto_lado', type: 'photo', label: 'Perfil (Lado)', required: false, field: 'foto_lado', targetField: 'form', gridCols: 4 },
            { id: 'foto_lado2', type: 'photo', label: 'Perfil (Lado 2)', required: false, field: 'foto_lado2', targetField: 'form', gridCols: 4 },
            { id: 'foto_costas', type: 'photo', label: 'Costas', required: false, field: 'foto_costas', targetField: 'form', gridCols: 4 },
        ],
    },

    // === 4. OBJETIVOS ===
    {
        id: 'objetivos',
        sectionTitle: 'Objetivos',
        sectionEmoji: '🎯',
        fields: [
            { id: 'onde_conheceu', type: 'select', label: 'Onde conheceu meu trabalho?', required: true, field: 'onde_conheceu', targetField: 'anamnese', options: ['Google', 'Instagram', 'Facebook', 'Indicação', 'Outros'] },
            { id: 'objetivo', type: 'select', label: 'Objetivo (o que mais incomoda no físico hoje)', required: true, field: 'objetivo', targetField: 'form', options: ['Diminuir o percentual de gordura', 'Ganho de massa muscular', 'Recomposição corporal', 'Emagrecimento', 'Performance', 'Melhora de saúde'] },
            { id: 'relato_objetivo', type: 'textarea', label: 'Agora descreva detalhadamente seu objetivo', placeholder: 'O que te motivou a buscar esse objetivo...', required: true, field: 'relato_objetivo', targetField: 'anamnese' },
            { id: 'ja_foi_nutricionista', type: 'textarea', label: 'Já foi em algum nutricionista antes?', required: true, field: 'ja_foi_nutricionista', targetField: 'anamnese' },
            { id: 'o_que_funcionou', type: 'textarea', label: 'Se sim, o que funcionou pra você?', required: false, field: 'o_que_funcionou', targetField: 'anamnese' },
            { id: 'maior_dificuldade', type: 'textarea', label: 'Qual a sua maior dificuldade relacionada ao objetivo?', required: false, field: 'maior_dificuldade', targetField: 'anamnese' },
        ],
    },

    // === 5. SAÚDE ===
    {
        id: 'saude',
        sectionTitle: 'Saúde',
        sectionEmoji: '❤️',
        fields: [
            { id: 'restricao_alimentar', type: 'textarea', label: 'Possui alguma restrição alimentar? (vegetariano/vegano)', required: true, field: 'restricao_alimentar', targetField: 'anamnese' },
            { id: 'alergia_intolerancia', type: 'textarea', label: 'Possui alergia ou intolerância alimentar?', required: true, field: 'alergia_intolerancia', targetField: 'anamnese' },
            { id: 'fuma', type: 'text', label: 'Fuma? Quantos cigarros por dia?', required: true, field: 'fuma', targetField: 'anamnese' },
            { id: 'bebida_alcoolica', type: 'text', label: 'Ingere bebida alcoólica? Frequência/tipo', required: true, field: 'bebida_alcoolica', targetField: 'anamnese' },
            { id: 'problema_saude', type: 'textarea', label: 'Você tem algum problema de saúde? Se sim, qual?', required: true, field: 'problema_saude', targetField: 'anamnese' },
            { id: 'medicamento_continuo', type: 'textarea', label: 'Faz ou já fez uso de algum medicamento contínuo?', required: true, field: 'medicamento_continuo', targetField: 'anamnese' },
            { id: 'uso_hormonal', type: 'textarea', label: 'Faz ou já fez uso hormonal? Dosagem e tempo?', required: true, field: 'uso_hormonal', targetField: 'anamnese' },
            { id: 'protocolo_hormonal', type: 'textarea', label: 'Protocolo hormonal atual? (dosagem e tempo)', required: true, field: 'protocolo_hormonal', targetField: 'anamnese' },
            { id: 'interesse_hormonal', type: 'textarea', label: 'Tem interesse em uso hormonal? Sabe dos riscos?', required: true, field: 'interesse_hormonal', targetField: 'anamnese' },
            { id: 'ciclo_menstrual', type: 'textarea', label: 'Como é seu ciclo menstrual? Última menstruação', required: false, field: 'ciclo_menstrual', targetField: 'anamnese', showIf: { field: 'genero', value: 'Feminino' } },
            { id: 'tpm', type: 'text', label: 'Como você considera sua TPM?', required: false, field: 'tpm', targetField: 'anamnese', showIf: { field: 'genero', value: 'Feminino' } },
            { id: 'metodo_contraceptivo', type: 'text', label: 'Faz uso de método contraceptivo?', required: false, field: 'metodo_contraceptivo', targetField: 'anamnese', showIf: { field: 'genero', value: 'Feminino' } },
        ],
    },

    // === 6. ALIMENTAÇÃO ===
    {
        id: 'alimentacao',
        sectionTitle: 'Alimentação',
        sectionEmoji: '🍽️',
        fields: [
            { id: 'mora_com_quantas_pessoas', type: 'text', label: 'Mora com quantas pessoas? Quem faz as compras?', required: true, field: 'mora_com_quantas_pessoas', targetField: 'anamnese' },
            { id: 'habito_cozinhar', type: 'text', label: 'Tem o hábito de cozinhar?', required: true, field: 'habito_cozinhar', targetField: 'anamnese' },
            { id: 'alimentos_nao_gosta', type: 'textarea', label: 'Que alimentos você não gosta ou não te fazem bem?', required: true, field: 'alimentos_nao_gosta', targetField: 'anamnese' },
            { id: 'problema_alimentos_especificos', type: 'textarea', label: 'Tem problema com: arroz, macarrão, batata, pão, aveia, frango, carne, peixe, legumes, saladas, queijos, frutas, whey?', required: true, field: 'problema_alimentos_especificos', targetField: 'anamnese' },
            { id: 'preferencia_carboidratos', type: 'textarea', label: 'Quais carboidratos prefere? (arroz, macarrão, pães, batatas, aveia, tapioca...)', required: true, field: 'preferencia_carboidratos', targetField: 'anamnese' },
            { id: 'preferencia_proteinas', type: 'textarea', label: 'Quais proteínas prefere? (frango, peixe, ovos, carne, whey...)', required: true, field: 'preferencia_proteinas', targetField: 'anamnese' },
            { id: 'preferencia_frutas', type: 'textarea', label: 'Quais frutas prefere?', required: true, field: 'preferencia_frutas', targetField: 'anamnese' },
            { id: 'hora_mais_fome', type: 'text', label: 'Que horas do dia sente mais fome?', required: true, field: 'hora_mais_fome', targetField: 'anamnese' },
            { id: 'apetite', type: 'text', label: 'Como está seu apetite?', required: true, field: 'apetite', targetField: 'anamnese' },
            { id: 'mastigacao', type: 'select', label: 'Como é sua mastigação?', required: true, field: 'mastigacao', targetField: 'anamnese', options: ['Lenta', 'Mediana', 'Rápida'] },
            { id: 'alimentos_faz_questao', type: 'textarea', label: 'Alimentos que faz questão que tenha na dieta', required: true, field: 'alimentos_faz_questao', targetField: 'anamnese' },
            { id: 'habito_intestinal', type: 'text', label: 'Como é seu hábito intestinal?', required: false, field: 'habito_intestinal', targetField: 'anamnese' },
            { id: 'habito_urinario', type: 'text', label: 'Como é seu hábito urinário?', required: false, field: 'habito_urinario', targetField: 'anamnese' },
            { id: 'suplementos', type: 'text', label: 'Possui algum suplemento em mãos? Se sim, qual(is)?', required: true, field: 'suplementos', targetField: 'anamnese' },
            { id: 'litros_agua', type: 'text', label: 'Bebe quantos litros de água por dia?', required: true, field: 'litros_agua', targetField: 'anamnese' },
        ],
    },

    // === 7. ROTINA ===
    {
        id: 'rotina',
        sectionTitle: 'Rotina',
        sectionEmoji: '⏰',
        fields: [
            { id: 'horario_estudo', type: 'text', label: 'Horário de estudo', placeholder: 'Não estudo / Manhã / Tarde / Noite', required: true, field: 'horario_estudo', targetField: 'anamnese' },
            { id: 'horario_trabalho', type: 'text', label: 'Horário de trabalho', placeholder: 'Ex: 08h às 18h', required: true, field: 'horario_trabalho', targetField: 'anamnese' },
            { id: 'trabalha_pe_sentado', type: 'text', label: 'Trabalha em pé ou sentado?', required: true, field: 'trabalha_pe_sentado', targetField: 'anamnese' },
            { id: 'tempo_em_pe', type: 'text', label: 'Quanto tempo do dia fica em pé?', required: true, field: 'tempo_em_pe', targetField: 'anamnese' },
            { id: 'horario_treino', type: 'text', label: 'Horário de treino (ou pretende treinar)', required: true, field: 'horario_treino', targetField: 'anamnese' },
            { id: 'horario_acordar', type: 'time', label: 'Acorda que horas?', required: true, field: 'horario_acordar', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_dormir', type: 'time', label: 'Dorme que horas?', required: true, field: 'horario_dormir', targetField: 'anamnese', gridCols: 2 },
            { id: 'horas_sono', type: 'text', label: 'Quantas horas dorme por noite?', required: true, field: 'horas_sono', targetField: 'anamnese' },
            { id: 'qualidade_sono', type: 'textarea', label: 'Como é seu sono? Usa remédio para dormir?', required: true, field: 'qualidade_sono', targetField: 'anamnese' },
            { id: 'habito_cafe', type: 'text', label: 'Tem o hábito de tomar café? Se sim, toma com açúcar? Quanto?', required: true, field: 'habito_cafe', targetField: 'anamnese' },
            { id: 'cafe_sem_acucar', type: 'text', label: 'Consegue tomar sem açúcar ou com adoçante?', required: true, field: 'cafe_sem_acucar', targetField: 'anamnese' },
            { id: 'alimentacao_fim_semana', type: 'text', label: 'Como é sua alimentação aos finais de semana?', required: true, field: 'alimentacao_fim_semana', targetField: 'anamnese' },
            { id: 'levar_refeicoes_trabalho', type: 'text', label: 'Tem condições de levar refeições para o trabalho?', required: true, field: 'levar_refeicoes_trabalho', targetField: 'anamnese' },
            { id: 'pesar_refeicoes', type: 'text', label: 'Consegue pesar as refeições?', required: true, field: 'pesar_refeicoes', targetField: 'anamnese' },
        ],
    },

    // === 8. REFEIÇÕES ===
    {
        id: 'refeicoes',
        sectionTitle: 'Refeições',
        sectionEmoji: '🥗',
        fields: [
            { id: 'horario_refeicao_01', type: 'time', label: 'Horário Refeição 01', required: true, field: 'horario_refeicao_01', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_01', type: 'textarea', label: 'O que come na Refeição 01 e o que gostaria de comer', placeholder: 'Ex: Pão com ovo (gostaria de tapioca)', required: true, field: 'refeicao_01', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_refeicao_02', type: 'time', label: 'Horário Refeição 02', required: true, field: 'horario_refeicao_02', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_02', type: 'textarea', label: 'O que come na Refeição 02 e o que gostaria de comer', placeholder: 'Ex: Arroz, feijão, carne, salada', required: true, field: 'refeicao_02', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_refeicao_03', type: 'time', label: 'Horário Refeição 03', required: true, field: 'horario_refeicao_03', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_03', type: 'textarea', label: 'O que come na Refeição 03 e o que gostaria de comer', required: true, field: 'refeicao_03', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_refeicao_04', type: 'time', label: 'Horário Refeição 04', required: true, field: 'horario_refeicao_04', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_04', type: 'textarea', label: 'O que come na Refeição 04 e o que gostaria de comer', required: true, field: 'refeicao_04', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_refeicao_05', type: 'time', label: 'Horário Refeição 05', required: true, field: 'horario_refeicao_05', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_05', type: 'textarea', label: 'O que come na Refeição 05 e o que gostaria de comer', required: true, field: 'refeicao_05', targetField: 'anamnese', gridCols: 2 },
            { id: 'horario_refeicao_06', type: 'time', label: 'Horário Refeição 06', required: true, field: 'horario_refeicao_06', targetField: 'anamnese', gridCols: 2 },
            { id: 'refeicao_06', type: 'textarea', label: 'O que come na Refeição 06 e o que gostaria de comer', required: true, field: 'refeicao_06', targetField: 'anamnese', gridCols: 2 },
        ],
    },

    // === 9. TREINOS ===
    {
        id: 'treinos',
        sectionTitle: 'Treinos',
        sectionEmoji: '💪',
        fields: [
            { id: 'frequencia_musculacao', type: 'text', label: 'Faz musculação quantas vezes por semana?', required: true, field: 'frequencia_musculacao', targetField: 'anamnese' },
            { id: 'tempo_treinando', type: 'text', label: 'Treina há quanto tempo?', placeholder: 'Ex: 6 meses, 1 ano...', required: false, field: 'tempo_treinando', targetField: 'anamnese' },
            { id: 'treina_jejum', type: 'select', label: 'Treina em jejum?', required: false, field: 'treina_jejum', targetField: 'anamnese', options: ['Sim', 'Não', 'Às vezes'], gridCols: 2 },
            { id: 'recuperacao_pos_treino', type: 'text', label: 'Como é sua recuperação pós-treino?', required: true, field: 'recuperacao_pos_treino', targetField: 'anamnese', gridCols: 2 },
            { id: 'ja_treinou_jejum', type: 'textarea', label: 'Já treinou em jejum? Se sim, como foi?', required: false, field: 'ja_treinou_jejum', targetField: 'anamnese' },
            { id: 'disponibilidade_musculacao', type: 'text', label: 'Tem disponibilidade para treinar quantos dias na semana?', required: true, field: 'disponibilidade_musculacao', targetField: 'anamnese', gridCols: 2 },
            { id: 'horas_treino_dia', type: 'text', label: 'Quantas horas por dia tem disponível para treino?', required: true, field: 'horas_treino_dia', targetField: 'anamnese', gridCols: 2 },
            { id: 'divisao_treino', type: 'textarea', label: 'Como está sua divisão de treino atual?', placeholder: 'Ex: Peito/Tríceps/Ombro, Costas/Bíceps, Perna...', required: true, field: 'divisao_treino', targetField: 'anamnese' },
            { id: 'exercicios_por_grupo', type: 'text', label: 'Faz quantos exercícios por grupo muscular?', required: true, field: 'exercicios_por_grupo', targetField: 'anamnese', gridCols: 3 },
            { id: 'series_por_exercicio', type: 'text', label: 'Faz quantas séries por exercício?', required: true, field: 'series_por_exercicio', targetField: 'anamnese', gridCols: 3 },
            { id: 'repeticoes_por_serie', type: 'text', label: 'Quantas repetições em cada série?', required: true, field: 'repeticoes_por_serie', targetField: 'anamnese', gridCols: 3 },
            { id: 'prioridade_muscular', type: 'textarea', label: 'Qual grupo muscular que tem mais prioridade em desenvolver?', required: true, field: 'prioridade_muscular', targetField: 'anamnese' },
            { id: 'aerobico_dias_semana', type: 'text', label: 'Faz cardio quantos dias na semana?', required: true, field: 'aerobico_dias_semana', targetField: 'anamnese', gridCols: 3 },
            { id: 'tempo_aerobico', type: 'text', label: 'Quanto tempo de cardio você faz nesses dias?', required: true, field: 'tempo_aerobico', targetField: 'anamnese', gridCols: 3 },
            { id: 'aerobico_preferido', type: 'text', label: 'Qual seu cardio preferido?', required: true, field: 'aerobico_preferido', targetField: 'anamnese', gridCols: 3 },
            { id: 'lesoes', type: 'textarea', label: 'Já teve alguma lesão? Detalhe', required: true, field: 'lesoes', targetField: 'anamnese' },
            { id: 'atividades_fisicas', type: 'textarea', label: 'Atividades físicas que pratica atualmente (além da musculação)', required: true, field: 'atividades_fisicas', targetField: 'anamnese' },
        ],
    },

    // === 10. FINALIZAR ===
    {
        id: 'finalizar',
        sectionTitle: 'Finalizar',
        sectionEmoji: '✅',
        fields: [
            { id: 'observacao_alimentar', type: 'textarea', label: 'Observações adicionais para a prescrição alimentar', required: false, field: 'observacao_alimentar', targetField: 'anamnese' },
            { id: 'observacao_treinos', type: 'textarea', label: 'Observações para a prescrição dos treinos', required: false, field: 'observacao_treinos', targetField: 'anamnese' },
            { id: 'observacao', type: 'textarea', label: 'Observações gerais', required: false, field: 'observacao', targetField: 'form' },
            { id: 'indicacoes_amigos', type: 'textarea', label: 'Teria 2 ou 3 amigos/familiares para indicar? (nome e telefone)', required: false, field: 'indicacoes_amigos', targetField: 'anamnese' },
        ],
    },
];
