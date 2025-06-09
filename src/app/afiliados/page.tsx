import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RegisterForm } from '@/app/auth/_components/register-form'
import { Gift, Target, BarChart3, Clock, CheckCircle, Zap, MessageCircle, Users, Settings, Clock3, LayoutDashboard, Bot, CheckCircle2, Shield } from 'lucide-react'

export const metadata = {
  title: 'Programa de Afiliados',
  description: 'Transforme seu networking em renda com o nosso programa de afiliados.',
}

export default function AfiliadosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/60">
      {/* Hero Section */}
      <section id="top" className="container max-w-7xl py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-2 animate-in fade-in slide-in-from-bottom-5 duration-700">
              Programa Exclusivo de Afiliados
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-full overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
              Transforme seu <span className="text-emerald-500 drop-shadow-sm">Networking</span> <br className="hidden md:block" />
              em <span className="text-amber-500 drop-shadow-sm">Renda</span>
            </h1>
            <p className="text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-300 delay-300">
              Complete seu cadastro e comece a construir uma fonte de renda
              extraordinária hoje mesmo.
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Sem mensalidades</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Sem taxas ocultas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>Comece grátis</span>
              </div>
            </div>
          </div>

          <div>
            <Card className="bg-background/60 backdrop-blur-sm border-2 border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardContent className="p-6 md:p-8">
                <div className="flex justify-center mb-8">
                  <div className="p-4 rounded-full bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Gift className="h-8 w-8" />
                  </div>
                </div>
                <RegisterForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ManyTalks Product Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Bot className="h-4 w-4" />
              Conheça o ManyTalks
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              O produto que você vai <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">promover</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              ManyTalks é a plataforma ideal para quem quer um atendente com inteligência artificial no WhatsApp — do seu jeito, com a sua linguagem, atendendo 24h por dia.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Como funciona na prática?</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      A IA conversa direto no WhatsApp da empresa
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Você define como ela fala e o que responde
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Quando um humano entra, a IA para automaticamente
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Para quem é?</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Negócios que querem atender melhor no WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Clínicas e consultórios que querem agilizar agendamentos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      Profissionais autônomos e agências
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Totalmente Personalizável
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                  <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">Ensine tudo sobre seu negócio</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/30 rounded-2xl">
                  <Clock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">Horários de atendimento</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                  <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">Envie anexos aos clientes</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-200 font-medium">IA pausa quando humano assume</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Por que escolher nosso Programa */}
      <section className="container max-w-7xl py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que escolher nosso <span className="text-primary">Programa</span>?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Oferecemos as melhores condições do mercado para maximizar seus ganhos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="bg-gradient-to-br from-emerald-500/90 to-emerald-600 rounded-3xl shadow-lg text-white overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-white/20 p-3 rounded-2xl mb-4">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Comissões Imediatas</h3>
              <p className="text-white/80 text-sm">
                Receba suas comissões automaticamente, sem demoras ou burocracias
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-500/90 to-violet-600 rounded-3xl shadow-lg text-white overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-white/20 p-3 rounded-2xl mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Alta Conversão</h3>
              <p className="text-white/80 text-sm">
                Sistema otimizado para maximizar suas vendas e conversões
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/90 to-blue-600 rounded-3xl shadow-lg text-white overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-white/20 p-3 rounded-2xl mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Dashboard Completo</h3>
              <p className="text-white/80 text-sm">
                Acompanhe todos seus resultados em tempo real com relatórios detalhados
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/90 to-orange-600 rounded-3xl shadow-lg text-white overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-white/20 p-3 rounded-2xl mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Suporte 24/7</h3>
              <p className="text-white/80 text-sm">
                Equipe dedicada disponível a qualquer momento para te ajudar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/90 text-white">
        <div className="container max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para Multiplicar sua Renda?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Junte-se a milhares de afiliados que já estão ganhando dinheiro com nosso
              programa.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Cadastro Gratuito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Sem Mensalidades</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Suporte 24/7</span>
              </div>
            </div>
            <a href="#top">
              <Button size="lg" variant="secondary" className="font-medium px-8 py-6 text-base hover:scale-105 hover:shadow-lg transition-all duration-300">
                Criar Minha Conta Agora
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
} 