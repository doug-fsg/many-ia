# Preferências: Sistema de Agendamento via IA

## Regras obrigatórias

1. **Horários disponíveis** = `weeklySchedule` (config) **menos** eventos já agendados no Google Calendar.
2. **Apenas horários futuros** – nunca retornar slots no passado.
3. **Exibição de horários** – quando `enableScarcityMode` ativo, retornar só `maxSlotsToShow` slots (ordenados do mais próximo).
