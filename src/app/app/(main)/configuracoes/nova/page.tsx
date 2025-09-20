'use client'

import { AIConfigForm } from '@/app/app/(main)/_components/ai-config-form'
import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConfigTutorial } from '@/app/app/(main)/_components/config-tutorial'
import { useEffect, useState } from 'react'

export default function NovaConfiguracaoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [wizardData, setWizardData] = useState<any>(null)

  useEffect(() => {
    console.log('[DEBUG] useEffect executado')
    const wizard = searchParams?.get('wizard')
    const config = searchParams?.get('config')
    
    console.log('[DEBUG] wizard:', wizard)
    console.log('[DEBUG] config existe:', !!config)
    
    if (wizard === 'true' && config) {
      try {
        const parsedConfig = JSON.parse(decodeURIComponent(config))
        console.log('[DEBUG] Dados do wizard parseados:', parsedConfig)
        
        // Garantir que os campos estejam no formato correto
        const formattedConfig = {
          ...parsedConfig,
          id: parsedConfig.id || undefined,
          isActive: parsedConfig.isActive === true,
          enviarParaAtendente: parsedConfig.enviarParaAtendente === true,
          temasEvitar: parsedConfig.temasEvitar || []
        }
        
        console.log('[DEBUG] Config formatada:', formattedConfig)
        setWizardData(formattedConfig)
      } catch (error) {
        console.error('[DEBUG] Erro ao parsear config do wizard:', error)
      }
    }
  }, [searchParams])

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
          defaultValue={wizardData}
          onSuccess={() => {
            router.push('/app')
            router.refresh()
          }}
        />
      </DashboardPageMain>
    </DashboardPage>
  )
}
