# Tipos do Sistema de Afiliados

Este arquivo contém todas as interfaces e tipos necessários para o sistema de afiliados.

```typescript
// types/affiliate.ts

interface User {
  id: string;
  email: string;
  name: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: string;
  affiliate?: Affiliate;
}

interface Affiliate {
  id: string;
  userId: string;
  user: User;
  stripeConnectAccountId: string | null;
  referralCode: string;
  status: AffiliateStatus;
  commissionRate: number;
  referrals: Referral[];
  createdAt: Date;
  updatedAt: Date;
}

interface Referral {
  id: string;
  affiliateId: string;
  affiliate: Affiliate;
  referredUserId: string;
  referredUser: User;
  status: ReferralStatus;
  createdAt: Date;
  updatedAt: Date;
}

type AffiliateStatus = 'pending' | 'active' | 'inactive';

type ReferralStatus = 'pending' | 'pending_payment' | 'active' | 'cancelled';

// Tipos para Props dos Componentes
interface AffiliateSignupData {
  termsAccepted: boolean;
  paymentInfo: {
    bankAccount: string;
    // outros dados bancários
  };
}

interface AffiliateMetrics {
  totalReferrals: number;
  activeReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
}

interface ReferralFilters {
  status?: ReferralStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
``` 