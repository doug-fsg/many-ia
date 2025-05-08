import { Suspense } from 'react'
import { AuthForm } from './_components/auth-form'

// Configuração para marcar a página como dinâmica
export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <main className="flex items-center justify-center h-screen">
      <Suspense fallback={<div>Carregando...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  )
}
