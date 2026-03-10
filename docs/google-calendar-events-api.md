# API de Eventos do Google Calendar

Esta API permite listar e criar eventos em agendas do Google Calendar de qualquer usuário integrado ao sistema, utilizando autenticação via Bearer Token (JWT).

## Autenticação

- Todas as rotas exigem o header:
  - `Authorization: Bearer <SEU_TOKEN_JWT>`
- O token pode ser de qualquer usuário válido (ex: master). O userId a ser consultado é passado na query string.

---

## Listar eventos de uma agenda

**GET** `/api/integrations/google-calendar/events`

### Parâmetros de Query
- `userId` (obrigatório): ID do usuário dono da integração do Google Calendar
- `calendarId` (opcional): ID da agenda (default: primary)
- `timeMin` (opcional): Data/hora inicial (ISO 8601)
- `timeMax` (opcional): Data/hora final (ISO 8601)
- Outros parâmetros do Google Calendar API podem ser suportados (ex: `q`, `maxResults`, etc.)

### Exemplo de requisição
```sh
curl -X GET "http://localhost:3000/api/integrations/google-calendar/events?userId=cmdeoog4a0000yyflt2n7zkxh&calendarId=SEU_CALENDAR_ID&timeMin=2024-07-25T00:00:00Z&timeMax=2024-07-26T00:00:00Z" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Exemplo de resposta
```json
{
  "events": [
    {
      "id": "abc123",
      "summary": "Reunião",
      "start": { "dateTime": "2024-07-25T10:00:00-03:00" },
      "end": { "dateTime": "2024-07-25T11:00:00-03:00" },
      // ...outros campos do Google Calendar
    }
  ]
}
```

---

## Horários disponíveis (para IA)

**GET** `/api/integrations/google-calendar/available-slots`

Retorna slots disponíveis considerando `weeklySchedule` e eventos já agendados no Google Calendar. Apenas horários futuros.

### Quando usar

Use este endpoint quando a IA precisar **mostrar horários disponíveis** para o usuário agendar. Fluxo típico:

1. Usuário pede para agendar → IA chama `available-slots`
2. IA exibe as opções ao usuário
3. Usuário escolhe um horário → IA chama `POST /events` para criar o evento

### Janela de dias

Os slots retornados vão de **hoje** (apenas horários futuros) até **daqui a X dias**, onde X = `maxAdvanceTime` da AIConfig (padrão 30). O `minAdvanceTime` define quantas horas à frente começar (ex.: 1 = não mostrar slots na próxima 1 hora).

### Parâmetros de Query

| Parâmetro   | Obrigatório | Descrição                                                                 |
|------------|-------------|---------------------------------------------------------------------------|
| `userId`   | Sim*        | ID do usuário dono da integração. *Obrigatório quando usa MASTER_KEY*    |
| `configId` | Não         | ID da AIConfig. Se omitido, usa a primeira com Google Calendar ativo     |
| `timezone` | Não         | Timezone para os horários. Default: `America/Sao_Paulo`                   |
| `timeMin`  | Não         | Início da janela (ISO 8601). Quando omitido, usa `minAdvanceTime` da config |
| `timeMax`  | Não         | Fim da janela (ISO 8601). Quando omitido, usa `maxAdvanceTime` da config   |

### Autenticação

**Opção 1 – MASTER_KEY (recomendado para n8n/webhooks):**
```http
Authorization: Bearer {MASTER_KEY}
```
Envie `userId` na query: `?userId=xxx`

**Opção 2 – JWT:**
```http
Authorization: Bearer {JWT_TOKEN}
```
O `userId` é extraído do token. Não precisa enviar na query.

### Exemplo de requisição (MASTER_KEY)

```sh
curl -X GET "https://seu-dominio.com/api/integrations/google-calendar/available-slots?userId=cmdeoog4a0000yyflt2n7zkxh" \
  -H "Authorization: Bearer SUA_MASTER_KEY"
```

### Exemplo com configId e timezone

```sh
curl -X GET "https://seu-dominio.com/api/integrations/google-calendar/available-slots?userId=xxx&configId=yyy&timezone=America/Sao_Paulo" \
  -H "Authorization: Bearer SUA_MASTER_KEY"
```

### Exemplo com timeMin e timeMax (filtrar por período)

```sh
curl -X GET "https://seu-dominio.com/api/integrations/google-calendar/available-slots?userId=xxx&timeMin=2025-03-10T00:00:00-03:00&timeMax=2025-03-15T23:59:59-03:00" \
  -H "Authorization: Bearer SUA_MASTER_KEY"
```

### Resposta de sucesso (200)

```json
{
  "slots": [
    { "start": "2024-07-25T13:00:00.000Z", "end": "2024-07-25T14:00:00.000Z" },
    { "start": "2024-07-25T15:00:00.000Z", "end": "2024-07-25T16:00:00.000Z" }
  ]
}
```

### Respostas de erro

| Status | Descrição |
|--------|-----------|
| 401 | Token inválido ou MASTER_KEY sem userId na query |
| 403 | Usuário sem acesso ao Google Calendar (feature flag) |
| 404 | Integração ou configuração não encontrada |
| 401 + `requiresReauth: true` | Token do Google expirado – reconectar conta |

### Uso no n8n

1. Nó **HTTP Request**
2. Method: GET
3. URL: `{{$env.APP_URL}}/api/integrations/google-calendar/available-slots?userId={{userId}}`
4. Authentication: Header Auth → `Authorization: Bearer {{$env.MASTER_KEY}}`
5. O `userId` vem do contexto da conversa (ex.: do payload do webhook)

---

## Criar evento em uma agenda

**POST** `/api/integrations/google-calendar/events`

### Body (JSON)
- `userId` (obrigatório): ID do usuário dono da integração do Google Calendar
- `calendarId` (opcional): ID da agenda (default: primary)
- Demais campos: todos os campos aceitos pela Google Calendar API para eventos (summary, description, start, end, attendees, etc.)

### Exemplo de requisição
```sh
curl -X POST "http://localhost:3000/api/integrations/google-calendar/events" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cmdeoog4a0000yyflt2n7zkxh",
    "calendarId": "SEU_CALENDAR_ID",
    "summary": "Reunião de Teste",
    "description": "Descrição do evento",
    "start": { "dateTime": "2024-07-25T10:00:00-03:00" },
    "end": { "dateTime": "2024-07-25T11:00:00-03:00" }
  }'
```

### Exemplo de resposta
```json
{
  "event": {
    "id": "abc123",
    "summary": "Reunião de Teste",
    "start": { "dateTime": "2024-07-25T10:00:00-03:00" },
    "end": { "dateTime": "2024-07-25T11:00:00-03:00" },
    // ...outros campos do Google Calendar
  }
}
```

---

## Observações
- O campo `userId` é obrigatório para garantir que a consulta/criação seja feita para o usuário correto.
- O token JWT precisa ser válido, mas não precisa ser do mesmo usuário do userId consultado.
- Todos os parâmetros aceitos pela Google Calendar API podem ser usados.
- Para mais detalhes sobre os campos de eventos, consulte a [documentação oficial do Google Calendar API](https://developers.google.com/calendar/api/v3/reference/events). 