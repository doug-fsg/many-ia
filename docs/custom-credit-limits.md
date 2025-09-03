# Sistema de Limites de Créditos Personalizados

## Visão Geral

O sistema agora suporta limites de créditos personalizados por usuário, permitindo flexibilidade no gerenciamento de cotas individuais.

## Como Funciona

### Limite Padrão
- **10.000 créditos por mês** para todos os usuários
- Calculado do dia 1 ao último dia do mês
- Quando excedido, todas as configurações de IA são desativadas automaticamente

### Limites Personalizados
- Campo `customCreditLimit` na tabela `User`
- Se `NULL` ou `0`: usa o limite padrão (10.000)
- Se > 0: usa o valor personalizado
- Precedência: Personalizado > Padrão

## Segurança e Fallbacks

### Múltiplos Fallbacks
1. **Nível 1**: `user.customCreditLimit` se > 0
2. **Nível 2**: Limite padrão (10.000)
3. **Nível 3**: Fallback absoluto em caso de erro

### Logs de Monitoramento
```
[SERVER] Usando limite personalizado: 5000 para user@exemplo.com
[CREDIT-LIMIT] LIMITE PERSONALIZADO detectado para userId: 5000 créditos
[BILLING] Limite de créditos para user@exemplo.com: 5000 (usado: 2500)
```

## Interface Administrativa

### Acesso
- Rota: `/app/admin/credit-limits`
- Requer permissões de administrador
- Verificação por email ou domínio

### Funcionalidades
1. **Definir Limite**: Configurar limite personalizado para usuário específico
2. **Remover Limite**: Voltar ao limite padrão
3. **Listar Usuários**: Ver todos com limites personalizados
4. **Estatísticas**: Resumo geral do sistema

## Implementação Técnica

### Migração do Banco
```sql
ALTER TABLE "User" ADD COLUMN "customCreditLimit" INTEGER;
CREATE INDEX "User_customCreditLimit_idx" ON "User"("customCreditLimit");
```

### Função Principal
```typescript
// src/services/stripe/index.ts
export const getUserCurrentPlan = async (userId: string) => {
  // Busca limite personalizado ou usa padrão
  const creditLimit = user.customCreditLimit || 10000;
  // ...
}
```

### Pontos de Verificação
- `getUserCurrentPlan()`: Função principal
- `checkAndEnforceCreditLimit()`: Verificação automática
- `toggleAIConfigStatus()`: Verificação antes de ativar
- Cron job: Verificação periódica

## Casos de Uso

### Clientes Premium
```typescript
// Usuário com limite de 50.000 créditos
customCreditLimit: 50000
```

### Clientes com Restrições
```typescript
// Usuário com limite de 5.000 créditos
customCreditLimit: 5000
```

### Teste/Trial
```typescript
// Usuário com limite de 1.000 créditos para teste
customCreditLimit: 1000
```

## Monitoramento

### Logs Importantes
- Alterações de limites (com usuário admin)
- Detecção de limites personalizados
- Cálculos de créditos por usuário
- Erros e fallbacks

### Métricas
- Usuários com limites personalizados
- Distribuição de limites
- Taxa de uso por tipo de limite

## Troubleshooting

### Usuário com Limite Incorreto
1. Verificar `user.customCreditLimit` no banco
2. Checar logs de `getUserCurrentPlan`
3. Confirmar se não há cache

### Sistema Não Aplica Limite
1. Verificar se a migração foi executada
2. Conferir logs de erro
3. Validar fallbacks

### Interface Admin Não Funciona
1. Verificar permissões do usuário
2. Confirmar autenticação
3. Checar logs das actions

## Segurança

### Controle de Acesso
- Apenas administradores autorizados
- Verificação por email/domínio
- Logs de auditoria de todas as alterações

### Validações
- Limites não podem ser negativos
- Verificação de existência do usuário
- Fallbacks em caso de erro

### Auditoria
- Log de todas as alterações
- Identificação do admin responsável
- Timestamp das modificações

## Próximos Passos

1. **Configurar permissões de admin** no arquivo `actions.ts`
2. **Executar migração** do banco de dados
3. **Testar em ambiente de staging**
4. **Monitorar logs** após deploy
5. **Criar alertas** para limites personalizados



