# Páginas do Sistema de Afiliados

Este arquivo contém as principais páginas do sistema de afiliados.

## Páginas Públicas

### 1. Página Principal de Afiliados
```typescript
// pages/affiliates/index.tsx
import React from 'react';
import { Layout } from '@/components/Layout';
import { AffiliateSignup } from '@/components/affiliates/AffiliateSignup';
import { BeneficiosAfiliado } from '@/components/affiliates/BeneficiosAfiliado';
import { PassosParaAfiliar } from '@/components/affiliates/PassosParaAfiliar';
import { FAQ } from '@/components/affiliates/FAQ';

const AffiliatesLandingPage: React.FC = () => {
  const handleSignup = async (data: AffiliateSignupData) => {
    try {
      const response = await fetch('/api/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao cadastrar');
      }

      // Redirecionar ou mostrar sucesso
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Programa de Afiliados
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Ganhe comissões indicando novos usuários para nossa plataforma
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <BeneficiosAfiliado />
          <PassosParaAfiliar />
        </div>

        <FAQ className="mt-16" />

        <div className="mt-16 bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Cadastre-se como Afiliado</h2>
          <AffiliateSignup onSubmit={handleSignup} />
        </div>
      </div>
    </Layout>
  );
};

export default AffiliatesLandingPage;
```

## Páginas Protegidas

### 1. Dashboard do Afiliado
```typescript
// pages/affiliates/dashboard.tsx
import React from 'react';
import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AffiliateDashboard } from '@/components/affiliates/AffiliateDashboard';
import { useAffiliate } from '@/hooks/useAffiliate';
import { useAffiliateMetrics } from '@/hooks/useAffiliateMetrics';

const AffiliateDashboardPage: React.FC = () => {
  const { data: session } = useSession();
  const { affiliate } = useAffiliate(session?.user?.id);
  const { metrics } = useAffiliateMetrics(affiliate?.id);

  if (!affiliate) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">
            Você ainda não é um afiliado
          </h2>
          <p className="mt-2 text-gray-600">
            Para acessar o dashboard, primeiro cadastre-se como afiliado.
          </p>
          <a
            href="/affiliates"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Cadastrar como Afiliado
          </a>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AffiliateDashboard
          affiliate={affiliate}
          metrics={metrics}
        />
      </div>
    </DashboardLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Verificar autenticação
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default AffiliateDashboardPage;
```

## API Routes

### 1. Cadastro de Afiliado
```typescript
// pages/api/affiliates/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { createStripeConnectAccount } from '@/lib/stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method === 'POST') {
    try {
      // Verificar se já é afiliado
      const existingAffiliate = await prisma.affiliate.findUnique({
        where: { userId: session.user.id },
      });

      if (existingAffiliate) {
        return res.status(400).json({ error: 'Usuário já é afiliado' });
      }

      // Criar conta no Stripe Connect
      const stripeAccount = await createStripeConnectAccount({
        email: session.user.email,
        // outros dados necessários
      });

      // Criar afiliado no banco
      const affiliate = await prisma.affiliate.create({
        data: {
          userId: session.user.id,
          stripeConnectAccountId: stripeAccount.id,
          referralCode: generateReferralCode(),
          status: 'pending',
          commissionRate: 50, // 50%
        },
      });

      return res.status(201).json(affiliate);
    } catch (error) {
      console.error('Erro ao criar afiliado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
```

### 2. Atualização de Status
```typescript
// pages/api/affiliates/[id]/status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (req.method === 'PUT') {
    try {
      const affiliate = await prisma.affiliate.update({
        where: { id: String(id) },
        data: { status },
      });

      return res.json(affiliate);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
``` 