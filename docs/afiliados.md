# Sistema de Afiliados

## 1. Visão Geral
O sistema de afiliados permite que usuários se tornem afiliados da plataforma e ganhem comissões por indicações que resultem em assinaturas pagas. O sistema é integrado com Stripe Connect para processamento automático de pagamentos.

## 2. Estrutura do Banco de Dados

### 2.1 Modelo Affiliate
```prisma
model Affiliate {
  id                    String    @id @default(cuid())
  userId                String    @unique
  stripeConnectAccountId String?
  referralCode          String    @unique @default(cuid())
  status                String    @default("pending") // pending, active, inactive
  commissionRate        Int       @default(50) // Porcentagem de comissão, padrão 50%
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  referrals             Referral[] @relation("AffiliateReferrals")
}
```

### 2.2 Modelo Referral
```prisma
model Referral {
  id               String    @id @default(cuid())
  affiliateId      String
  referredUserId   String
  status           String    @default("pending") // pending, pending_payment, active, cancelled
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  affiliate        Affiliate @relation("AffiliateReferrals", fields: [affiliateId], references: [id])
  referredUser     User      @relation("ReferredUser", fields: [referredUserId], references: [id])

  @@unique([affiliateId, referredUserId])
  @@index([affiliateId])
  @@index([referredUserId])
}
```

### 2.3 Relacionamento com User
```prisma
model User {
  // ... outros campos ...
  referralsReceived       Referral[]           @relation("ReferredUser")
  affiliate               Affiliate?
}
```

## 3. Configuração do Ambiente

### 3.1 Variáveis de Ambiente
```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 3.2 Configuração do Stripe
```typescript
// src/config.ts
export const config = {
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    plans: {
      free: {
        priceId: process.env.STRIPE_PRICE_ID || '',
        quota: { credits: 0 }
      },
      pro: {
        priceId: process.env.STRIPE_PRICE_ID || '',
        quota: { credits: 10000 }
      }
    }
  }
}
```

## 4. Processamento de Pagamentos

### 4.1 Webhook Handler
```typescript
// src/app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('Stripe-Signature') as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    )
  } catch (error) {
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      await handleAccountUpdate(account)
      break
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await handlePaidInvoice(invoice)
      break
    }
  }

  return new Response(null, { status: 200 })
}
```

### 4.2 Processamento de Comissões
```typescript
// src/lib/affiliate-payments.ts
export async function processAffiliatePayment(referral: Referral) {
  const { affiliate, referredUser } = referral
  
  if (!affiliate.stripeConnectAccountId) {
    throw new Error('Affiliate has no Stripe Connect account')
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: calculateCommissionAmount(referral),
      currency: 'brl',
      destination: affiliate.stripeConnectAccountId,
      transfer_group: `referral_${referral.id}`
    })

    await prisma.referral.update({
      where: { id: referral.id },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    })

    return transfer
  } catch (error) {
    console.error('Error processing affiliate payment:', error)
    throw error
  }
}
```

## 5. Frontend

### 5.1 Layout Base
```typescript
// src/app/app/settings/layout.tsx
export default function Layout({ children }: PropsWithChildren) {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Configurações</DashboardPageHeaderTitle>
      </DashboardPageHeader>
      <DashboardPageMain>
        <div className="container max-w-screen-lg">
          <div className="flex flex-col md:grid md:grid-cols-[10rem_1fr] gap-6 md:gap-12">
            <SettingsSidebar />
            <div className="mt-4 md:mt-0">{children}</div>
          </div>
        </div>
      </DashboardPageMain>
    </DashboardPage>
  )
}
```

### 5.2 Componentes de UI
```typescript
// src/components/dashboard/page.tsx
export function DashboardPage({ className, children }: DashboardPageGenericProps) {
  return <section className={cn(['min-h-screen w-full', className])}>{children}</section>
}

export function DashboardPageHeader({ className, children }: DashboardPageGenericProps) {
  return (
    <header className={cn([
      'px-4 sm:px-6 h-auto min-h-12 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2',
      className,
    ])}>
      {children}
    </header>
  )
}

export function DashboardPageMain({ className, children }: DashboardPageGenericProps) {
  return <main className={cn(['p-4 sm:p-6 overflow-auto', className])}>{children}</main>
}
```

## 6. Estados e Fluxos

### 6.1 Estados do Afiliado
- `pending`: Aguardando ativação da conta Stripe Connect
- `active`: Conta ativa e recebendo comissões
- `inactive`: Conta desativada

### 6.2 Estados da Referência
- `pending`: Usuário referenciado registrado
- `pending_payment`: Aguardando processamento do pagamento
- `active`: Comissão paga com sucesso
- `cancelled`: Referência cancelada

### 6.3 Fluxo de Aprovação
1. Usuário solicita participação no programa
2. Sistema cria conta Stripe Connect
3. Usuário completa onboarding do Stripe Connect
4. Sistema atualiza status baseado no webhook `account.updated`
5. Afiliado começa a receber comissões quando status = `active`

## 7. Segurança

### 7.1 Validações
```typescript
// src/lib/validations.ts
export function validateAffiliateAccess(userId: string, affiliateId: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    select: { userId: true }
  })

  if (!affiliate || affiliate.userId !== userId) {
    throw new Error('Unauthorized access to affiliate data')
  }
}

export function validateReferralCode(code: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { referralCode: code },
    select: { status: true }
  })

  if (!affiliate || affiliate.status !== 'active') {
    throw new Error('Invalid or inactive referral code')
  }
}
```

### 7.2 Proteção de Rotas
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const session = await getToken({ req: request })
  
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (request.nextUrl.pathname.startsWith('/app/affiliate')) {
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: session.sub },
      select: { status: true }
    })

    if (!affiliate || affiliate.status !== 'active') {
      return NextResponse.redirect(new URL('/app/settings', request.url))
    }
  }

  return NextResponse.next()
}
```

## 8. Monitoramento e Logs

### 8.1 Sistema de Logs
```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${message}`, error)
  },
  webhook: (type: string, data: any) => {
    console.log(`[WEBHOOK] ${type}`, data)
  }
}
```

### 8.2 Monitoramento de Erros
```typescript
// src/lib/error-tracking.ts
export function trackError(error: Error, context: any) {
  logger.error(error.message, {
    stack: error.stack,
    context
  })
  
  // Integração com sistema de monitoramento
  // Ex: Sentry, LogRocket, etc.
}
```

## 9. Testes

### 9.1 Testes de Integração
```typescript
// __tests__/affiliate.test.ts
describe('Sistema de Afiliados', () => {
  test('deve criar novo afiliado com sucesso', async () => {
    const user = await createTestUser()
    const affiliate = await createAffiliate(user.id)
    
    expect(affiliate).toHaveProperty('referralCode')
    expect(affiliate.status).toBe('pending')
  })

  test('deve processar comissão corretamente', async () => {
    const affiliate = await createTestAffiliate()
    const referral = await createTestReferral(affiliate.id)
    
    await processAffiliatePayment(referral)
    
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id }
    })
    
    expect(updatedReferral?.status).toBe('active')
  })
})
```

## 10. Próximos Passos

1. Implementar dashboard detalhado para afiliados
2. Adicionar sistema de níveis de comissão
3. Implementar relatórios automáticos
4. Criar sistema de notificações
5. Adicionar suporte a múltiplas moedas
6. Implementar sistema de bônus por performance

## 11. Considerações de Produção

1. Configurar rate limiting nas APIs
2. Implementar cache para dados frequentemente acessados
3. Configurar monitoramento de performance
4. Implementar backup automático do banco de dados
5. Configurar alertas para falhas críticas
6. Documentar processos de recuperação de falhas 