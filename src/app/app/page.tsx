import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderNav,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'
import { AIConfigDataTable } from './(main)/_components/ai-config-data-table'
import { getUserAIConfigs } from './(main)/actions'
import { AIConfig } from './(main)/types'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { auth } from '@/services/auth'
import { SubscriptionGuardClient } from '@/components/subscription-guard-client'

// Configuração para marcar a página como dinâmica
export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await auth()
  const userId = session?.user?.id || ''
  
  // Verificar se o usuário está autenticado
  if (!userId) {
    return null
  }
  
  const result = await getUserAIConfigs()
  // Aplicar tipo explícito para corrigir o erro de tipo
  const aiConfigs = (result.data || []) as AIConfig[]

  return (
    <SubscriptionGuardClient
      title="Personalize sua IA"
      description="Acesso limitado"
      redirectToAffiliate={false}
    >
      <DashboardPage>
        <DashboardPageHeader>
          <DashboardPageHeaderTitle>
            Atendente Virtual
          </DashboardPageHeaderTitle>
          <DashboardPageHeaderNav>
            <Link
              href="/app/configuracoes/nova"
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Sparkles className="h-4 w-4" />
              Criar Atendente
            </Link>
          </DashboardPageHeaderNav>
        </DashboardPageHeader>
        <DashboardPageMain>
          <AIConfigDataTable data={aiConfigs} />
        </DashboardPageMain>
      </DashboardPage>
    </SubscriptionGuardClient>
  )
} 