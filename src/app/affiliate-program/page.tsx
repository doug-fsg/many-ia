'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyIcon, Users } from 'lucide-react'
import { createAffiliateAccount } from './actions'

// Componente separado para o botão com interação do cliente
function RegisterButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleRegister() {
    try {
      setIsLoading(true)
      const result = await createAffiliateAccount()
      
      if (result?.accountLink) {
        window.location.href = result.accountLink
      }
    } catch (error) {
      console.error('Erro ao registrar afiliado:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isLoading}
      className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
    >
      {isLoading ? 'Processando...' : 'Tornar-se Afiliado'}
    </button>
  )
}

// Componente principal da página
export default function AffiliateProgramPage() {
  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Programa de Afiliados</h1>
        <p className="text-muted-foreground">
          Torne-se um afiliado e ganhe 50% de comissão recorrente em todas as suas indicações.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Registre-se como afiliado</h3>
                  <p className="text-muted-foreground">
                    Complete seu cadastro e configure sua conta Stripe para receber pagamentos.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Compartilhe seu link único</h3>
                  <p className="text-muted-foreground">
                    Use seu link de afiliado para indicar novos usuários para a plataforma.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Ganhe comissões recorrentes</h3>
                  <p className="text-muted-foreground">
                    Receba 50% de comissão em todas as assinaturas mensais dos usuários que você indicar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registre-se como Afiliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>Ao se registrar como afiliado, você concorda com:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Comissão de 50% sobre todas as assinaturas indicadas</li>
                  <li>Pagamentos realizados automaticamente via Stripe Connect</li>
                  <li>Respeitar os termos e condições do programa de afiliados</li>
                </ul>
              </div>

              <RegisterButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 