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
import { auth } from '@/services/auth'
import { SubscriptionGuardClient } from '@/components/subscription-guard-client'
// import { Relatorio2 } from '../components/relatorio'

export default async function Page() {
  const session = await auth()
  const userId = session?.user?.id || ''
  
  // Verificar se o usuário está autenticado
  if (!userId) {
    return null
  }
  
  return (
    <SubscriptionGuardClient
      title="Dashboard"
      description="Acesso limitado"
      redirectToAffiliate={false}
    >
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Dashboard</DashboardPageHeaderTitle>
          <DashboardPageHeaderNav>
            &nbsp;
          </DashboardPageHeaderNav>
        </DashboardPageHeader>
        <DashboardPageMain>
          <Card className="mb-6">
            <CardContent className="p-6">
              <RelatorioTeste />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <RelatorioInteracoes />
            </CardContent>
          </Card>
        </DashboardPageMain>
      </DashboardPage>
    </SubscriptionGuardClient>
  )
}
