# Componentes do Sistema de Afiliados

Este arquivo contém os principais componentes React do sistema de afiliados.

## Componentes Públicos

### 1. Página de Afiliados (Landing Page)
```typescript
// app/afiliados/page.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RegisterForm } from '@/app/auth/_components/register-form'
import { Gift, Target, BarChart3, Clock, CheckCircle } from 'lucide-react'

export default function AfiliadosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/60">
      {/* Hero Section */}
      <section id="top" className="container max-w-7xl py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Transforme seu <span className="text-emerald-500">Networking</span>
              em <span className="text-amber-500">Renda</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Complete seu cadastro e comece a construir uma fonte de renda
              extraordinária hoje mesmo.
            </p>
            {/* Benefícios */}
          </div>
          <Card>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Outras seções... */}
    </div>
  )
}
```

## Componentes do Dashboard

### 1. Dashboard do Afiliado
```typescript
// app/affiliate-program/dashboard/page.tsx
import { auth } from '@/services/auth'
import { prisma } from '@/services/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from './_components/copy-button'

export default async function AffiliateDashboardPage() {
  const session = await auth()
  
  // Buscar dados do afiliado
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      referrals: {
        include: {
          referredUser: {
            select: {
              email: true,
              stripeSubscriptionStatus: true
            }
          }
        }
      }
    }
  })

  // Preparar estatísticas
  const totalReferrals = affiliate.referrals.length
  const activeReferrals = affiliate.referrals.filter(r => r.status === 'active').length
  
  return (
    <div className="container max-w-5xl py-10">
      {/* Link de Afiliado */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Link de Afiliado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <code className="bg-muted p-3 rounded-md flex-1">
              {referralLink}
            </code>
            <CopyButton text={referralLink} />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span>Conta Stripe Connect:</span>
              <span className="font-medium capitalize">
                {affiliate.status === 'active' ? 'Ativa' : 'Pendente'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total de indicações:</span>
                <span className="font-medium">{totalReferrals}</span>
              </div>
              <div className="flex justify-between">
                <span>Indicações ativas:</span>
                <span className="font-medium">{activeReferrals}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Suas Indicações</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {affiliate.referrals.map((referral) => (
                <tr key={referral.id}>
                  <td>{referral.referredUser.email}</td>
                  <td>{referral.status}</td>
                  <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Botão de Copiar
```typescript
// app/affiliate-program/dashboard/_components/copy-button.tsx
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useState } from 'react'

interface CopyButtonProps {
  text: string
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="ml-2"
    >
      <Copy className="h-4 w-4" />
      {copied && (
        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
          Copiado!
        </span>
      )}
    </Button>
  )
}
```

## Componentes de Afiliados

### 1. Página de Cadastro
```typescript
// components/affiliates/AffiliateSignup.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AffiliateSignupData } from '@/types/affiliate';

interface AffiliateSignupProps {
  onSubmit: (data: AffiliateSignupData) => Promise<void>;
}

export const AffiliateSignup: React.FC<AffiliateSignupProps> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AffiliateSignupData>();
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: AffiliateSignupData) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Erro ao cadastrar afiliado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dados Bancários
        </label>
        <input
          type="text"
          {...register('paymentInfo.bankAccount', { required: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.paymentInfo?.bankAccount && (
          <p className="mt-1 text-sm text-red-600">Campo obrigatório</p>
        )}
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register('termsAccepted', { required: true })}
            className="rounded border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-600">
            Aceito os termos e condições
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="mt-1 text-sm text-red-600">
            Você precisa aceitar os termos
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {isLoading ? 'Enviando...' : 'Cadastrar como Afiliado'}
      </button>
    </form>
  );
};
```

### 2. Dashboard do Afiliado
```typescript
// components/affiliates/AffiliateDashboard.tsx
import React from 'react';
import { Affiliate, AffiliateMetrics } from '@/types/affiliate';
import { ReferralList } from './ReferralList';
import { MetricsCard } from '../ui/MetricsCard';

interface AffiliateDashboardProps {
  affiliate: Affiliate;
  metrics: AffiliateMetrics;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({
  affiliate,
  metrics,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Total de Indicações"
          value={metrics.totalReferrals}
          icon="users"
        />
        <MetricsCard
          title="Indicações Ativas"
          value={metrics.activeReferrals}
          icon="check-circle"
        />
        <MetricsCard
          title="Comissões Pendentes"
          value={`R$ ${metrics.pendingCommissions.toFixed(2)}`}
          icon="clock"
        />
        <MetricsCard
          title="Comissões Pagas"
          value={`R$ ${metrics.paidCommissions.toFixed(2)}`}
          icon="cash"
        />
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Link de Afiliado</h2>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            readOnly
            value={`${process.env.NEXT_PUBLIC_APP_URL}?ref=${affiliate.referralCode}`}
            className="flex-1 rounded-md border-gray-300"
          />
          <button
            onClick={() => {/* Implementar cópia */}}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Copiar
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Suas Indicações</h2>
        <ReferralList
          referrals={affiliate.referrals}
          onPageChange={(page) => console.log('Página:', page)}
          onFilterChange={(filters) => console.log('Filtros:', filters)}
        />
      </div>
    </div>
  );
};
```

### 3. Lista de Referências
```typescript
// components/affiliates/ReferralList.tsx
import React, { useState } from 'react';
import { Referral, ReferralFilters, ReferralStatus } from '@/types/affiliate';

interface ReferralListProps {
  referrals: Referral[];
  onPageChange: (page: number) => void;
  onFilterChange: (filters: ReferralFilters) => void;
}

export const ReferralList: React.FC<ReferralListProps> = ({
  referrals,
  onPageChange,
  onFilterChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ReferralFilters>({});

  const handleFilterChange = (newFilters: Partial<ReferralFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  return (
    <div>
      <div className="mb-4 flex space-x-4">
        <select
          onChange={(e) => handleFilterChange({ status: e.target.value as ReferralStatus })}
          className="rounded-md border-gray-300"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="pending_payment">Aguardando Pagamento</option>
          <option value="active">Ativo</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuário
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Data
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {referrals.map((referral) => (
            <tr key={referral.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {referral.referredUser.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  referral.status === 'active' ? 'bg-green-100 text-green-800' :
                  referral.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  referral.status === 'pending_payment' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {referral.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(referral.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-between">
        <button
          onClick={() => {
            const newPage = currentPage - 1;
            setCurrentPage(newPage);
            onPageChange(newPage);
          }}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded-md disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={() => {
            const newPage = currentPage + 1;
            setCurrentPage(newPage);
            onPageChange(newPage);
          }}
          className="px-4 py-2 border rounded-md"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};
```

## Componentes Administrativos

### 1. Gerenciamento de Afiliados
```typescript
// components/admin/AffiliateManagement.tsx
import React from 'react';
import { Affiliate, AffiliateStatus } from '@/types/affiliate';

interface AffiliateManagementProps {
  affiliates: Affiliate[];
  onStatusChange: (affiliateId: string, status: AffiliateStatus) => Promise<void>;
  onPaymentProcess: (affiliateId: string) => Promise<void>;
}

export const AffiliateManagement: React.FC<AffiliateManagementProps> = ({
  affiliates,
  onStatusChange,
  onPaymentProcess,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gerenciamento de Afiliados</h2>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Afiliado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total de Indicações
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {affiliates.map((affiliate) => (
            <tr key={affiliate.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {affiliate.user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {affiliate.user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={affiliate.status}
                  onChange={(e) => onStatusChange(affiliate.id, e.target.value as AffiliateStatus)}
                  className="rounded-md border-gray-300"
                >
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {affiliate.referrals.length}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onPaymentProcess(affiliate.id)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Processar Pagamento
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
``` 