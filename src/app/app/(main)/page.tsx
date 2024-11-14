import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { AIConfigDataTable } from './_components/ai-config-data-table'
import { AIConfigUpsertDialog } from './_components/ai-config-upsert-dialog'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import { getUserAIConfigs } from './actions'


export default async function Page() {
  const aiConfigs = await getUserAIConfigs()

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Inteligência Artificial</DashboardPageHeaderTitle>
        <DashboardPageHeaderNav>
          <DashboardPageHeaderNav>
            <AIConfigUpsertDialog>
              <Button variant="outline" size="sm">
                <PlusIcon className="w-4 h-4 mr-3" />
                Nova Configuração
              </Button>
            </AIConfigUpsertDialog>
          </DashboardPageHeaderNav>
        </DashboardPageHeaderNav>
      </DashboardPageHeader>
      <DashboardPageMain>
        <AIConfigDataTable data={aiConfigs} />
      </DashboardPageMain>
    </DashboardPage>
  )
}