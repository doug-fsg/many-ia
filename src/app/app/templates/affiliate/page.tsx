import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/services/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyButton } from '@/app/affiliate-program/dashboard/_components/copy-button'
import { 
  BadgeCheck, Clock, Coins, ExternalLink, Search, 
  Settings, TrendingUp, Users 
} from 'lucide-react'
import { stripe } from '@/services/stripe'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

type TemplateWithSharing = {
  id: string
  sharedWith: { id: string }[]
}

type AffiliateWithReferrals = {
  id: string
  userId: string
  stripeConnectAccountId: string | null
  status: string
  referralCode: string
  createdAt: Date
  updatedAt: Date
  referrals: {
    id: string
    status: string
    referredUser: {
      email: string | null
      stripeSubscriptionStatus: string | null
      stripeSubscriptionId: string | null
    }
  }[]
}

type Subscription = {
  id: string
  email: string | null
  status: string
  amount: number
  interval: string
  created: Date
}

type Transfer = {
  id: string
  amount: number
  currency: string
  created: Date
  description: string | null
}

export default async function TemplateAffiliateProgram() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/app/templates/affiliate')
  }

  // Verificar se o usuário pode acessar a página
  // Não precisamos verificar se é afiliado, pois queremos que afiliados sem assinatura
  // possam acessar esta página

  // Buscar dados do afiliado e templates
  const [affiliate, templateStats] = await Promise.all([
    prisma.$queryRaw`
      SELECT a.*, json_agg(
        json_build_object(
          'id', r.id,
          'status', r.status,
          'referredUser', json_build_object(
            'email', u.email,
            'stripeSubscriptionStatus', u."stripeSubscriptionStatus",
            'stripeSubscriptionId', u."stripeSubscriptionId"
          )
        )
      ) as referrals
      FROM "Affiliate" a
      LEFT JOIN "Referral" r ON r."affiliateId" = a.id
      LEFT JOIN "User" u ON u.id = r."referredUserId"
      WHERE a."userId" = ${session.user.id}
      GROUP BY a.id
    ` as Promise<AffiliateWithReferrals[]>,
    
    prisma.$queryRaw`
      SELECT t.*, json_agg(
        json_build_object('id', ts."userId")
      ) as "sharedWith"
      FROM "Template" t
      LEFT JOIN "TemplateSharing" ts ON ts."templateId" = t.id
      WHERE t."userId" = ${session.user.id}
      GROUP BY t.id
    ` as Promise<TemplateWithSharing[]>
  ])

  // Dados para exibição
  const referralLink = affiliate && affiliate[0] && affiliate[0].status === 'active'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${affiliate[0].referralCode}` 
    : null

  // Converter para o formato esperado
  const affiliateData = affiliate && affiliate[0] 
    ? { ...affiliate[0], referrals: affiliate[0].referrals || [] }
    : null
    
  // Verificar se a conta está pendente
  const isPending = affiliateData?.status === 'pending'
  const stripeAccount = affiliateData?.stripeConnectAccountId 
    ? await stripe.accounts.retrieve(affiliateData.stripeConnectAccountId)
    : null
  const needsStripeSetup = stripeAccount && (!stripeAccount.charges_enabled || !stripeAccount.payouts_enabled)

  // Gerar link do Stripe se necessário
  let stripeAccountLink = null
  if (needsStripeSetup && affiliateData?.stripeConnectAccountId) {
    stripeAccountLink = await stripe.accountLinks.create({
      account: affiliateData.stripeConnectAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/templates/affiliate?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/templates/affiliate?success=true`,
      type: 'account_onboarding',
    })
  }
    
  // Buscar assinantes ativos e seus dados de assinatura
  const activeReferrals = affiliateData?.referrals.filter((r) => 
    r.status === 'active' && 
    r.referredUser.stripeSubscriptionStatus === 'active'
  ) || []
  
  // Buscar as transferências realizadas para o afiliado nos últimos 90 dias
  const recentTransfers: Transfer[] = []
  const subscriptionData: Subscription[] = []
  let totalEarnings = 0
  let estimatedMonthlyEarnings = 0
  let availableBalance = 0
  let pendingBalance = 0
  
  if (affiliateData?.stripeConnectAccountId) {
    try {
      // Obter transferências recentes
      const transfers = await stripe.transfers.list({
        destination: affiliateData.stripeConnectAccountId,
        limit: 100
      })
      
      transfers.data.forEach(t => {
        recentTransfers.push({
          id: t.id,
          amount: t.amount / 100, // Convertendo de centavos para reais
          currency: t.currency,
          created: new Date(t.created * 1000),
          description: t.description
        });
      });
      
      // Calcular ganhos totais
      totalEarnings = transfers.data.reduce((sum, t) => sum + (t.amount / 100), 0)
      
      // Buscar dados de saldo disponível e pendente
      try {
        const balance = await stripe.balance.retrieve({
          stripeAccount: affiliateData.stripeConnectAccountId
        });
        
        // Somar saldos disponíveis
        availableBalance = balance.available.reduce((sum, bal) => {
          return sum + (bal.amount / 100);
        }, 0);
        
        // Somar saldos pendentes
        pendingBalance = balance.pending.reduce((sum, bal) => {
          return sum + (bal.amount / 100);
        }, 0);
      } catch (e) {
        console.error('Erro ao buscar saldo:', e);
      }
      
      // Buscar dados de assinatura dos referidos ativos
      const subscriptionPromises = activeReferrals
        .filter(r => r.referredUser.stripeSubscriptionId)
        .map(async (r) => {
          try {
            if (!r.referredUser.stripeSubscriptionId) return null
            
            const subscription = await stripe.subscriptions.retrieve(
              r.referredUser.stripeSubscriptionId
            )
            
            const price = subscription.items.data[0]?.price
            
            return {
              id: subscription.id,
              email: r.referredUser.email,
              status: subscription.status,
              amount: price && price.unit_amount ? price.unit_amount / 100 : 0,
              interval: price?.recurring?.interval || 'month',
              created: new Date(subscription.created * 1000)
            }
          } catch (e) {
            console.error(`Erro ao buscar assinatura ${r.referredUser.stripeSubscriptionId}:`, e)
            return null
          }
        })
      
      const subResults = await Promise.all(subscriptionPromises)
      subResults.forEach(sub => {
        if (sub) subscriptionData.push(sub);
      });
      
      // Calcular ganhos mensais estimados com base nas assinaturas reais
      estimatedMonthlyEarnings = subscriptionData.reduce((sum, sub) => {
        // Calcular valor mensal (ajustando para assinaturas anuais)
        const monthlyValue = sub.interval === 'year' 
          ? sub.amount / 12 
          : sub.amount
        
        // Aplicar taxa de comissão personalizada
        const commissionRate = affiliateData?.commissionRate || 50;
        return sum + (monthlyValue * (commissionRate / 100))
      }, 0)
    } catch (e) {
      console.error('Erro ao buscar dados do Stripe:', e)
    }
  }
  
  // Estatísticas
  const stats = {
    totalReferrals: affiliateData?.referrals.length || 0,
    activeSubscribers: activeReferrals.length,
    totalEarnings,
    estimatedMonthlyEarnings,
    availableBalance,
    pendingBalance
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Programa de Afiliados</h1>
          
          {needsStripeSetup ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Complete seu Cadastro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Para começar a receber suas comissões, complete seu cadastro no Stripe.
                    Após a conclusão, seu link de afiliado será ativado automaticamente.
                  </p>
                  <Button asChild>
                    <a href={stripeAccountLink?.url} target="_blank" rel="noopener noreferrer">
                      Completar Cadastro no Stripe
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Seu Link de Afiliado
          </div>
                {stripeAccount && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href="https://dashboard.stripe.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Acessar Stripe Dashboard
                    </a>
                  </Button>
                )}
              </CardTitle>
              {stripeAccount && (
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${stripeAccount.charges_enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm text-muted-foreground">
                    Status da conta: {stripeAccount.charges_enabled ? 'Ativa' : 'Pendente'}
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input 
                  value={referralLink || 'Link indisponível até a conclusão do cadastro'} 
                  readOnly 
                  className="font-mono"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <CopyButton 
                          value={referralLink || ''} 
                          disabled={!referralLink}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!referralLink 
                        ? 'Complete seu cadastro no Stripe para ativar seu link'
                        : 'Copiar link'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        </div>

        {!affiliateData ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-4">Comece a Compartilhar e Ganhar</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Junte-se ao nosso programa de afiliados para ganhar comissões em todas as assinaturas originárias de suas indicações.
                </p>
                <a 
                  href="/affiliate-program" 
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Cadastrar-se como Afiliado
                </a>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <TooltipProvider>
                <Card>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-help">
                        <CardTitle className="text-sm font-medium">
                          Clientes Ativos
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Número de clientes que você indicou e que possuem uma assinatura ativa no momento.</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.activeSubscribers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-help">
                        <CardTitle className="text-sm font-medium">
                          Ganhos Totais
                        </CardTitle>
                        <Coins className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Todo o dinheiro que você já ganhou desde que se tornou afiliado. Este valor inclui todas as transferências já realizadas para sua conta e nunca diminui.</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {stats.totalEarnings.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-help">
                        <CardTitle className="text-sm font-medium">
                          Ganhos Mensais
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Valor estimado que você ganha por mês com base nos clientes ativos atuais. Para assinaturas anuais, o valor é dividido por 12 para calcular o equivalente mensal.</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {stats.estimatedMonthlyEarnings.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-help">
                        <CardTitle className="text-sm font-medium">
                          Saldo Disponível
                        </CardTitle>
                        <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                      <p>Dinheiro que você pode sacar agora para sua conta bancária. Este valor já passou pelo período de processamento do Stripe e está liberado para transferência.</p>
                    </TooltipContent>
                  </Tooltip>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      R$ {stats.availableBalance.toFixed(2)}
                    </div>
                    {stats.pendingBalance > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help">
                            + R$ {stats.pendingBalance.toFixed(2)} pendente
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Este valor ainda está em processamento e ficará disponível para saque em breve (geralmente após o período de segurança do Stripe).</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardContent>
                </Card>
              </TooltipProvider>
            </div>

            <Tabs defaultValue="assinantes" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assinantes">Assinantes</TabsTrigger>
                <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assinantes">
            <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Assinantes Ativos</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar assinante..." 
                        className="pl-8" 
                      />
                    </div>
              </CardHeader>
              <CardContent>
                    {subscriptionData.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum assinante ativo encontrado.
                  </div>
                    ) : (
                      <>
                        <div className="relative w-full overflow-auto">
                          <table className="w-full caption-bottom text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="h-12 px-4 text-left font-medium">Email</th>
                                <th className="h-12 px-4 text-left font-medium">Desde</th>
                                <th className="h-12 px-4 text-left font-medium">Plano</th>
                                <th className="h-12 px-4 text-right font-medium">Comissão</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subscriptionData.slice(0, 10).map((sub) => (
                                <tr key={sub.id} className="border-b transition-colors hover:bg-muted/50">
                                  <td className="p-4 align-middle font-medium">{sub.email}</td>
                                  <td className="p-4 align-middle">
                                    {new Date(sub.created).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="p-4 align-middle capitalize">
                                    {sub.interval === 'month' ? 'Mensal' : 'Anual'}
                                  </td>
                                  <td className="p-4 align-middle text-right">
                                    R$ {((sub.amount * (affiliateData?.commissionRate || 50)) / 100).toFixed(2).replace('.', ',')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                </div>
                        
                        {subscriptionData.length > 10 && (
                          <Pagination className="mt-4">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious href="#" />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#" isActive>2</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">3</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationNext href="#" />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    )}
              </CardContent>
            </Card>
              </TabsContent>

              <TabsContent value="pagamentos">
            <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Saldo Disponível</p>
                        <p className="text-2xl font-bold">
                          R$ {stats.availableBalance.toFixed(2)}
                        </p>
                        {stats.pendingBalance > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground cursor-help">
                                  + R$ {stats.pendingBalance.toFixed(2)} pendente
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Este valor ainda está em processamento e ficará disponível em breve.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Total Recebido</p>
                        <p className="text-2xl font-bold">
                          R$ {stats.totalEarnings.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {recentTransfers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum pagamento realizado ainda.
                    </div>
                    ) : (
                      <>
                        <div className="relative w-full overflow-auto">
                          <table className="w-full caption-bottom text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="h-12 px-4 text-left font-medium">Data</th>
                                <th className="h-12 px-4 text-left font-medium">Descrição</th>
                                <th className="h-12 px-4 text-right font-medium">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentTransfers.slice(0, 10).map((transfer) => (
                                <tr key={transfer.id} className="border-b transition-colors hover:bg-muted/50">
                                  <td className="p-4 align-middle">
                                    {formatDistanceToNow(transfer.created, { addSuffix: true, locale: ptBR })}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {transfer.description || 'Comissão de afiliado'}
                                  </td>
                                  <td className="p-4 align-middle text-right font-medium">
                                    R$ {transfer.amount.toFixed(2).replace('.', ',')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                    </div>
                        
                        {recentTransfers.length > 10 && (
                          <Pagination className="mt-4">
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious href="#" />
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">1</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#" isActive>2</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink href="#">3</PaginationLink>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationNext href="#" />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    )}
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
} 