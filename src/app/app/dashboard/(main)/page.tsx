import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page';
import { RelatorioTeste } from '../components/RelatorioTeste';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/card';
import { RelatorioInteracoes } from '../components/RelatorioInteracoes';
// import { Relatorio2 } from '../components/relatorio'

export default async function Page() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Dashboard</DashboardPageHeaderTitle>
        <DashboardPageHeaderNav></DashboardPageHeaderNav>
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
  );
}
