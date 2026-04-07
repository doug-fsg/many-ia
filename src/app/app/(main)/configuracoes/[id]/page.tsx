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
import { ConfigTutorial } from '@/app/app/(main)/_components/config-tutorial'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft } from 'lucide-react'

function EditConfigSkeleton() {
  return (
    <div className="space-y-6 p-2" aria-busy="true" aria-label="Carregando formulário">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-14 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

export default function EditAIConfigPage({
  params,
}: {
  params: { id: string }
}) {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const loadAIConfig = async () => {
      setLoadState('loading')
      setLoadError(null)
      const result = await fetchFullAIConfig(params.id)
      if (cancelled) return
      if (result.data) {
        setAiConfig(result.data)
        setLoadState('ready')
      } else {
        setAiConfig(null)
        setLoadError(result.error ?? 'Não foi possível carregar')
        setLoadState('error')
      }
    }

    void loadAIConfig()
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (loadState === 'loading') {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Editar configuração</DashboardPageHeaderTitle>
        </DashboardPageHeader>
        <DashboardPageMain>
          <EditConfigSkeleton />
        </DashboardPageMain>
      </DashboardPage>
    )
  }

  if (loadState === 'error' || !aiConfig) {
    return (
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>Editar configuração</DashboardPageHeaderTitle>
        </DashboardPageHeader>
        <DashboardPageMain>
          <div
            className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-8 text-center"
            role="alert"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertCircle className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button type="button" variant="outline" className="gap-2" onClick={() => router.push('/app')}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar
            </Button>
          </div>
        </DashboardPageMain>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage>
      <DashboardPageHeader className="tutorial-header">
        <div className="flex items-center justify-between">
          <DashboardPageHeaderTitle>Editar configuração</DashboardPageHeaderTitle>
          <ConfigTutorial autoStart={false} />
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
