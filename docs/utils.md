# Utilitários do Sistema de Afiliados

Este arquivo contém as funções utilitárias utilizadas no sistema de afiliados.

## Funções

### 1. Geração de Código de Referência
```typescript
// utils/affiliate.ts
import { customAlphabet } from 'nanoid'

const REFERRAL_CODE_LENGTH = 8
const REFERRAL_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

export function generateReferralCode(): string {
  const nanoid = customAlphabet(REFERRAL_CODE_ALPHABET, REFERRAL_CODE_LENGTH)
  return nanoid()
}
```

### 2. Validações
```typescript
// utils/validation.ts
import { Referral } from '@/types/affiliate'

export function validateReferral(referral: Referral): boolean {
  // Verificar se o usuário não está se auto-referenciando
  if (referral.affiliateId === referral.referredUserId) {
    return false
  }

  // Verificar se a referência está dentro do período válido (30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return new Date(referral.createdAt) > thirtyDaysAgo
}

export function validatePaymentInfo(bankAccount: string): boolean {
  // Implementar validação de dados bancários
  return bankAccount.length > 0
}
```

### 3. Cookies e Tracking
```typescript
// utils/tracking.ts
import { cookies } from 'next/headers'

const REFERRAL_COOKIE_NAME = 'affiliate_ref'
const REFERRAL_COOKIE_DURATION = 30 * 24 * 60 * 60 // 30 dias em segundos

export function setReferralCookie(referralCode: string): void {
  cookies().set(REFERRAL_COOKIE_NAME, referralCode, {
    maxAge: REFERRAL_COOKIE_DURATION,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })
}

export function getReferralCode(): string | undefined {
  return cookies().get(REFERRAL_COOKIE_NAME)?.value
}
```

### 4. Stripe Connect
```typescript
// utils/stripe.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

interface CreateConnectAccountParams {
  email: string
  country: string
  businessType: 'individual' | 'company'
}

export async function createStripeConnectAccount({
  email,
  country,
  businessType
}: CreateConnectAccountParams) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      business_type: businessType,
      capabilities: {
        transfers: { requested: true }
      }
    })

    return account
  } catch (error) {
    console.error('Erro ao criar conta Stripe Connect:', error)
    throw error
  }
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    })

    return accountLink
  } catch (error) {
    console.error('Erro ao criar link de conta:', error)
    throw error
  }
}
```

### 5. Formatação de Dados
```typescript
// utils/format.ts
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pendente',
    active: 'Ativo',
    inactive: 'Inativo',
    pending_payment: 'Aguardando Pagamento',
    cancelled: 'Cancelado'
  }

  return statusMap[status] || status
}

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'yellow',
    active: 'green',
    inactive: 'gray',
    pending_payment: 'blue',
    cancelled: 'red'
  }

  return colorMap[status] || 'gray'
}
``` 