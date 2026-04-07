import {
  DashboardPage,
  DashboardPageHeader,
  DashboardPageHeaderTitle,
  DashboardPageMain,
} from '@/components/dashboard/page'

/** UI leve enquanto RSC de /app/(main) carrega — melhora percepção de velocidade. */
export default function MainLoading() {
  return (
    <DashboardPage>
      <DashboardPageHeader>
        <DashboardPageHeaderTitle>Carregando…</DashboardPageHeaderTitle>
      </DashboardPageHeader>
      <DashboardPageMain>
        <div className="space-y-4" aria-busy="true" aria-label="Carregando conteúdo">
          <div className="h-10 max-w-md animate-pulse rounded-md bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </DashboardPageMain>
    </DashboardPage>
  )
}
