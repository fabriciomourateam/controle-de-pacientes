# 🔑 Documentação da API - Controle de Pacientes

## 📋 **Visão Geral**

Esta API permite integração externa com o sistema de controle de pacientes usando API Keys para autenticação.

**Base URL:** `https://seu-dominio.com/api`

## 🔐 **Autenticação**

Todas as requisições devem incluir a API Key no header:

```http
Authorization: Bearer sk_sua_chave_api_aqui
```

## 📚 **Endpoints Disponíveis**

### **1. Pacientes** 👥

#### **GET /api/patients**
Lista todos os pacientes do usuário.

**Headers:**
```http
Authorization: Bearer sk_sua_chave_api_aqui
Content-Type: application/json
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "plano": "Mensal",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### **2. Checkins** ✅

#### **GET /api/checkins**
Lista todos os checkins do usuário.

**Headers:**
```http
Authorization: Bearer sk_sua_chave_api_aqui
Content-Type: application/json
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "score": 8.5,
      "feedback": "Ótimo atendimento",
      "notes": "Paciente satisfeito",
      "created_at": "2024-01-15T10:30:00Z",
      "patients": {
        "name": "João Silva",
        "email": "joao@email.com",
        "telefone": "(11) 99999-9999"
      }
    }
  ],
  "count": 1
}
```

#### **POST /api/checkins**
Cria um novo checkin.

**Headers:**
```http
Authorization: Bearer sk_sua_chave_api_aqui
Content-Type: application/json
```

**Body:**
```json
{
  "patient_id": "uuid_do_paciente",
  "score": 8.5,
  "feedback": "Ótimo atendimento",
  "notes": "Paciente satisfeito"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patient_id": "uuid_do_paciente",
    "score": 8.5,
    "feedback": "Ótimo atendimento",
    "notes": "Paciente satisfeito",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Checkin criado com sucesso"
}
```

### **3. Métricas** 📊

#### **GET /api/metrics**
Lista métricas do dashboard.

**Headers:**
```http
Authorization: Bearer sk_sua_chave_api_aqui
Content-Type: application/json
```

**Query Parameters:**
- `period` (opcional): Número de meses (padrão: 12)

**Exemplo:**
```http
GET /api/metrics?period=6
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "id": "uuid",
        "mes": "Janeiro",
        "ano": 2024,
        "percentual_renovacao": 0.85,
        "percentual_churn": 0.05,
        "crescimento_mensal": 15.5,
        "entraram": 10,
        "sairam": 2
      }
    ],
    "statistics": {
      "totalPatients": 1,
      "avgRetention": 85.0,
      "avgChurn": 5.0,
      "totalGrowth": 15.5
    },
    "period": 6
  }
}
```

## 🚀 **Exemplos de Uso**

### **JavaScript/Node.js**
```javascript
const apiKey = 'sk_sua_chave_api_aqui';
const baseURL = 'https://seu-dominio.com/api';

// Buscar pacientes
async function getPatients() {
  const response = await fetch(`${baseURL}/patients`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data;
}

// Criar checkin
async function createCheckin(patientId, score, feedback) {
  const response = await fetch(`${baseURL}/checkins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      patient_id: patientId,
      score: score,
      feedback: feedback
    })
  });
  
  const data = await response.json();
  return data;
}
```

### **Python**
```python
import requests

api_key = 'sk_sua_chave_api_aqui'
base_url = 'https://seu-dominio.com/api'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Buscar pacientes
def get_patients():
    response = requests.get(f'{base_url}/patients', headers=headers)
    return response.json()

# Criar checkin
def create_checkin(patient_id, score, feedback):
    data = {
        'patient_id': patient_id,
        'score': score,
        'feedback': feedback
    }
    response = requests.post(f'{base_url}/checkins', headers=headers, json=data)
    return response.json()
```

### **cURL**
```bash
# Buscar pacientes
curl -X GET "https://seu-dominio.com/api/patients" \
  -H "Authorization: Bearer sk_sua_chave_api_aqui" \
  -H "Content-Type: application/json"

# Criar checkin
curl -X POST "https://seu-dominio.com/api/checkins" \
  -H "Authorization: Bearer sk_sua_chave_api_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "uuid_do_paciente",
    "score": 8.5,
    "feedback": "Ótimo atendimento"
  }'
```

## 🔧 **Códigos de Status HTTP**

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado (API Key inválida)
- **405**: Método não permitido
- **500**: Erro interno do servidor

## 🛡️ **Segurança**

- **API Keys** são necessárias para todas as requisições
- **Rate limiting** pode ser implementado
- **HTTPS** é obrigatório em produção
- **Validação** de dados em todos os endpoints

## 📈 **Casos de Uso**

### **1. Aplicativo Mobile**
- Sincronizar pacientes offline
- Enviar checkins em tempo real
- Visualizar métricas

### **2. Automação (N8N/Zapier)**
- Trigger em novos pacientes
- Envio de e-mails automáticos
- Sincronização com planilhas

### **3. Integração com Notion**
- Backup automático de dados
- Relatórios personalizados
- Dashboard externo

### **4. Webhooks**
- Notificações em tempo real
- Integração com Discord/Slack
- Alertas de sistema

## 🚀 **Próximos Passos**

1. **Teste os endpoints** com sua API Key
2. **Implemente integrações** conforme necessário
3. **Monitore o uso** das API Keys
4. **Expanda funcionalidades** conforme demanda

**🎉 Sua API está pronta para integrações!**
