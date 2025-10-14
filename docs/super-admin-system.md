# Sistema de Super Admin

## Visão Geral

O sistema de Super Admin foi criado para substituir o antigo painel admin que estava em `/app/admin/credit-limits`. Agora temos um sistema completo de monitoramento e gestão de clientes.

## Funcionalidades

### 1. Autenticação de Super Admin
- **Rota:** `/super_admin/sign_in`
- **Autenticação:** Login com email/senha
- **Requisitos:** 
  - Usuário deve ter `isSuperAdmin = true` no banco
  - Deve ter senha configurada (campo `password`)

### 2. Dashboard Principal
- **Rota:** `/super_admin/dashboard`
- **Funcionalidades:**
  - Visão geral de todos os clientes
  - Estatísticas em tempo real
  - Monitoramento de limites mensais
  - Identificação de clientes acima do limite

### 3. Detalhes do Cliente
- **Rota:** `/super_admin/client/[clientId]`
- **Funcionalidades:**
  - Análise detalhada de um cliente específico
  - Histórico de interações
  - Evolução mensal de uso
  - Controle de limites personalizados
  - Acesso à conta do cliente (impersonação)

## Métricas Monitoradas

### Por Cliente
- **Interações mensais:** Soma de todos os `interactionsCount` das interações do mês atual
- **Valor mensal:** Soma dos valores das interações do mês
- **Limite mensal:** Limite configurado (padrão: 10.000)
- **Percentual de uso:** Soma dos `interactionsCount` vs limite mensal
- **Status da assinatura:** Status do Stripe
- **Última atividade:** Data da última interação

### Globais
- **Total de clientes:** Número total de usuários
- **Clientes ativos:** Usuários com assinatura ativa
- **Interações do mês:** Soma total de todos os `interactionsCount` de todos os clientes
- **Valor do mês:** Valor total gerado no mês
- **Clientes acima do limite:** Quantidade de clientes que excederam o limite

## Estrutura de Dados

### Tabela `Interaction`
- `id`: Identificador único
- `userId`: ID do usuário (cliente)
- `interactionsCount`: Quantidade de interações neste registro
- `value`: Valor monetário da interação
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização
- `name`: Nome do contato
- `phoneNumber`: Telefone do contato
- `status`: Status da interação

### Tabela `User`
- `customCreditLimit`: Limite personalizado de créditos
- `stripeSubscriptionStatus`: Status da assinatura
- `email`: Email do cliente
- `name`: Nome do cliente
- `isSuperAdmin`: Flag que indica se é super administrador
- `password`: Senha para login (obrigatória para super admin)

## APIs Disponíveis

### `/api/super_admin/auth`
- **Método:** POST
- **Body:** `{ email, password }`
- **Retorna:** Autenticação de super admin

### `/api/super_admin/clients`
- **Método:** GET
- **Retorna:** Lista de todos os clientes com estatísticas mensais

### `/api/super_admin/clients/[clientId]`
- **Método:** GET
- **Parâmetros:** `clientId` (ID do cliente)
- **Retorna:** Dados detalhados de um cliente específico

### `/api/super_admin/clients/[clientId]/limit`
- **Método:** PUT
- **Body:** `{ customCreditLimit }`
- **Retorna:** Atualização do limite de créditos

### `/api/super_admin/impersonate`
- **Método:** POST
- **Body:** `{ userId, superAdminEmail }`
- **Retorna:** URL de impersonação com token temporário (válido por 5 minutos)
- **Segurança:** 
  - Apenas super admins podem usar
  - Não permite impersonar outros super admins
  - Token de uso único
  - Registra auditoria no console

### `/api/super_admin/impersonate/login`
- **Método:** GET
- **Query Params:** `token`, `userId`
- **Retorna:** Redirecionamento para `/app` com sessão ativa
- **Funcionalidade:** 
  - Valida token de impersonação
  - Cria JWT NextAuth válido para o usuário
  - Define cookie de sessão com o valor real de `isIntegrationUser` do banco
  - Preserva todas as propriedades do usuário (email, nome, imagem, etc)

## Alertas e Monitoramento

### Clientes Acima do Limite
- Cards com fundo vermelho no dashboard
- Badge "Acima do Limite" em vermelho
- Contabilização na estatística global

### Indicadores Visuais
- **Progress bars:** Mostram percentual de uso do limite
- **Badges coloridos:** Indicam status da assinatura
- **Cores de alerta:** Vermelho para situações críticas

## Segurança

- **Autenticação robusta:** Campo `isSuperAdmin` no banco de dados
- **Verificação de permissão:** Em todas as páginas do super admin
- **Sessão local:** Token armazenado no sessionStorage
- **Logout automático:** Ao fechar o navegador
- **Impersonação segura:**
  - Token temporário de uso único (5 minutos)
  - Não permite impersonar outros super admins
  - Acesso transparente ao usuário (sem notificações)
  - Auditoria completa de todos os acessos no servidor
  - Sessão de impersonação independente da sessão do super admin

## Impersonação de Usuários

### Como Funciona
1. No dashboard ou na página de detalhes do cliente, clique em "Acessar conta"
2. Um token temporário é gerado (válido por 5 minutos)
3. Uma nova aba é aberta com a sessão do usuário
4. O acesso é transparente - o usuário não é notificado
5. Para sair, basta fechar a aba ou fazer logout normalmente

### Segurança
- Token de uso único e temporário
- Não permite impersonar outros super admins
- Todas as ações são registradas no log do servidor
- Sessão independente da sessão do super admin
- Acesso transparente ao usuário (sem notificações visuais)

### Casos de Uso
- **Suporte técnico:** Visualizar a conta do cliente para resolver problemas sem pedir senha
- **Testes:** Verificar comportamento da aplicação na perspectiva do cliente
- **Auditoria:** Investigar problemas reportados pelo cliente
- **Configuração:** Ajustar configurações complexas diretamente na conta do cliente

### Observações Importantes
- O usuário **não é notificado** quando sua conta é acessada
- Todos os acessos são registrados apenas nos logs do servidor
- Use com responsabilidade e apenas para fins de suporte legítimos

## Melhorias Futuras

1. **Autenticação JWT:** Implementar sistema mais robusto
2. **Controle de permissões:** Diferentes níveis de acesso
3. **Alertas automáticos:** Notificações por email/WhatsApp
4. **Relatórios:** Exportação de dados em PDF/Excel
5. **Gráficos:** Visualizações mais avançadas com charts
6. **Auditoria avançada:** Salvar logs de impersonação no banco de dados com timestamps e ações realizadas

## Como Usar

### Primeiro Acesso
1. **Configurar Super Admin no Banco:**
   ```sql
   UPDATE "User" SET "isSuperAdmin" = true WHERE "email" = 'seu-email@exemplo.com';
   ```

2. **Garantir que tem senha configurada**

### Uso Regular
1. Acesse `/super_admin/sign_in`
2. Faça login com email/senha do super admin
3. Navegue pelo dashboard para ver todos os clientes
4. Clique em "Ver detalhes" para análise individual
5. Use "Ajustar limite" para modificar limites de clientes
6. Monitore clientes próximos ou acima do limite

## Observações Técnicas

- Sistema totalmente responsivo (mobile, tablet, desktop)
- Suporte a modo dark/light
- Dados atualizados em tempo real
- Performance otimizada para grandes volumes de dados
- Interface clean e profissional
