# API de Usuários

Documentação dos endpoints relacionados a usuários.

## Autenticação

Todos os endpoints requerem autenticação via `MASTER_KEY` no header:

```
Authorization: Bearer {MASTER_KEY}
```

---

## GET `/api/users/[userId]`

Busca informações completas de um usuário específico.

### Parâmetros de URL

- `userId` (string, obrigatório): ID do usuário

### Query Parameters

- `configId` (string, opcional): Filtra configurações de IA por ID específico
- `inboxId` (string, opcional): Filtra configurações de IA por inboxId específico

### Exemplos de Requisição

**Buscar todas as informações do usuário:**
```bash
GET /api/users/{userId}
Authorization: Bearer {MASTER_KEY}
```

**Filtrar por configId:**
```bash
GET /api/users/{userId}?configId={aiConfigId}
Authorization: Bearer {MASTER_KEY}
```

**Filtrar por inboxId:**
```bash
GET /api/users/{userId}?inboxId={inboxId}
Authorization: Bearer {MASTER_KEY}
```

**Filtrar por ambos:**
```bash
GET /api/users/{userId}?configId={aiConfigId}&inboxId={inboxId}
Authorization: Bearer {MASTER_KEY}
```

### Resposta de Sucesso (200)

```json
{
  "id": "user_id",
  "name": "Nome do Usuário",
  "email": "usuario@example.com",
  "emailVerified": "2024-01-01T00:00:00.000Z",
  "image": "https://...",
  "companyName": "Empresa",
  "stripeCustomerId": "cus_...",
  "stripePriceId": "price_...",
  "stripeSubscriptionId": "sub_...",
  "stripeSubscriptionStatus": "active",
  "manytalksAccountId": "account_id",
  "isIntegrationUser": false,
  "canCreateTemplates": true,
  "customCreditLimit": 10000,
  "isSuperAdmin": false,
  "aiConfigs": [
    {
      "id": "config_id",
      "userId": "user_id",
      "isActive": true,
      "detectarIdioma": false,
      "nomeAtendenteDigital": "Assistente",
      "enviarParaAtendente": true,
      "quemEhAtendente": "...",
      "oQueAtendenteFaz": "...",
      "objetivoAtendente": "...",
      "comoAtendenteDeve": "...",
      "horarioAtendimento": "09:00 às 18:00",
      "condicoesAtendimento": "...",
      "informacoesEmpresa": "...",
      "tempoRetornoAtendimento": "1 hora",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "inboxId": 123,
      "inboxName": "Inbox Principal",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "googleCalendarEnabled": true,
      "attachments": [
        {
          "id": "attachment_id",
          "type": "pdf",
          "description": "Documento",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "temasEvitar": [
        {
          "id": "tema_id",
          "tema": "Política",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "accounts": [
    {
      "id": "account_id",
      "userId": "user_id",
      "type": "oauth",
      "provider": "google",
      "providerAccountId": "123456",
      "refresh_token": "...",
      "access_token": "...",
      "expires_at": 1234567890,
      "token_type": "Bearer",
      "scope": "...",
      "id_token": "...",
      "session_state": "..."
    }
  ],
  "inboxes": [
    {
      "id": "inbox_id",
      "name": "Inbox Principal",
      "inboxId": "123",
      "userId": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "doneAt": null
    }
  ],
  "sessions": [
    {
      "id": "session_id",
      "sessionToken": "token",
      "userId": "user_id",
      "expires": "2024-01-01T00:00:00.000Z"
    }
  ],
  "whatsAppConnections": [
    {
      "id": "connection_id",
      "phoneNumber": "+5511999999999",
      "name": "WhatsApp Connection",
      "isActive": true,
      "webhookConfigured": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "aiConfig": {
        "id": "config_id",
        "nomeAtendenteDigital": "Assistente",
        "isActive": true
      }
    }
  ],
  "whatsappSummary": {
    "totalConnections": 5,
    "activeConnections": 3,
    "connectionsWithWebhook": 2,
    "connectionsWithAI": 3
  }
}
```

### Respostas de Erro

**401 Unauthorized**
```json
"Unauthorized"
```

**404 Not Found**
```json
"User not found"
```

**500 Internal Server Error**
```json
"Internal Server Error"
```

### Notas

- O campo `googleCalendarEnabled` está incluído em cada `aiConfig` para indicar se aquela configuração tem Google Calendar ativo (`true`) ou não (`false`)
- Os demais campos de Google Calendar foram removidos dos `aiConfigs` para melhorar a performance (use o endpoint `/api/users/[userId]/google-calendar` para obter detalhes completos)
- O campo `embedding` foi removido dos `aiConfigs` (é um JSON muito grande)
- O campo `content` dos `attachments` foi removido (apenas metadados são retornados)
- Os filtros `configId` e `inboxId` podem ser usados em conjunto ou separadamente
- Quando nenhum filtro é aplicado, todas as configurações do usuário são retornadas

---

## GET `/api/users/[userId]/filtered`

Endpoint otimizado para retornar dados do usuário com payload reduzido. Permite filtrar e incluir apenas os dados necessários, evitando respostas muito grandes.

### Parâmetros de URL

- `userId` (string, obrigatório): ID do usuário

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `inboxId` | string | Não | Filtra `aiConfigs` pelo ID numérico do inbox. Retorna apenas configurações daquele inbox. |
| `configId` | string | Não | Filtra `aiConfigs` pelo ID da configuração. Retorna apenas a configuração específica. |
| `isActive` | boolean | Não | Filtra `aiConfigs` por status ativo. Valores: `true` ou `false`. |
| `include` | string | Não | Lista separada por vírgula do que incluir na resposta. Valores: `aiConfigs`, `accounts`, `inboxes`, `sessions`, `whatsAppConnections`. **Padrão:** `aiConfigs`. |
| `aiConfigsDetail` | string | Não | Nível de detalhe dos `aiConfigs`. Valores: `minimal` (apenas campos essenciais) ou `full` (todos os campos). **Padrão:** `full`. |

### Filtros de aiConfigs

Os parâmetros `inboxId`, `configId` e `isActive` podem ser combinados. Exemplo: `?inboxId=123&isActive=true` retorna apenas configurações ativas daquele inbox.

### Campos em aiConfigsDetail=minimal

Quando `aiConfigsDetail=minimal`, cada aiConfig retorna apenas:
- `id`, `userId`, `isActive`, `nomeAtendenteDigital`
- `inboxId`, `inboxName`, `googleCalendarEnabled`
- `createdAt`, `updatedAt`

### Exemplos de Requisição

**Apenas dados básicos do usuário + aiConfigs de um inbox específico (payload mínimo):**
```bash
GET /api/users/{userId}/filtered?inboxId=123&aiConfigsDetail=minimal
Authorization: Bearer {MASTER_KEY}
```

**aiConfigs de um inbox, com detalhes completos:**
```bash
GET /api/users/{userId}/filtered?inboxId=123
Authorization: Bearer {MASTER_KEY}
```

**Apenas uma configuração específica:**
```bash
GET /api/users/{userId}/filtered?configId={aiConfigId}
Authorization: Bearer {MASTER_KEY}
```

**Apenas configurações ativas:**
```bash
GET /api/users/{userId}/filtered?isActive=true
Authorization: Bearer {MASTER_KEY}
```

**Incluir apenas inboxes (sem aiConfigs):**
```bash
GET /api/users/{userId}/filtered?include=inboxes
Authorization: Bearer {MASTER_KEY}
```

**Incluir múltiplas relações:**
```bash
GET /api/users/{userId}/filtered?include=aiConfigs,inboxes,whatsAppConnections&inboxId=123
Authorization: Bearer {MASTER_KEY}
```

**Combinação de filtros:**
```bash
GET /api/users/{userId}/filtered?inboxId=123&isActive=true&aiConfigsDetail=minimal
Authorization: Bearer {MASTER_KEY}
```

### Resposta de Sucesso (200)

A estrutura da resposta varia conforme os parâmetros `include` e `aiConfigsDetail`. Sempre inclui os campos básicos do usuário (`id`, `name`, `email`, etc.). Quando `include` contém `whatsAppConnections`, inclui também `whatsappSummary`.

Exemplo com `include=aiConfigs` e `aiConfigsDetail=minimal`:

```json
{
  "id": "user_id",
  "name": "Nome do Usuário",
  "email": "usuario@example.com",
  "emailVerified": "2024-01-01T00:00:00.000Z",
  "image": "https://...",
  "companyName": "Empresa",
  "stripeCustomerId": "cus_...",
  "stripePriceId": "price_...",
  "stripeSubscriptionId": "sub_...",
  "stripeSubscriptionStatus": "active",
  "manytalksAccountId": "account_id",
  "isIntegrationUser": false,
  "canCreateTemplates": true,
  "customCreditLimit": 10000,
  "isSuperAdmin": false,
  "aiConfigs": [
    {
      "id": "config_id",
      "userId": "user_id",
      "isActive": true,
      "nomeAtendenteDigital": "Assistente",
      "inboxId": 123,
      "inboxName": "Inbox Principal",
      "googleCalendarEnabled": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Respostas de Erro

**401 Unauthorized**
```json
"Unauthorized"
```

**404 Not Found**
```json
"User not found"
```

**500 Internal Server Error**
```json
"Internal Server Error"
```

### Notas

- Use este endpoint quando precisar de payloads menores (ex.: listagens, dashboards, webhooks)
- O endpoint `/api/users/[userId]` retorna sempre todos os dados; use `/filtered` quando quiser controle fino
- Em `aiConfigsDetail=full`, os `attachments` não incluem o campo `content` (apenas metadados)
- O campo `embedding` nunca é retornado em `aiConfigs`

---

## GET `/api/users/[userId]/google-calendar`

Busca informações específicas do Google Calendar de um usuário, incluindo integração e configurações.

### Parâmetros de URL

- `userId` (string, obrigatório): ID do usuário

### Query Parameters

- `configId` (string, opcional): Filtra configurações por ID específico

### Exemplos de Requisição

**Buscar todas as configurações de Google Calendar:**
```bash
GET /api/users/{userId}/google-calendar
Authorization: Bearer {MASTER_KEY}
```

**Filtrar por configId:**
```bash
GET /api/users/{userId}/google-calendar?configId={aiConfigId}
Authorization: Bearer {MASTER_KEY}
```

### Resposta de Sucesso (200)

```json
{
  "integration": {
    "id": "integration_id",
    "email": "usuario@gmail.com",
    "calendarId": "primary",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "configurations": [
    {
      "id": "config_id",
      "userId": "user_id",
      "isActive": true,
      "nomeAtendenteDigital": "Assistente",
      "googleCalendarEnabled": true,
      "calendarId": "primary",
      "defaultEventDuration": 60,
      "weeklySchedule": {
        "1": {
          "enabled": true,
          "start": "09:00",
          "end": "18:00",
          "hasBreak": true,
          "breakStart": "12:00",
          "breakEnd": "14:00"
        },
        "2": {
          "enabled": true,
          "start": "09:00",
          "end": "18:00",
          "hasBreak": false
        }
      },
      "minAdvanceTime": 1,
      "maxAdvanceTime": 30,
      "defaultReminder": 30,
      "reminderMessage": "Lembrete: você tem um evento agendado",
      "autoCreateEvents": true,
      "eventType": "video_call",
      "responsibleEmails": ["responsavel@example.com"],
      "aiPrompt": "Prompt personalizado para criação de eventos",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Respostas de Erro

**401 Unauthorized**
```json
"Unauthorized"
```

**500 Internal Server Error**
```json
"Internal Server Error"
```

### Notas

- O campo `integration` pode ser `null` se o usuário não tiver integração com Google Calendar
- O campo `configurations` sempre retorna um array (pode estar vazio)
- Quando `configId` não é fornecido, todas as configurações do usuário são retornadas
- Este endpoint foi criado para separar as informações de Google Calendar do endpoint principal, melhorando a organização e performance

---

## Campos Removidos para Performance

Os seguintes campos foram removidos do endpoint `/api/users/[userId]` para melhorar a performance:

### De `aiConfigs`:
- `embedding` (JSON muito grande)
- `calendarId`
- `defaultEventDuration`
- `weeklySchedule`
- `minAdvanceTime`
- `maxAdvanceTime`
- `defaultReminder`
- `reminderMessage`
- `autoCreateEvents`
- `eventType`
- `responsibleEmails`
- `aiPrompt`

### De `attachments`:
- `content` (conteúdo do arquivo, pode ser muito grande)

> **Nota:** Para obter informações de Google Calendar, use o endpoint `/api/users/[userId]/google-calendar`

