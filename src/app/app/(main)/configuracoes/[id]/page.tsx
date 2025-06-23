'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AIConfig } from '@/app/app/(main)/types'
import { fetchFullAIConfig } from '@/app/app/(main)/actions'
import { AIConfigForm } from '@/app/app/(main)/_components/ai-config-form'
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { SpinnerLoader } from '@/components/SpinnerLoader'
import { ConfigTutorial } from '@/app/app/(main)/_components/config-tutorial'

export default function EditAIConfigPage({
  params,
}: {
  params: { id: string }
}) {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadAIConfig = async () => {
      const result = await fetchFullAIConfig(params.id)
      if (result.data) {
        setAiConfig(result.data)
      }
    }
    loadAIConfig()
  }, [params.id])

  if (!aiConfig) {
    return <SpinnerLoader />
  }

  return (
    <DashboardPage>
      <DashboardPageHeader className="tutorial-header">
        <div className="flex items-center justify-between">
          <DashboardPageHeaderTitle>
            Editar Configuração de IA
          </DashboardPageHeaderTitle>
          <ConfigTutorial />
        </div>
      </DashboardPageHeader>
      <DashboardPageMain>
        <AIConfigForm
          defaultValue={aiConfig}
          isEditMode={true}
          onSuccess={() => {
            router.refresh()
            router.push('/app')
          }}
        />
      </DashboardPageMain>
    </DashboardPage>
  )
}
