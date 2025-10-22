# 📸 Sistema de Dados Iniciais do Paciente

## 📋 **VISÃO GERAL**

Sistema para cadastrar **fotos, peso, altura e medidas iniciais** do paciente **ANTES do primeiro check-in**, criando uma baseline perfeita para comparação de evolução.

---

## 🎯 **PRINCIPAIS FUNCIONALIDADES**

### ✅ **O que pode ser cadastrado:**

1. **📸 Fotos Iniciais:**
   - Foto Frontal
   - Foto Lateral
   - Foto de Costas

2. **⚖️ Medidas Iniciais:**
   - Peso (kg)
   - Altura (m)
   - Cintura (cm)
   - Quadril (cm)

3. **📅 Data:**
   - Data em que as fotos/medidas foram tiradas

---

## 🚀 **COMO USAR**

### **1️⃣ Configurar o Banco de Dados**

Execute o script SQL no Supabase:

```sql
-- Arquivo: sql/add_initial_patient_data.sql
-- Execute no Supabase SQL Editor
```

Este script adiciona as seguintes colunas na tabela `patients`:
- `foto_inicial_frente`
- `foto_inicial_lado`
- `foto_inicial_costas`
- `data_fotos_iniciais`
- `peso_inicial`
- `altura_inicial`
- `medida_cintura_inicial`
- `medida_quadril_inicial`

---

### **2️⃣ Configurar Storage no Supabase**

1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Crie um bucket chamado **`patient-photos`**
4. Configure as permissões:

```sql
-- Permitir upload de fotos (autenticado)
CREATE POLICY "Permitir upload de fotos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-photos');

-- Permitir leitura pública
CREATE POLICY "Permitir leitura pública"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'patient-photos');
```

---

### **3️⃣ Cadastrar Dados Iniciais**

#### **Acesso via Página de Pacientes:**

1. Acesse **Pacientes** (`/patients`)
2. Clique nos **3 pontinhos** (⋯) do paciente
3. Selecione **"Ver Evolução"**
4. Se não houver check-ins, verá o card de boas-vindas
5. Clique em **"Adicionar Dados Iniciais"**

#### **No Modal:**

1. **Selecione a data** dos registros
2. **Preencha as medidas** (peso, altura, cintura, quadril)
3. **Faça upload das fotos:**
   - Clique nos botões de upload
   - Selecione as imagens
   - Preview aparece imediatamente
4. **Salve**

---

## 📊 **ONDE OS DADOS APARECEM**

### **1. Comparação de Fotos (Antes/Depois)**

Quando há fotos iniciais:
- A foto inicial aparece como **"BASELINE"** (badge roxo ⭐)
- É usada como referência na comparação antes/depois
- Prioridade sobre a primeira foto de check-in

### **2. Galeria Completa**

- Fotos iniciais aparecem **primeiro** na galeria
- Badge roxo com estrela (⭐) para destaque
- Data e peso exibidos abaixo

### **3. Métricas de Evolução**

- Peso inicial usado nos cálculos de perda/ganho
- Medidas de cintura/quadril podem ser usadas futuras análises

---

## 🔄 **FLUXO COMPLETO**

```
┌─────────────────────────────────────────┐
│  DIA 0: Paciente Novo                   │
├─────────────────────────────────────────┤
│  1. Cadastra paciente                   │
│  2. Acessa "Ver Evolução"               │
│  3. Clica "Adicionar Dados Iniciais"    │
│  4. Upload fotos + medidas              │
│  5. Salva ✅                             │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  DIA 7: Primeiro Check-in               │
├─────────────────────────────────────────┤
│  - Dados iniciais aparecem como baseline│
│  - Comparação automática com DIA 0      │
│  - Gráficos mostram evolução desde DIA 0│
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  DIA 30: Análise de Evolução            │
├─────────────────────────────────────────┤
│  - Timeline completa desde DIA 0        │
│  - PDF inclui fotos/medidas iniciais    │
│  - Progresso real documentado           │
└─────────────────────────────────────────┘
```

---

## 🎨 **INTERFACE DO USUÁRIO**

### **Card de Boas-Vindas (Sem Check-ins)**

```
┌─────────────────────────────────────────┐
│  📊 Nenhum check-in registrado ainda    │
│                                          │
│  📊 Cadastrar bioimpedâncias            │
│  📸 Registrar check-in com fotos        │
│  📈 Acompanhar métricas                 │
│                                          │
│  [📸 Adicionar Dados Iniciais]  ← NOVO! │
│  [📊 Adicionar Bioimpedância]           │
│  [← Voltar]                              │
└─────────────────────────────────────────┘
```

### **Modal de Dados Iniciais**

```
┌─────────────────────────────────────────┐
│  📸 Dados Iniciais - João Silva         │
├─────────────────────────────────────────┤
│  📅 Data: [21/10/2024]                  │
│                                          │
│  ⚖️ Peso: [75.5] kg                     │
│  📏 Altura: [1.75] m                    │
│  📐 Cintura: [85] cm                    │
│  📐 Quadril: [95] cm                    │
│                                          │
│  📷 Foto Frontal:  [Upload] 🖼️          │
│  📷 Foto Lateral:  [Upload] 🖼️          │
│  📷 Foto Costas:   [Upload] 🖼️          │
│                                          │
│  [Cancelar]  [💾 Salvar Dados Iniciais] │
└─────────────────────────────────────────┘
```

---

## 💡 **CASOS DE USO**

### **✅ Caso 1: Novo Paciente**

**Situação:** Paciente acabou de se inscrever, sem histórico.

**Solução:**
1. Cadastra dados iniciais (fotos + medidas)
2. Já tem baseline para comparação futura
3. Primeiro check-in já mostra evolução

### **✅ Caso 2: Paciente com Histórico Externo**

**Situação:** Paciente tinha fotos/medidas de outro lugar.

**Solução:**
1. Faz upload das fotos antigas como "dados iniciais"
2. Define data correta (ex: 3 meses atrás)
3. Timeline mostra evolução desde então

### **✅ Caso 3: Avaliação Física Inicial**

**Situação:** Fez avaliação presencial no DIA 1.

**Solução:**
1. Cadastra fotos + medidas da avaliação
2. Bioimpedância separada (se tiver)
3. Check-ins começam depois

---

## 🔐 **SEGURANÇA E PRIVACIDADE**

- ✅ **Upload seguro** via Supabase Storage
- ✅ **URLs públicas** mas não listáveis
- ✅ **Vinculação por telefone** do paciente
- ✅ **Backup automático** no banco de dados
- ✅ **Fotos otimizadas** antes do upload

---

## 🐛 **RESOLUÇÃO DE PROBLEMAS**

### **"Erro ao fazer upload da foto"**

**Causa:** Bucket `patient-photos` não existe ou sem permissões.

**Solução:**
1. Criar bucket no Supabase Storage
2. Configurar políticas de acesso
3. Testar upload manualmente

### **"Dados não aparecem após salvar"**

**Causa:** Colunas não existem no banco.

**Solução:**
1. Execute o script SQL `add_initial_patient_data.sql`
2. Verifique se as colunas foram criadas
3. Recarregue a página

### **"Fotos não aparecem na comparação"**

**Causa:** Patient não está sendo passado para PhotoComparison.

**Solução:**
1. Verifique se `patient` está sendo carregado
2. Confirme prop no `<PhotoComparison patient={patient} />`
3. Limpe cache do navegador (Ctrl+Shift+R)

---

## 📚 **ARQUIVOS RELACIONADOS**

### **SQL:**
- `sql/add_initial_patient_data.sql` - Script de criação das colunas

### **Componentes:**
- `src/components/evolution/InitialDataInput.tsx` - Modal de cadastro
- `src/components/evolution/PhotoComparison.tsx` - Comparação de fotos
- `src/pages/PatientEvolution.tsx` - Página principal

### **Tipos:**
- Colunas adicionadas na tabela `patients`:
  - `foto_inicial_frente: TEXT`
  - `foto_inicial_lado: TEXT`
  - `foto_inicial_costas: TEXT`
  - `data_fotos_iniciais: DATE`
  - `peso_inicial: DECIMAL(6,2)`
  - `altura_inicial: DECIMAL(5,2)`
  - `medida_cintura_inicial: DECIMAL(6,2)`
  - `medida_quadril_inicial: DECIMAL(6,2)`

---

## ✨ **PRÓXIMAS MELHORIAS (FUTURAS)**

1. **Edição de dados iniciais** (atualizar fotos/medidas)
2. **Compressão automática de imagens** antes do upload
3. **Captura por câmera** (mobile)
4. **Comparação lado-a-lado** com slider
5. **Análise automática de mudanças** (IA visual)
6. **Exportar evolução** para redes sociais

---

## 🎉 **CONCLUSÃO**

O sistema de dados iniciais permite criar uma **baseline perfeita** para acompanhamento de evolução, mesmo antes do primeiro check-in. Isso garante que **todo o progresso seja documentado** desde o início da jornada do paciente!

---

**Desenvolvido com ❤️ para InShape**

