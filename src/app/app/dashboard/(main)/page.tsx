'use client'

import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { RelatorioTeste } from '../components/RelatorioTeste'
import { Card, CardContent } from '@/components/ui/card'
import { RelatorioInteracoes } from '../components/RelatorioInteracoes'
import { SubscriptionGuardClient } from '@/components/subscription-guard-client'
import { useState } from 'react'
// import { Relatorio2 } from '../components/relatorio'

export default function Page() {
  const [periodFilter, setPeriodFilter] = useState<'month' | 'week' | 'custom'>('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  return (
    <SubscriptionGuardClient
      title="Dashboard"
      description="Acesso limitado"
      redirectToAffiliate={false}
    >
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Dashboard</DashboardPageHeaderTitle>
          <DashboardPageHeaderNav></DashboardPageHeaderNav>
        </DashboardPageHeader>
        <DashboardPageMain>
          <Card className="mb-6">
            <CardContent className="p-6">
              <RelatorioTeste 
                periodFilter={periodFilter}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <RelatorioInteracoes 
                periodFilter={periodFilter}
                setPeriodFilter={setPeriodFilter}
                customStartDate={customStartDate}
                setCustomStartDate={setCustomStartDate}
                customEndDate={customEndDate}
                setCustomEndDate={setCustomEndDate}
              />
            </CardContent>
          </Card>
        </DashboardPageMain>
      </DashboardPage>
    </SubscriptionGuardClient>
  )
}
