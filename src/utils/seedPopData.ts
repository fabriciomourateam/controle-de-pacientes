import { PopVersion, PopUser } from "@/types/pop";
import { popService } from "@/services/popService";

const uuidv4 = () => crypto.randomUUID();

export const seedPopData = () => {
    // Check for existing versions
    if (popService.getVersions().length > 0) {
        // Patch for old v1.0 step 3 caching
        const versions = popService.getVersions();
        const v1 = versions.find(v => v.version === "v1.0");
        if (v1) {
            const step3 = v1.steps.find(s => s.order === 3);
            if (step3 && step3.content.includes("text-blue-600")) {
                step3.content = `
        <div class="mb-3 font-semibold text-slate-800">Extrair e organizar os seguintes pontos principais:</div>
        <p>
            Objetivo principal e histórico (o que funcionou / não funcionou).<br>
            Qualidade do sono, horários de trabalho/estudo, treino, acordar e dormir.<br>
            Alimentos que gosta, não gosta, e faz questão de manter.<br>
            Preferências de fontes de carboidrato, proteína e frutas.<br>
            Horários de maior/menor fome, hábitos atuais (ex.: café com açúcar) e suplementos ativos.<br>
            Validar se consegue pesar alimentos ou se precisa de medidas caseiras.
        </p>`;
                popService.saveVersion(v1);
            }
        }
        return;
    }

    const adminId = uuidv4();
    const supervisorId = uuidv4();
    const intern1Id = uuidv4();
    const intern2Id = uuidv4();

    const users: PopUser[] = [
        { id: adminId, name: "Admin (Fabrício)", role: "admin" },
        { id: supervisorId, name: "Supervisor Master", role: "supervisor" },
        { id: intern1Id, name: "Estagiário João", role: "intern" },
        { id: intern2Id, name: "Estagiária Maria", role: "intern" }
    ];

    localStorage.setItem('@fmteam:pop_users', JSON.stringify(users));
    // Set explicit default for test
    popService.setCurrentUser(adminId);

    const initialVersion: PopVersion = {
        id: uuidv4(),
        version: "v1.0",
        published_at: new Date().toISOString(),
        author_id: adminId,
        changelog: "Versão inicial do Procedimento Operacional Padrão.",
        is_active: true,
        steps: [
            {
                id: uuidv4(), order: 1, title: "1. Preparação inicial e cadastro",
                is_active: true, content: `<ul>
          <li>Abrir dados do aluno (anamnese, objetivo, preferências, horários, suplementos, observações)</li>
          <li>Se houver treino, abrir MFit também</li>
          <li>Garantir que o aluno não receba a dieta antes da hora (controle de visualização/envio)</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 2, title: "2. Antropometria e cálculo energético",
                is_active: true, content: `<ul>
          <li>Ir em Antropometria Geral > Nova Antropometria</li>
          <li>Cadastrar peso e altura</li>
          <li>Ir em Cálculo Energético > Novo cálculo</li>
          <li>Selecionar Harris-Benedict (1984)</li>
          <li>Verificar TMB</li>
          <li>Multiplicar TMB x 1,45</li>
          <li>Trocar fórmula para "Colocar GET manualmente"</li>
          <li>Inserir valor calculado, confirmar e salvar (Esse será o GET base)</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 3, title: "3. Leitura estratégica da anamnese",
                is_active: true, content: `
        <div class="mb-3 font-semibold text-slate-800">Extrair e organizar os seguintes pontos principais:</div>
        <p>
            Objetivo principal e histórico (o que funcionou / não funcionou).<br>
            Qualidade do sono, horários de trabalho/estudo, treino, acordar e dormir.<br>
            Alimentos que gosta, não gosta, e faz questão de manter.<br>
            Preferências de fontes de carboidrato, proteína e frutas.<br>
            Horários de maior/menor fome, hábitos atuais (ex.: café com açúcar) e suplementos ativos.<br>
            Validar se consegue pesar alimentos ou se precisa de medidas caseiras.
        </p>`
            },
            {
                id: uuidv4(), order: 4, title: "4. Escolha do modelo de dieta",
                is_active: true, content: `<ul>
          <li>Criar nova prescrição alimentar</li>
          <li>Nome no padrão: OBJETIVO - DATA (ex.: EMAGRECIMENTO - 25/02/2026)</li>
          <li>Definir se será dieta em gramas ou medidas caseiras (se não consegue pesar, usar medidas caseiras)</li>
          <li>Verificar intolerâncias/restrições (ex.: lactose) e escolher base adequada</li>
          <li>Selecionar dieta base (ou outra mais adequada)</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 5, title: "5. Primeiro ajuste da dieta base",
                is_active: true, content: `<ul>
          <li>Remover alimentos que o aluno não gosta</li>
          <li>Ajustar itens escondidos em substituições (ex.: maionese, fígado)</li>
          <li>Revisar observações das refeições</li>
          <li>Revisar substituições de proteínas e carboidratos</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 6, title: "6. Estruturação das refeições pela rotina real",
                is_active: true, content: `<ul>
          <li>Montar refeições com base em: horário que acorda, trabalho/estudo, treino, sono</li>
          <li>Se necessário, presumir cenário mais provável de treino/refeições com lógica</li>
          <li>Definir horários com margem de 30 min a 1h (ex.: 08:00 - 09:00)</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 7, title: "7. Montagem das refeições prioritárias",
                is_active: true, content: `
        <div class="mb-3 font-semibold text-slate-800">Ordem estratégica sugerida para montar a dieta:</div>
        <ol class="space-y-2 list-decimal pl-5">
            <li><strong>Refeição em torno do treino</strong> (ou primeira refeição para suporte inicial).</li>
            <li><strong>Almoço</strong> (referência primária de saciedade, ajustar estrutura existente).</li>
            <li><strong>Lanche da tarde</strong> (refeição crítica de escape calórico).</li>
            <li><strong>Jantar</strong> (necessidade varia muito por contexto de rotina e sono).</li>
            <li><strong>Ceia / Lanche noturno</strong> (estrategicamente posicionado contra beliscos).</li>
        </ol>`
            },
            {
                id: uuidv4(), order: 8, title: "8. Regras de montagem por refeição",
                is_active: true, content: `
          <ul class="space-y-4">
            <li><strong class="text-amber-700">Café da manhã / primeira refeição:</strong> Observar apetite matinal. Ajustar conforme hábito, melhorando viabilidade técnica e sem perder adesão inicial.</li>
            <li><strong class="text-amber-700">Almoço:</strong> Manter estrutura baseada no que funciona, mas ajustar quantidades e clarificar substituições.</li>
            <li><strong class="text-amber-700 font-black">Lanche da tarde (CRÍTICO):</strong> Priorizar MUITA saciedade visando controle à noite. Trocar lanches estáticos e fracos por composições densas.</li>
            <li><strong class="text-amber-700">Jantar:</strong> Usar o que foi listado nas preferências, com flexibilidade de volume para preencher calorias restantes do dia de forma prazerosa.</li>
            <li><strong class="text-amber-700">Ceia/lanche noturno:</strong> Importância máxima para quem dorme muito tarde. Pensar ativamente em freios inibitórios calóricos simples (ex.: Iogurte proteico + morango).</li>
          </ul>
        `
            },
            {
                id: uuidv4(), order: 9, title: "9. Regras de personalização obrigatórias",
                is_active: true, content: `<ul>
          <li>Incluir alimentos que gosta e retirar o que não gosta. Considerar os que faz questão.</li>
          <li>Respeitar contexto real (trabalho/restaurante/sem balança).</li>
          <li>Ajustar pela fome e apetite ao longo do dia.</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 10, title: "10. Ajuste calórico e estratégia",
                is_active: true, content: `<ul>
          <li>Usar GET base como referência</li>
          <li>Definir déficit/superávit conforme objetivo</li>
          <li>Conferir calorias totais e déficit final</li>
          <li>Antes de mexer nas calorias totais, ajustar distribuição entre refeições</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 11, title: "11. Suplementação",
                is_active: true, content: `<ul>
          <li>Verificar o que já usa e o que tem/aceita usar.</li>
          <li>Não colocar suplemento desnecessário. Ajustar conforme rotina/treino.</li>
          <li>Seguir padrão da equipe.</li>
        </ul>`
            },
            {
                id: uuidv4(), order: 12, title: "12. Checklist final e segurança operacional",
                is_active: true, content: `<ul>
          <li>Revisar estrutura, personalização, execução prática e qualidade técnica.</li>
          <li>Revisar envio/visualização.</li>
          <li>Salvar e marcar como pronto para revisão/envio.</li>
        </ul>`
            }
        ],
        checklist_categories: [
            { id: "cat_1", name: "Estrutura", weight: 1 },
            { id: "cat_2", name: "Personalização", weight: 1 },
            { id: "cat_3", name: "Execução prática", weight: 1 },
            { id: "cat_4", name: "Qualidade técnica", weight: 1 },
            { id: "cat_5", name: "Segurança operacional", weight: 1 },
        ],
        checklist_items: [
            { id: uuidv4(), category_id: "cat_1", text: "Nome da prescrição no padrão", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_1", text: "Dieta base correta (gramas vs medidas caseiras)", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_1", text: "Horários coerentes e Janela de horários incluída", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_1", text: "Número de refeições coerente", is_mandatory: true },

            { id: uuidv4(), category_id: "cat_2", text: "Alimentos que gosta incluídos e que não gosta removidos", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_2", text: "Preferências de carbo/proteína/fruta consideradas", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_2", text: "Restrições/intolerâncias respeitadas", is_mandatory: true },

            { id: uuidv4(), category_id: "cat_3", text: "Compatível com rotina de trabalho/estudo", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_3", text: "Medidas caseiras (se não pesa)", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_3", text: "Refeições críticas bem ajustadas (plano viável dia a dia)", is_mandatory: true },

            { id: uuidv4(), category_id: "cat_4", text: "Substituições e Observações revisadas", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_4", text: "Quantidades claras (sem confusão)", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_4", text: "Calorias e Déficit/superávit conferidos", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_4", text: "Distribuição de calorias coerente com apetite e suplementação revisada", is_mandatory: true },

            { id: uuidv4(), category_id: "cat_5", text: "Controle de envio/visualização ok", is_mandatory: true },
            { id: uuidv4(), category_id: "cat_5", text: "Plano salvo corretamente e Pronto para revisão/envio", is_mandatory: true },
        ],
        common_errors: [
            {
                id: uuidv4(),
                title: "Montar sem ler anamnese inteira",
                impact: "Plano fica genérico, perde itens cruciais e gera retrabalho profundo.",
                how_to_avoid: "Sempre faça a Etapa 3 criando um resumo lateral dos principais pontos.",
                prevention_checklist: ["Leu a anamnese", "Preencheu o resumo do caso"]
            },
            {
                id: uuidv4(),
                title: "Escolher dieta base errada",
                impact: "Paciente fica confuso (tentando pesar sem balança ou medindo colheres tendo balança).",
                how_to_avoid: "Valide na anamnese se o paciente pode pesar antes de puxar a dieta base.",
                prevention_checklist: ["Validou 'Pode usar balança?'"]
            },
            {
                id: uuidv4(),
                title: "Não ajustar calorias pela fome",
                impact: "Paciente não adere à dieta por estar faminto em horários críticos (Tarde/Noite).",
                how_to_avoid: "Jogue o volume (e calorias) pros horários que o paciente relata ter mais apetite, dentro do limite do metabolismo.",
                prevention_checklist: ["Verificou horário de mais fome", "Colocou refeição volumosa nesse momento"]
            }
        ]
    };

    popService.saveVersion(initialVersion);
};
