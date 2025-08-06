# Integração com Google Calendar

## Visão Geral
Este documento descreve o planejamento para implementação da integração com o Google Calendar no sistema de agente de IA. Cada conta de usuário poderá sincronizar uma conta do Google Calendar.

## Fluxo de Implementação

### 1. Configuração Inicial (Seção de Configurações)
- Implementar autenticação OAuth2 com Google
- Criar tela para o usuário autorizar acesso ao Google Calendar
- Armazenar tokens de acesso e refresh de forma segura no banco de dados
- Permitir desconexão da conta Google quando necessário

### 2. Modelo de Dados
```prisma
// Adicionar à schema.prisma
model GoogleCalendarIntegration {
  id            String   @id @default(cuid())
  userId        String   @unique
  accessToken   String
  refreshToken  String
  expiresAt     DateTime
  calendarId    String?  // ID do calendário principal ou selecionado
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Adicionar à model AIConfig
model AIConfig {
  // campos existentes...
  
  // Campos para Google Calendar
  googleCalendarEnabled Boolean @default(false)
  defaultEventDuration  Int?    // em minutos
  workingHoursStart     String? // formato "HH:MM"
  workingHoursEnd       String? // formato "HH:MM"
  allowedDays           String? // formato JSON: ["1","2","3","4","5"] (1=segunda)
  minAdvanceTime        Int?    // em horas
  maxAdvanceTime        Int?    // em dias
  defaultReminder       Int?    // em minutos
}
```

### 3. Formulário de Configuração do Agente

#### Seção: Integração com Google Agenda
- Toggle para ativar/desativar integração
- Nota informando que é necessário conectar a conta do Google em Configurações

#### Seção: Configurações Básicas
- Dropdown para seleção do calendário (buscar da conta conectada)
- Dropdown para duração padrão dos eventos:
  - 30 minutos
  - 1 hora
  - 1 hora e 30 minutos
  - 2 horas

#### Seção: Restrições de Agendamento
- Inputs para horário de funcionamento (início e fim)
- Checkboxes para dias permitidos da semana
- Inputs para antecedência mínima (horas) e máxima (dias)

#### Seção: Comportamento do Agente
- Radio button para escolher entre:
  - Criar evento automaticamente após coletar informações
  - Sempre pedir confirmação antes de criar
- Dropdown para lembrete padrão:
  - 10 minutos antes
  - 30 minutos antes
  - 1 hora antes
  - 1 dia antes

### 4. Backend API

#### Endpoints Necessários
1. `POST /api/integrations/google-calendar/auth`
   - Inicia o fluxo de autenticação OAuth2

2. `GET /api/integrations/google-calendar/callback`
   - Callback para o OAuth2
   - Salva tokens no banco de dados

3. `GET /api/integrations/google-calendar/calendars`
   - Lista calendários disponíveis na conta conectada

4. `POST /api/integrations/google-calendar/disconnect`
   - Remove a integração

5. `POST /api/integrations/google-calendar/create-event`
   - Endpoint para o agente criar eventos
   - Parâmetros: título, data, hora, duração, etc.

### 5. Funcionalidades do Agente

#### Detecção de Intenção
- Implementar lógica para identificar quando o usuário deseja agendar algo
- Usar NLP para extrair data, hora e assunto da mensagem

#### Criação de Eventos
- Verificar disponibilidade no calendário
- Criar evento usando a API do Google Calendar
- Retornar confirmação ao usuário

#### Verificação de Configurações
- Checar se a integração está ativa antes de tentar criar eventos
- Validar se o horário solicitado está dentro das restrições configuradas

## Cronograma de Implementação

1. **Semana 1**: Configuração da autenticação OAuth2 e armazenamento de tokens
2. **Semana 2**: Implementação do modelo de dados e endpoints da API
3. **Semana 3**: Desenvolvimento do formulário de configuração do agente
4. **Semana 4**: Implementação da lógica do agente para detecção e criação de eventos
5. **Semana 5**: Testes, correções e documentação

## Considerações Técnicas

- Usar biblioteca oficial do Google para Node.js
- Implementar refresh automático de tokens
- Garantir segurança no armazenamento de tokens (criptografia)
- Considerar limites de API do Google Calendar
- Implementar tratamento de erros robusto 