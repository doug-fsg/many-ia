'use client'

import { AIConfigForm } from '@/app/app/(main)/_components/ai-config-form'
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { useRouter } from 'next/navigation'
import { ConfigTutorial } from '@/app/app/(main)/_components/config-tutorial'

export default function NovaConfiguracaoPage() {
  const router = useRouter()

  return (
    <DashboardPage>
      <DashboardPageHeader className="tutorial-header">
        <div className="flex items-center justify-between">
          <DashboardPageHeaderTitle>
            Nova Configuração de IA
          </DashboardPageHeaderTitle>
          <ConfigTutorial />
        </div>
      </DashboardPageHeader>
      <DashboardPageMain>
        <AIConfigForm
          isEditMode={false}
          onSuccess={() => {
            router.push('/app')
            router.refresh()
          }}
        />
      </DashboardPageMain>
    </DashboardPage>
  )
}
