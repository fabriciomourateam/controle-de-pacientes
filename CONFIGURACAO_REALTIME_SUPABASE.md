# 🔔 Configuração do Supabase Realtime

## 📋 O que é necessário

Para que o sistema de notificações de mudanças em tempo real funcione, é necessário habilitar o **Realtime** no Supabase para as tabelas `patients` e `checkin`.

## 🚀 Como habilitar

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Database** → **Replication**
4. Encontre as tabelas `patients` e `checkin`
5. Ative o toggle de **Replication** para ambas as tabelas

### Opção 2: Via SQL Editor

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Habilitar Realtime para a tabela patients
ALTER PUBLICATION supabase_realtime ADD TABLE patients;

-- Habilitar Realtime para a tabela checkin
ALTER PUBLICATION supabase_realtime ADD TABLE checkin;
```

## ✅ Verificação

Após habilitar, o sistema irá:
- ✅ Detectar automaticamente quando alguém adiciona/edita/remove pacientes
- ✅ Detectar automaticamente quando alguém adiciona/edita/remove checkins
- ✅ Mostrar uma notificação no canto superior direito quando houver mudanças
- ✅ Permitir atualizar os dados com um clique no botão "Atualizar"

## 🔍 Como funciona

1. **Detecção em tempo real**: O Supabase Realtime monitora mudanças nas tabelas
2. **Notificação visual**: Quando uma mudança é detectada, aparece um card laranja no canto superior direito
3. **Atualização sob demanda**: Você escolhe quando atualizar clicando no botão "Atualizar"
4. **Atualização agendada**: Os dados também são atualizados automaticamente às 06h, 12h, 15h e 18h

## 💡 Benefícios

- **Economia de egress**: Não faz refetch automático a cada 2-5 minutos
- **Dados sempre atualizados**: Você é notificado quando há mudanças
- **Controle total**: Você decide quando atualizar os dados
- **Redução de ~95-98% no consumo de egress**

## ⚠️ Importante

Se o Realtime não estiver habilitado, o sistema ainda funcionará normalmente, mas:
- As notificações de mudanças em tempo real não aparecerão
- Você precisará atualizar manualmente ou aguardar as atualizações agendadas (4x ao dia)
