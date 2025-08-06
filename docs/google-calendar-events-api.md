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