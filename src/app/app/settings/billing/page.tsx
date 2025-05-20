import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { auth } from '@/services/auth'
import { getUserCurrentPlan, stripe } from '@/services/stripe'
import { redirect } from 'next/navigation'
import { AlertTriangle, CheckCircle, CreditCard, Calendar, FileText } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ManageSubscriptionButton } from './_components/manage-subscription-button'
import { ReactivateSubscriptionButton } from './_components/reactivate-subscription-button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/services/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function Page() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  if (session.user.isIntegrationUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plano de Integração</CardTitle>
          <CardDescription>
            Esta conta não possui acesso ao gerenciamento de assinatura.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const plan = await getUserCurrentPlan(session.user.id)
  const creditsUsed = plan.quota.credits?.current || 0
  const totalCredits = plan.quota.credits?.available || 10000
  const creditsPercentage = plan.quota.credits?.usage || 0
  const isOutOfCredits = creditsUsed >= totalCredits

  // Buscar informações detalhadas da assinatura
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      stripeSubscriptionStatus: true
    }
  })

  let subscriptionDetails = null;
  let paymentMethod = null;
  let invoices = null;

  if (user?.stripeSubscriptionId) {
    try {
      subscriptionDetails = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Buscar método de pagamento padrão
      if (user.stripeCustomerId) {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId);
        if (customer && !customer.deleted && customer.default_source) {
          paymentMethod = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
            limit: 1
          });
        }
        
        // Buscar faturas recentes
        invoices = await stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 3
        });
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da assinatura:', error);
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'canceled': return 'Cancelada';
      case 'incomplete': return 'Incompleta';
      case 'incomplete_expired': return 'Expirada';
      case 'past_due': return 'Atrasada';
      case 'trialing': return 'Em período de teste';
      case 'unpaid': return 'Não paga';
      default: return status;
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'trialing': return 'bg-blue-500';
      case 'past_due': return 'bg-orange-500';
      case 'incomplete':
      case 'unpaid': return 'bg-yellow-500';
      case 'canceled':
      case 'incomplete_expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  const getFormattedDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }

  const formatCardInfo = (card: any) => {
    if (!card) return null;
    return `**** **** **** ${card.last4} | ${card.exp_month}/${card.exp_year}`;
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount / 100);
  }

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Uso do Plano</CardTitle>
          <CardDescription>
            Você está atualmente no plano PRO com 10.000 créditos mensais.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <header className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {creditsUsed.toLocaleString('pt-BR')}/{totalCredits.toLocaleString('pt-BR')} créditos
              </span>
              <span className="text-muted-foreground text-sm">
                {creditsPercentage.toFixed(1)}%
              </span>
            </header>
            <main>
              <Progress value={creditsPercentage} className={isOutOfCredits ? 'bg-destructive' : ''} />
            </main>
            <footer className="text-sm text-muted-foreground">
                <p>Você tem {(totalCredits - creditsUsed).toLocaleString('pt-BR')} créditos disponíveis este mês.</p>
            </footer>
          </div>
        </CardContent>
      </Card>

      {subscriptionDetails && (
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex justify-between items-center">
              <CardTitle>Detalhes da Assinatura</CardTitle>
              <Badge className={getStatusColor(subscriptionDetails.status)}>
                {getStatusText(subscriptionDetails.status)}
              </Badge>
            </div>
            <CardDescription>
              Informações sobre sua assinatura atual.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Próxima renovação</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionDetails.current_period_end ? 
                      getFormattedDate(subscriptionDetails.current_period_end) : 
                      'Não disponível'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Método de pagamento</p>
                  {paymentMethod && paymentMethod.data[0] ? (
                    <p className="text-sm text-muted-foreground">
                      {paymentMethod.data[0].card ? 
                        formatCardInfo(paymentMethod.data[0].card) : 
                        'Cartão de crédito'}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não disponível</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Valor mensal</p>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionDetails.items.data[0]?.price ? 
                      formatPrice(subscriptionDetails.items.data[0].price.unit_amount || 0) : 
                      'R$ 250,00'}
                  </p>
                </div>
              </div>

              {invoices && invoices.data.length > 0 && (
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="font-medium">Faturas recentes</p>
                    <div className="space-y-2 mt-2">
                      {invoices.data.map((invoice) => (
                        <div key={invoice.id} className="flex justify-between text-sm">
                          <span>{getFormattedDate(invoice.created)}</span>
                          <span className={invoice.paid ? 'text-green-600' : 'text-red-600'}>
                            {formatPrice(invoice.amount_paid)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>
            {subscriptionDetails?.status === 'canceled' 
              ? 'Sua assinatura está cancelada. Você pode reativá-la após pagar todas as faturas pendentes.'
              : 'Gerencie sua assinatura atual, método de pagamento e faturas.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {subscriptionDetails?.status === 'canceled' ? (
            <div className="space-y-4">
              <ManageSubscriptionButton />
              {/* Só mostra o botão de reativação se não houver faturas pendentes */}
              {invoices && !invoices.data.some(invoice => !invoice.paid) && (
                <ReactivateSubscriptionButton />
              )}
            </div>
          ) : (
            <ManageSubscriptionButton />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
