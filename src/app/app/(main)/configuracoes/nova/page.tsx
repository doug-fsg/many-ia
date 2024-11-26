'use client'

import { useRouter } from 'next/navigation'
import { AIConfigForm } from '@/app/app/(main)/_components/ai-config-form'
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'

export default function NewAIConfigPage() {
  const router = useRouter()

  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Nova Configuração de IA</DashboardPageHeaderTitle>
      </DashboardPageHeader>
      <DashboardPageMain>
        <AIConfigForm 
          onSuccess={() => {
            router.refresh()
            router.push('/app')
          }}
        />
      </DashboardPageMain>
    </DashboardPage>
  )
}