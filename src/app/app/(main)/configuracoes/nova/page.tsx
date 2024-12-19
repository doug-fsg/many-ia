'use client'

import { AIConfigForm } from '@/app/app/(main)/_components/ai-config-form'
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { useRouter } from 'next/navigation'

export default function NovaConfiguracaoPage() {
  const router = useRouter()

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>
          Nova Configuração de IA
        </DashboardPageHeaderTitle>
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
