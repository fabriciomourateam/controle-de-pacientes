# 📊 Guia de Importação via Excel

## ✅ O que foi implementado

Sistema completo de importação via Excel para dar autonomia aos nutricionistas:

### 1. **Importação de Pacientes** ✅
- ✅ Suporte para arquivos **CSV** e **Excel (.xlsx)**
- ✅ Botão **"Baixar Modelo"** para download do template
- ✅ Importação automática com **user_id** (multi-tenancy)
- ✅ Validação de dados
- ✅ Preview de erros e avisos

### 2. **Importação de Planos Alimentares** ✅
- ✅ Suporte para arquivos **Excel (.xlsx)** com **1 única planilha simplificada**
- ✅ Botão **"Baixar Modelo"** com template simplificado
- ✅ **Busca automática** de alimentos no banco TACO
- ✅ **Cálculo automático** de calorias, proteínas, carboidratos e gorduras
- ✅ **Valores manuais opcionais** quando alimento não está no banco
- ✅ Importação hierárquica completa (Planos → Refeições → Alimentos)
- ✅ **Cálculo automático de totais** (refeições e planos)
- ✅ Associação automática ao paciente selecionado
- ✅ Importação com **user_id** (multi-tenancy)

---

## 📥 Como Usar - Importação de Pacientes

### Passo 1: Baixar o Modelo
1. Acesse a página **"Pacientes"**
2. Clique em **"Importar Pacientes"**
3. Clique em **"Baixar Modelo"**
4. Um arquivo Excel será baixado com as colunas corretas

### Passo 2: Preencher o Modelo
Abra o Excel baixado e preencha com os dados dos seus pacientes:

**Colunas disponíveis:**
- **Nome** (obrigatório)
- **Telefone**
- **Email**
- **Gênero**
- **Data de Nascimento**
- **CPF**
- **Apelido**
- **Plano**
- **Início Acompanhamento**
- **Valor**
- **Observação**

### Passo 3: Importar
1. Clique em **"Selecionar Arquivo"**
2. Escolha o arquivo Excel preenchido (ou CSV)
3. Clique em **"Importar Dados"**
4. Aguarde o processamento
5. Verifique o resultado da importação

---

## 📥 Como Usar - Importação de Planos Alimentares

### Passo 1: Baixar o Modelo
1. Acesse a página de **"Planos Alimentares"** de um paciente
2. Clique em **"Importar Planos"**
3. Clique em **"Baixar Modelo"**
4. Um arquivo Excel será baixado com **1 única planilha simplificada**

### Passo 2: Preencher o Modelo

#### **Estrutura Simplificada (1 única planilha)**
```
Nome do Plano | Tipo Refeição | Nome Refeição | Horário | Alimento | Quantidade | Unidade | Calorias | Proteínas | Carboidratos | Gorduras | Instruções
```

**Colunas obrigatórias:**
- **Nome do Plano**: Nome do plano alimentar
- **Tipo Refeição**: Tipo da refeição (veja opções abaixo)
- **Nome Refeição**: Nome da refeição (ex: "Café da Manhã 1")
- **Alimento**: Nome do alimento
- **Quantidade**: Quantidade do alimento
- **Unidade**: Unidade de medida (g, kg, unidade, etc.)

**Colunas opcionais:**
- **Horário**: Horário sugerido (ex: "07:00")
- **Calorias**: Calorias (preencher apenas se alimento não estiver no banco TACO)
- **Proteínas**: Proteínas (preencher apenas se alimento não estiver no banco TACO)
- **Carboidratos**: Carboidratos (preencher apenas se alimento não estiver no banco TACO)
- **Gorduras**: Gorduras (preencher apenas se alimento não estiver no banco TACO)
- **Instruções**: Instruções gerais da refeição

**Tipos de Refeição aceitos:**
- Café da Manhã
- Lanche da Manhã
- Almoço
- Lanche da Tarde
- Jantar
- Pré-Treino
- Pós-Treino

#### **Como Funciona:**

1. **Busca Automática no TACO**: A plataforma busca automaticamente cada alimento no banco de dados TACO
2. **Cálculo Automático**: Se encontrar, calcula automaticamente as calorias, proteínas, carboidratos e gorduras baseado na quantidade
3. **Valores Manuais**: Se não encontrar o alimento no banco, você pode preencher manualmente as colunas de Calorias, Proteínas, Carboidratos e Gorduras
4. **Totais Automáticos**: A plataforma calcula automaticamente os totais de cada refeição e do plano completo

#### **Exemplo Prático:**
```
Nome do Plano          | Tipo Refeição | Nome Refeição      | Horário | Alimento        | Quantidade | Unidade | Calorias | Proteínas | Carboidratos | Gorduras | Instruções
Plano Emagrecimento    | Café da Manhã | Café da Manhã 1   | 07:00   | Ovos            | 2          | unidade |          |           |              |          |
Plano Emagrecimento    | Café da Manhã | Café da Manhã 1   | 07:00   | Aveia           | 50         | g       |          |           |              |          |
Plano Emagrecimento    | Almoço        | Almoço 1          | 12:00   | Arroz Integral  | 100        | g       |          |           |              |          |
Plano Emagrecimento    | Almoço        | Almoço 1          | 12:00   | Frango          | 150        | g       |          |           |              |          |
Plano Emagrecimento    | Almoço        | Almoço 1          | 12:00   | Salada          | 200        | g       |          |           |              |          |
```

**Nota**: As colunas de Calorias, Proteínas, Carboidratos e Gorduras podem ficar vazias se o alimento estiver no banco TACO. A plataforma calculará automaticamente!

### Passo 3: Importar
1. **Selecione o paciente** que receberá os planos
2. Clique em **"Selecionar Arquivo Excel"**
3. Escolha o arquivo Excel preenchido
4. Clique em **"Importar Planos"**
5. Aguarde o processamento
6. Verifique o resultado da importação

---

## 🔒 Segurança e Multi-Tenancy

- ✅ Todos os dados importados são automaticamente vinculados ao **user_id** do nutricionista logado
- ✅ Isolamento total: cada nutricionista só vê seus próprios dados
- ✅ Validação de autenticação antes de importar
- ✅ RLS (Row Level Security) garante proteção no banco de dados

---

## ⚠️ Validações

### Pacientes
- **Nome** é obrigatório
- **Email** deve ser válido (se preenchido)
- **CPF** deve ter 11 dígitos (se preenchido)
- **Telefone** deve ter 10-11 dígitos (se preenchido)

### Planos Alimentares
- **Nome do Plano** é obrigatório
- **Tipo Refeição** deve ser válido
- **Nome Refeição** é obrigatório
- **Alimento** é obrigatório
- **Quantidade** deve ser maior que zero
- **Unidade** é obrigatória
- **Calorias, Proteínas, Carboidratos, Gorduras**: Obrigatórias apenas se o alimento não estiver no banco TACO

---

## 📋 Estrutura dos Templates

### Template Pacientes (1 planilha)
```
Nome | Telefone | Email | Gênero | Data de Nascimento | CPF | Apelido | Plano | Início Acompanhamento | Valor | Observação
```

### Template Planos Alimentares (1 planilha simplificada)

**Estrutura única:**
```
Nome do Plano | Tipo Refeição | Nome Refeição | Horário | Alimento | Quantidade | Unidade | Calorias | Proteínas | Carboidratos | Gorduras | Instruções
```

**Observações:**
- Uma única planilha com todas as informações
- Cada linha representa um alimento de uma refeição
- A plataforma agrupa automaticamente por plano e refeição
- Calorias, Proteínas, Carboidratos e Gorduras são opcionais (preencher apenas se alimento não estiver no banco TACO)
- Totais são calculados automaticamente pela plataforma

---

## 🎯 Benefícios

1. **Autonomia Total**: Nutricionistas podem importar seus próprios dados
2. **Escalabilidade**: Sem depender de você para cada importação
3. **Flexibilidade**: Podem usar Excel (mais familiar que CSV)
4. **Eficiência**: Importação em lote de centenas de registros
5. **Segurança**: Isolamento automático por usuário
6. **Simplicidade**: Uma única planilha ao invés de 3 planilhas separadas
7. **Automação**: Busca automática no banco TACO e cálculo automático de calorias
8. **Flexibilidade**: Permite valores manuais quando alimento não está no banco

---

## 🚀 Localização dos Botões

### Importação de Pacientes
- **Página**: Pacientes (`/patients`)
- **Botão**: "Importar Pacientes" (ao lado de "Novo Paciente")

### Importação de Planos
- **Página**: Planos Alimentares de um paciente
- **Botão**: "Importar Planos" (ao lado de "Criar Novo Plano")

---

## 📝 Dicas

1. **Sempre baixe o modelo primeiro** para garantir que as colunas estão corretas
2. **Mantenha os nomes das colunas exatamente como no modelo**
3. **Para planos alimentares**, use uma única planilha com todas as informações
4. **Alimentos do banco TACO**: Deixe as colunas de calorias vazias - a plataforma calculará automaticamente
5. **Alimentos não encontrados**: Preencha manualmente as colunas de Calorias, Proteínas, Carboidratos e Gorduras
6. **Valores numéricos** podem usar vírgula ou ponto como separador decimal
7. **Datas** podem estar em qualquer formato reconhecível pelo Excel

---

## ❌ Resolução de Problemas

### Erro: "Usuário não autenticado"
**Solução**: Faça login novamente na plataforma

### Erro: "Nenhuma linha de dados encontrada"
**Solução**: Verifique se o arquivo não está vazio e se tem pelo menos uma linha de dados (além do cabeçalho)

### Erro: "Formato de arquivo não suportado"
**Solução**: Use arquivos .csv, .xlsx ou .xls

### Planos não aparecem após importação
**Solução**: 
1. Verifique se selecionou o paciente correto
2. Verifique se todas as colunas obrigatórias estão preenchidas
3. Verifique os erros na mensagem de resultado

### Aviso: "Alimento não encontrado no banco TACO"
**Solução**: 
1. Preencha manualmente as colunas de Calorias, Proteínas, Carboidratos e Gorduras para esse alimento
2. Ou verifique se o nome do alimento está correto (pode haver variações de nome)

---

## ✅ Checklist de Importação

### Antes de Importar Pacientes
- [ ] Baixou o modelo Excel
- [ ] Preencheu pelo menos a coluna "Nome"
- [ ] Verificou se os dados estão corretos
- [ ] Está logado na plataforma

### Antes de Importar Planos
- [ ] Baixou o modelo Excel
- [ ] Preencheu a planilha com todas as informações (1 única planilha)
- [ ] Preencheu todas as colunas obrigatórias (Nome do Plano, Tipo Refeição, Nome Refeição, Alimento, Quantidade, Unidade)
- [ ] Para alimentos não encontrados no TACO, preencheu manualmente Calorias, Proteínas, Carboidratos e Gorduras
- [ ] Selecionou o paciente que receberá os planos
- [ ] Está logado na plataforma

---

**🎉 Pronto! Agora os nutricionistas podem importar seus próprios dados de forma autônoma!**

