# Hooks do Sistema de Afiliados

Este arquivo contém os hooks personalizados utilizados no sistema de afiliados.

## Hooks

### 1. useAffiliate
```typescript
// hooks/useAffiliate.ts
import { useState, useEffect } from 'react'
import { Affiliate } from '@/types/affiliate'

export function useAffiliate() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAffiliate = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/affiliate/me')
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do afiliado')
        }
        const data = await response.json()
        setAffiliate(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAffiliate()
  }, [])

  return { affiliate, isLoading, error }
}
```

### 2. useReferrals
```typescript
// hooks/useReferrals.ts
import { useState, useEffect } from 'react'
import { Referral } from '@/types/affiliate'

interface UseReferralsOptions {
  page?: number
  perPage?: number
  status?: string
}

export function useReferrals(options: UseReferralsOptions = {}) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const { page = 1, perPage = 10, status } = options

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setIsLoading(true)
        const queryParams = new URLSearchParams({
          page: String(page),
          perPage: String(perPage),
          ...(status && { status })
        })

        const response = await fetch(`/api/affiliate/referrals?${queryParams}`)
        if (!response.ok) {
          throw new Error('Erro ao buscar referências')
        }

        const data = await response.json()
        setReferrals(data.referrals)
        setTotalCount(data.total)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReferrals()
  }, [page, perPage, status])

  return {
    referrals,
    totalCount,
    isLoading,
    error,
    pageCount: Math.ceil(totalCount / perPage)
  }
}
```

### 3. useAffiliateMetrics
```typescript
// hooks/useAffiliateMetrics.ts
import { useState, useEffect } from 'react'
import { AffiliateMetrics } from '@/types/affiliate'

export function useAffiliateMetrics() {
  const [metrics, setMetrics] = useState<AffiliateMetrics>({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingCommissions: 0,
    paidCommissions: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/affiliate/metrics')
        if (!response.ok) {
          throw new Error('Erro ao buscar métricas')
        }
        const data = await response.json()
        setMetrics(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  return { metrics, isLoading, error }
}
```

### 4. useAffiliates (Admin)
```typescript
// hooks/useAffiliates.ts
import { useState, useEffect } from 'react';
import { Affiliate, AffiliateStatus } from '@/types/affiliate';

interface UseAffiliatesOptions {
  page?: number;
  perPage?: number;
  status?: AffiliateStatus;
}

export const useAffiliates = (options: UseAffiliatesOptions = {}) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 1, perPage = 10, status } = options;

  const fetchAffiliates = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(status && { status }),
      });

      const response = await fetch(`/api/admin/affiliates?${queryParams}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar afiliados');
      }

      const data = await response.json();
      setAffiliates(data.affiliates);
      setTotalCount(data.total);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, [page, perPage, status]);

  const updateStatus = async (affiliateId: string, newStatus: AffiliateStatus) => {
    try {
      const response = await fetch(`/api/admin/affiliates/${affiliateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      // Atualizar lista local
      setAffiliates((current) =>
        current.map((aff) =>
          aff.id === affiliateId ? { ...aff, status: newStatus } : aff
        )
      );
    } catch (err) {
      throw err;
    }
  };

  const processPayment = async (affiliateId: string) => {
    try {
      const response = await fetch('/api/admin/affiliates/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affiliateId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      // Recarregar dados após processamento
      await fetchAffiliates();
    } catch (err) {
      throw err;
    }
  };

  return {
    affiliates,
    totalCount,
    isLoading,
    error,
    pageCount: Math.ceil(totalCount / perPage),
    updateStatus,
    processPayment,
    refetch: fetchAffiliates,
  };
};
``` 