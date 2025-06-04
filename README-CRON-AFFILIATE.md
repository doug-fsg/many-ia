# Configuração de Sincronização de Pagamentos de Afiliados

Este documento explica como configurar a sincronização automática de pagamentos de afiliados para garantir que todas as comissões sejam processadas corretamente, mesmo em caso de instabilidade temporária do sistema.

## Sobre o Sistema de Sincronização

O sistema de processamento de pagamentos de afiliados conta com dois mecanismos principais:

1. **Processamento em tempo real**: Quando um cliente faz um pagamento, o webhook do Stripe processa imediatamente a comissão para o afiliado, caso exista.

2. **Sincronização automática (cron)**: Um job de sincronização verifica periodicamente pagamentos pendentes, garantindo que nenhuma comissão seja perdida em caso de falha no processamento em tempo real.

## Configuração do Cron Job

Para garantir que o endpoint de sincronização seja chamado regularmente, configure um cron job conforme descrito abaixo.

### Opção 1: Usando Vercel Cron Jobs (Recomendado para ambientes Vercel)

Se seu aplicativo está hospedado na Vercel, você pode configurar um cron job diretamente no arquivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-affiliate-payments",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Isso executará o job a cada 6 horas. Ajuste a frequência conforme necessário.

### Opção 2: Usando um Serviço de Cron Externo

Para outras plataformas, você pode usar serviços como:

- **Cron-job.org**: Configure um job para chamar a URL `https://seu-dominio.com/api/cron/sync-affiliate-payments`
- **GitHub Actions**: Configure um workflow para fazer uma requisição HTTP para o endpoint
- **AWS Lambda + EventBridge**: Configure uma função Lambda para ser acionada periodicamente

### Opção 3: Usando Crontab (para servidores Linux)

Em um servidor Linux tradicional, você pode configurar um crontab:

```bash
# Editar o crontab
crontab -e

# Adicionar a linha (executa a cada 6 horas)
0 */6 * * * curl https://seu-dominio.com/api/cron/sync-affiliate-payments
```

## Autenticação do Endpoint de Cron (Opcional, mas Recomendado)

Para proteger o endpoint de cron, você pode adicionar uma chave de autenticação:

1. Adicione a variável `CRON_SECRET_KEY` ao seu arquivo `.env` com um valor aleatório seguro.
2. Descomente o código de verificação de autenticação no arquivo `src/app/api/cron/sync-affiliate-payments/route.ts`.
3. Ao configurar o cron job, inclua o cabeçalho de autenticação:

```bash
curl -H "Authorization: Bearer seu-token-secreto" https://seu-dominio.com/api/cron/sync-affiliate-payments
```

## Monitoramento

É recomendável monitorar a execução do job de sincronização através de logs ou um serviço de observabilidade. Isso permitirá identificar e resolver quaisquer problemas que possam surgir durante o processo de sincronização.

## Botão "Processar Comissões Pendentes"

O botão "Processar Comissões Pendentes" na interface do afiliado continua disponível para processamento manual imediato, caso o afiliado deseje verificar o status de suas comissões pendentes sem esperar pelo próximo ciclo de sincronização automática.

---

Lembre-se de ajustar a frequência do cron job de acordo com o volume de transações e a criticidade do sistema para seu negócio. 