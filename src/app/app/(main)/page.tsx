import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { AIConfigDataTable } from './_components/ai-config-data-table'
import { CreateAttendenteButton } from './_components/create-attendente-button'
import { getUserAIConfigs } from './actions'
import { SubscriptionGuardClient } from '@/components/subscription-guard-client'

// Configuração para marcar a página como dinâmica
export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await getUserAIConfigs()
  const aiConfigs = result.data || []

  return (
    <SubscriptionGuardClient
      title="Personalize sua IA"
      description="Acesso limitado"
      redirectToAffiliate={false}
    >
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>
            Atendente Virtual
          </DashboardPageHeaderTitle>
          <DashboardPageHeaderNav>
            <CreateAttendenteButton />
          </DashboardPageHeaderNav>
        </DashboardPageHeader>
        <DashboardPageMain>
          <AIConfigDataTable data={aiConfigs} />
        </DashboardPageMain>
      </DashboardPage>
    </SubscriptionGuardClient>
  )
}
