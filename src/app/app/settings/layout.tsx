import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { PropsWithChildren } from 'react'
import { SettingsSidebar } from './_components/settings-sidebar'

export default function Layout({ children }: PropsWithChildren) {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Configurações</DashboardPageHeaderTitle>
      </DashboardPageHeader>
      <DashboardPageMain>
        <div className="container max-w-screen-lg">
          <div className="flex flex-col md:grid md:grid-cols-[10rem_1fr] gap-6 md:gap-12">
            <SettingsSidebar />
            <div className="mt-4 md:mt-0">{children}</div>
          </div>
        </div>
      </DashboardPageMain>
    </DashboardPage>
  )
}
