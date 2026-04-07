# Migração do Google Calendar para Produção

Esta migração adiciona todos os campos necessários para a integração com Google Calendar no banco de dados de produção.

## O que esta migração faz:

1. **Cria a tabela `GoogleCalendarIntegration`** (se não existir)
   - Armazena tokens de acesso OAuth do Google Calendar
   - Relacionamento com a tabela `User`

2. **Adiciona campos na tabela `AIConfig`** (se não existirem):
   - `googleCalendarEnabled` - Ativa/desativa integração
   - `calendarId` - ID do calendário selecionado
   - `defaultEventDuration` - Duração padrão dos eventos
   - `weeklySchedule` - Horários semanais (JSON)
   - `minAdvanceTime` - Antecedência mínima
   - `maxAdvanceTime` - Antecedência máxima
   - `defaultReminder` - Lembrete padrão
   - `reminderMessage` - Mensagem do lembrete
   - `autoCreateEvents` - Criar eventos automaticamente
   - `eventType` - Tipo de evento (video_call/presencial)
   - `responsibleEmails` - Emails dos responsáveis
   - `aiPrompt` - Prompt personalizado para IA
   - `enableScarcityMode` - Ativa gatilho de escassez
   - `maxSlotsToShow` - Quantidade de horários a exibir

## Como executar na VPS:

### Opção 1: Via psql (recomendado)

```bash
# Conecte-se ao banco de dados
psql -h localhost -U seu_usuario -d many_ia

# Execute a migração
\i prisma/migrations/add_google_calendar_integration_production.sql

# Ou execute diretamente:
psql -h localhost -U seu_usuario -d many_ia -f prisma/migrations/add_google_calendar_integration_production.sql
```

### Opção 2: Via Prisma Migrate (se configurado)

```bash
# No servidor, execute:
npx prisma migrate deploy
```

### Opção 3: Copiar e colar no cliente SQL

1. Abra o arquivo `add_google_calendar_integration_production.sql`
2. Copie todo o conteúdo
3. Cole no cliente SQL (pgAdmin, DBeaver, etc.)
4. Execute

## Segurança

✅ Esta migração é **segura** e pode ser executada múltiplas vezes:
- Usa `IF NOT EXISTS` para evitar erros
- Não remove dados existentes
- Não altera dados existentes
- Apenas adiciona campos com valores padrão

## Verificação

Após executar, verifique se tudo foi criado corretamente:

```sql
-- Verificar se a tabela foi criada
SELECT * FROM "GoogleCalendarIntegration" LIMIT 1;

-- Verificar se os campos foram adicionados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AIConfig' 
AND column_name IN (
    'googleCalendarEnabled',
    'calendarId',
    'enableScarcityMode',
    'maxSlotsToShow'
);
```

## Rollback (se necessário)

Se precisar reverter a migração:

```sql
-- Remover campos da AIConfig (CUIDADO: isso apagará os dados!)
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "googleCalendarEnabled";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "calendarId";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "defaultEventDuration";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "weeklySchedule";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "minAdvanceTime";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "maxAdvanceTime";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "defaultReminder";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "reminderMessage";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "autoCreateEvents";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "eventType";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "responsibleEmails";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "aiPrompt";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "enableScarcityMode";
ALTER TABLE "AIConfig" DROP COLUMN IF EXISTS "maxSlotsToShow";

-- Remover tabela (CUIDADO: isso apagará todos os dados!)
DROP TABLE IF EXISTS "GoogleCalendarIntegration";
```

## Múltiplas agendas por AIConfig (opcional)

Arquivo: `add_agendas_to_aiconfig_production.sql`

Adiciona a coluna JSON opcional `agendas` em `AIConfig` para várias agendas (calendário + horários) no mesmo assistente. Seguro para produção (só adiciona coluna se não existir).

```bash
psql -h localhost -U seu_usuario -d many_ia -f prisma/migrations/add_agendas_to_aiconfig_production.sql
```

Depois: `npx prisma generate` e deploy da aplicação.

## Próximos passos

Após executar a migração:

1. ✅ Reinicie a aplicação na VPS
2. ✅ Verifique se o Prisma Client foi regenerado (`npx prisma generate`)
3. ✅ Teste a funcionalidade do Google Calendar no ambiente de produção

