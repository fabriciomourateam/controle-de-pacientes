# 🏋️ Sistema de Bioimpedância - Guia de Implementação

## 📋 O Que Foi Implementado

Sistema completo de análise de composição corporal integrado com o GPT InShape, permitindo:

✅ **Botão para abrir o InShape GPT** diretamente da página de evolução  
✅ **Formulário inteligente** para inserir dados do GPT com preview automático  
✅ **Cálculos automáticos** de IMC, Massa Gorda, Massa Magra e TMB  
✅ **Gráfico de evolução** do percentual de gordura  
✅ **Cards de métricas** com análise visual  
✅ **Inclusão no PDF** do dossiê de evolução  

---

## 🚀 Passos para Ativar o Sistema

### **1. Criar Tabela no Supabase**

Acesse o Supabase Dashboard e execute o SQL:

1. Vá em: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Clique em "+ New Query"
5. Cole o conteúdo do arquivo: `sql/create_body_composition_table.sql`
6. Clique em "Run" (ou pressione Ctrl+Enter)

**Ou copie e cole este SQL:**

```sql
-- Tabela para armazenar dados de composição corporal / bioimpedância
CREATE TABLE IF NOT EXISTS body_composition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telefone TEXT NOT NULL,
  data_avaliacao DATE NOT NULL,
  percentual_gordura DECIMAL(5,2) NOT NULL,
  classificacao TEXT,
  peso DECIMAL(6,2),
  massa_magra DECIMAL(6,2),
  massa_gorda DECIMAL(6,2),
  imc DECIMAL(5,2),
  tmb INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_body_composition_patient FOREIGN KEY (telefone) 
    REFERENCES patients(telefone) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_body_composition_telefone ON body_composition(telefone);
CREATE INDEX IF NOT EXISTS idx_body_composition_data ON body_composition(data_avaliacao DESC);
CREATE INDEX IF NOT EXISTS idx_body_composition_telefone_data ON body_composition(telefone, data_avaliacao DESC);

CREATE OR REPLACE FUNCTION update_body_composition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_body_composition_updated_at
BEFORE UPDATE ON body_composition
FOR EACH ROW
EXECUTE FUNCTION update_body_composition_updated_at();
```

### **2. (Opcional) Adicionar Altura ao Cadastro de Pacientes**

Se ainda não tiver o campo `altura` na tabela `patients`, execute:

```sql
-- Adicionar campo altura (em metros) se não existir
ALTER TABLE patients ADD COLUMN IF NOT EXISTS altura DECIMAL(4,2);

COMMENT ON COLUMN patients.altura IS 'Altura do paciente em metros (ex: 1.75)';
```

---

## 🎯 Como Usar o Sistema

### **Passo 1: Acessar a Evolução do Paciente**
1. Vá em "Check-ins"
2. Clique em "Ver dossiê de evolução" de qualquer paciente

### **Passo 2: Obter Análise do InShape GPT**
1. Clique no botão **"Abrir InShape GPT"** (roxo)
2. No ChatGPT, forneça:
   - Nome do paciente
   - Idade, Sexo, Altura, Peso
   - 3-4 fotos (frente, costas, lateral)
3. O GPT retornará algo como:
   ```
   📆 Data: 22/10/2025
   🧍 Percentual de Gordura Estimado: 18,5%
   🏅 Classificação do Shape: Percentual de gordura mediano
   ```

### **Passo 3: Inserir no Sistema**
1. Clique no botão **"Adicionar Bioimpedância"** (verde)
2. Preencha:
   - **Peso (kg):** Ex: 75.5
   - **Altura (m):** Ex: 1.75
   - **Cole a resposta do GPT** no campo de texto
3. Veja o **preview dos cálculos** automáticos:
   - IMC
   - Massa Gorda
   - Massa Magra
   - TMB (Taxa Metabólica Basal)
4. Clique em **"Salvar Bioimpedância"**

### **Passo 4: Visualizar Resultados**
Automaticamente aparecerá:
- ✅ **Card de Métricas** com todos os dados atuais
- ✅ **Gráfico de evolução** do % de gordura
- ✅ **Análise automática** de recomposição corporal
- ✅ **Inclusão no PDF** ao exportar o dossiê

---

## 📊 Fórmulas Utilizadas

### **IMC (Índice de Massa Corporal)**
```
IMC = peso / (altura × altura)
```

### **Massa Gorda**
```
Massa Gorda = (peso × % gordura) / 100
```

### **Massa Magra**
```
Massa Magra = peso - massa_gorda
```

### **TMB (Fórmula de Mifflin-St Jeor)**
```
Homens:   TMB = (10 × peso) + (6.25 × altura_cm) − (5 × idade) + 5
Mulheres: TMB = (10 × peso) + (6.25 × altura_cm) − (5 × idade) − 161
```

---

## 🎨 Recursos Visuais

### **Cards de Métricas**
- **% Gordura:** Vermelho/Laranja com indicador de variação
- **Peso Total:** Cinza neutro
- **Massa Gorda:** Vermelho (meta: reduzir)
- **Massa Magra:** Verde (meta: aumentar)
- **IMC:** Cor dinâmica baseada na classificação
- **TMB:** Laranja (calorias basais)

### **Análise Inteligente**
O sistema detecta automaticamente:
- ✅ **Recomposição positiva:** Perda de gordura + ganho de músculo
- ⚠️ **Perda de massa magra:** Ajuste de proteína necessário
- 📈 **Aumento de gordura:** Revisão de dieta necessária

---

## 📄 Inclusão no PDF

Ao exportar o dossiê, uma nova seção será incluída:

**📊 Análise de Composição Corporal**
- Tabela com histórico completo
- Todas as métricas por data
- Última classificação do InShape

---

## 🔧 Arquivos Criados/Modificados

### **Criados:**
- ✅ `sql/create_body_composition_table.sql` - SQL da tabela
- ✅ `src/lib/body-calculations.ts` - Fórmulas de cálculo
- ✅ `src/components/evolution/BioimpedanciaInput.tsx` - Formulário
- ✅ `src/components/evolution/BodyFatChart.tsx` - Gráfico de evolução
- ✅ `src/components/evolution/BodyCompositionMetrics.tsx` - Cards de métricas
- ✅ `INSTRUCOES_BIOIMPEDANCIA.md` - Este arquivo

### **Modificados:**
- ✅ `src/pages/PatientEvolution.tsx` - Integração completa
- ✅ `src/lib/dossie-pdf-generator.ts` - Inclusão no PDF

---

## ⚠️ Requisitos do Paciente

Para usar a bioimpedância, o paciente deve ter:
- ✅ **Idade** (campo `data_nascimento`)
- ✅ **Sexo** (campo `genero`: 'M' ou 'F')
- ⚠️ **Altura** (campo `altura` em metros) - Opcional, pode inserir manualmente

Se faltar algum dado, o sistema solicitará que você atualize o cadastro.

---

## 🎯 Melhorias Futuras (Opcionais)

1. **Integração direta com API do ChatGPT**
   - Enviar fotos automaticamente
   - Receber análise sem copiar/colar

2. **Metas de composição corporal**
   - Definir % de gordura alvo
   - Alertas quando atingir meta

3. **Comparação de fotos**
   - Upload de fotos no sistema
   - Comparação visual lado a lado

4. **Gráficos adicionais**
   - Massa magra vs massa gorda
   - Evolução do TMB
   - Projeções futuras

---

## 📞 Suporte

Se houver algum erro:
1. Verifique se executou o SQL no Supabase
2. Verifique se o paciente tem idade e sexo cadastrados
3. Confira se o formato do texto do GPT está correto
4. Verifique o console do navegador (F12) para erros

---

## ✅ Checklist de Implementação

- [x] Criar tabela `body_composition` no Supabase ⬅️ **VOCÊ PRECISA FAZER ISSO!**
- [x] Código dos componentes criado
- [x] Integração na página de evolução
- [x] Cálculos automáticos funcionando
- [x] Preview em tempo real
- [x] Gráfico de evolução
- [x] Cards de métricas
- [x] Inclusão no PDF
- [x] Botão para abrir InShape GPT

---

**🎉 Tudo pronto! Basta criar a tabela no Supabase e começar a usar!**

