import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/services/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { CopyButton } from './_components/copy-button'

// Componente servidor principal
export default async function AffiliateDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/affiliate-program/dashboard')
  }

  // Buscar dados do afiliado
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId: session.user.id },
    include: {
      referrals: {
        include: {
          referredUser: {
            select: {
              email: true,
              stripeSubscriptionStatus: true
            }
          }
        }
      }
    }
  })

  if (!affiliate) {
    redirect('/affiliate-program')
  }

  // Preparar estatísticas
  const totalReferrals = affiliate.referrals.length
  const activeReferrals = affiliate.referrals.filter(r => r.status === 'active').length
  
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${affiliate.referralCode}`

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard do Afiliado</h1>
        <p className="text-muted-foreground">
          Acompanhe suas indicações e comissões.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seu Link de Afiliado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <code className="bg-muted p-3 rounded-md flex-1 overflow-auto">
                {referralLink}
              </code>
              <CopyButton text={referralLink} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <span>Conta Stripe Connect:</span>
                <span className="font-medium capitalize">
                  {affiliate.status === 'active' ? (
                    <span className="text-green-600">Ativa</span>
                  ) : (
                    <span className="text-amber-600">Pendente</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de indicações:</span>
                  <span className="font-medium">{totalReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span>Indicações ativas:</span>
                  <span className="font-medium">{activeReferrals}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suas Indicações</CardTitle>
          </CardHeader>
          <CardContent>
            {affiliate.referrals.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Você ainda não possui indicações.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliate.referrals.map((referral) => (
                      <tr key={referral.id} className="border-b">
                        <td className="py-3 px-4">{referral.referredUser.email}</td>
                        <td className="py-3 px-4 capitalize">
                          {referral.status === 'active' ? (
                            <span className="text-green-600">Ativa</span>
                          ) : (
                            <span className="text-amber-600">Pendente</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(referral.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 