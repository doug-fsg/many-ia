import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { AIConfigDataTable } from './_components/ai-config-data-table'
import { getUserAIConfigs } from './actions'
import Link from 'next/link'

export default async function Page() {
  const result = await getUserAIConfigs()
  const aiConfigs = result.data || []

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>
          Inteligência Artificial
        </DashboardPageHeaderTitle>
        <DashboardPageHeaderNav>
          <DashboardPageHeaderNav>
            <Link
              href="/app/configuracoes/nova"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Nova Configuração
            </Link>
          </DashboardPageHeaderNav>
        </DashboardPageHeaderNav>
      </DashboardPageHeader>
      <DashboardPageMain>
        <AIConfigDataTable data={aiConfigs} />
      </DashboardPageMain>
    </DashboardPage>
  )
}
