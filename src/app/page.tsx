"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Zap, Clock, Users, ArrowRight, Star, BarChart3, Settings, Bell, CheckCircle, Menu, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"ia" | "dashboard">("ia")
  const [isMobile, setIsMobile] = useState(false)

  // Detectar se estamos em um dispositivo móvel
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])

  // Function to open WhatsApp with the provided number
  const openWhatsApp = () => {
    window.open("https://wa.me/5553997002767", "_blank")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold">ManyTalks IA</span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
              Recursos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
              Como Funciona
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group">
              Demonstração
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </a>
          </nav>
          
          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="outline" asChild className="rounded-full px-6">
              <a href="/auth">Entrar</a>
            </Button>
            <Button onClick={openWhatsApp} className="rounded-full px-6">
              Fale Conosco <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex items-center gap-2 mb-8">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">ManyTalks IA</span>
              </div>
              <nav className="flex flex-col gap-4 py-4">
                <a 
                  href="#features" 
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                >
                  Recursos
                </a>
                <a 
                  href="#how-it-works" 
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                >
                  Como Funciona
                </a>
                <a 
                  href="#demo" 
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
                >
                  Demonstração
                </a>
                <a 
                  href="/auth" 
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1 mt-2"
                >
                  Entrar
                </a>
                <Button onClick={openWhatsApp} className="mt-4 rounded-full">
                  Fale Conosco <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                  Inteligência Artificial para WhatsApp
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Automatize seu <span className="text-primary relative">atendimento<span className="absolute bottom-2 left-0 w-full h-[0.2em] bg-primary/20 rounded-full"></span></span> no WhatsApp
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-[600px] leading-relaxed">
                  Crie agentes de IA personalizados que atendem seus clientes 24/7, aumentando suas vendas e reduzindo
                  custos operacionais.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button size="lg" onClick={openWhatsApp} className="w-full sm:w-auto rounded-full px-8">
                    Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" asChild className="w-full sm:w-auto rounded-full px-8">
                    <a href="/auth">Começar Agora</a>
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Empresas de diversos segmentos já utilizam nossos agentes</span>
                </div>
              </div>
              <div className="relative lg:ml-auto mt-8 lg:mt-0">
                {/* Dashboard Preview */}
                <div className="rounded-xl border shadow-xl overflow-hidden bg-background relative z-10">
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/10 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
                  <div className="flex h-12 items-center border-b px-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span className="font-semibold">ManyTalks IA</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">AD</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-[300px] md:h-[400px] lg:h-[500px] flex-col md:flex-row">
                    <div className="w-full md:w-[220px] border-b md:border-r md:border-b-0 p-2 bg-background">
                      <nav className="space-y-1">
                        {[
                          { icon: Bot, label: "Inteligência Artificial", active: true },
                          { icon: BarChart3, label: "Dashboard" },
                          { icon: Settings, label: "Configurações" },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                              item.active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </nav>
                    </div>
                    <div className="flex-1 overflow-auto bg-background">
                      <div className="p-6">
                        <header className="px-6 h-12 border-b border-border flex items-center justify-between mb-6">
                          <span className="text-xs text-muted-foreground uppercase">Inteligência Artificial</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                              Criar Novo Agente
                            </Button>
                          </div>
                        </header>
                        <div className="relative w-full h-full">
                          {isMobile ? (
                            <div className="p-4 text-center text-muted-foreground">
                              <Bot className="mx-auto h-12 w-12 mb-2 text-primary" />
                              <p>Painel de controle mobile</p>
                            </div>
                          ) : (
                            <Image src="/images/ia-01.png" alt="Dashboard do Sistema" fill className="object-contain" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -z-10 -top-4 -right-4 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -z-10 -bottom-8 -left-8 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 bg-background relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-2">
                Recursos
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">Recursos Exclusivos</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Nossos agentes de IA são projetados para transformar seu atendimento no WhatsApp
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-none shadow-lg bg-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Agentes Personalizados</CardTitle>
                  <CardDescription className="text-base">
                    Crie e gerencie agentes de IA com personalidade e conhecimentos específicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure agentes para diferentes setores e funções, como vendas, suporte ou agendamento.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Dashboard Analítico</CardTitle>
                  <CardDescription className="text-base">Acompanhe métricas e estatísticas de desempenho em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize gráficos e dados que mostram como seus agentes estão performando e onde podem melhorar.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Respostas Instantâneas</CardTitle>
                  <CardDescription className="text-base">Atendimento imediato para seus clientes, sem tempo de espera</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nossos agentes respondem em segundos, garantindo que nenhum cliente fique esperando.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-16 text-center">
              <Button size="lg" onClick={openWhatsApp} className="rounded-full px-8">
                Conheça Todos os Recursos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-16 md:py-24 bg-muted/50 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-2">
                Processo
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">Como Funciona</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Implementação simples em apenas 3 passos
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-0.5 bg-primary/20"></div>
              
              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10 border border-primary/20">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold">Personalize seu Agente</h3>
                <p className="text-muted-foreground">
                  Defina as características, conhecimentos e tom de voz do seu agente de IA.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10 border border-primary/20">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold">Conecte ao WhatsApp</h3>
                <p className="text-muted-foreground">
                  Integramos o agente ao seu número de WhatsApp Business em minutos.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative z-10 border border-primary/20">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold">Comece a Atender</h3>
                <p className="text-muted-foreground">
                  Seu agente está pronto para atender seus clientes 24 horas por dia, 7 dias por semana.
                </p>
              </div>
            </div>

            <div className="mt-16 text-center">
              <Button size="lg" onClick={openWhatsApp} className="rounded-full px-8">
                Começar Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Conheça a Plataforma</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Interface intuitiva para gerenciar seus agentes de IA e acompanhar resultados
              </p>
            </div>

            <Tabs
              defaultValue="ia"
              onValueChange={(value) => setActiveTab(value as "ia" | "dashboard")}
              className="w-full max-w-5xl mx-auto"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="ia">Inteligência Artificial</TabsTrigger>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              </TabsList>
              <TabsContent value="ia">
                <div className="rounded-lg border shadow-lg overflow-hidden bg-background">
                  <div className="flex h-12 items-center border-b px-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span className="font-semibold">ManyTalks IA</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">AD</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-[400px] md:h-[500px] flex-col md:flex-row">
                    <div className="w-full md:w-[220px] border-b md:border-r md:border-b-0 p-2 bg-background">
                      <nav className="space-y-1">
                        {[
                          { icon: Bot, label: "Inteligência Artificial", active: true },
                          { icon: BarChart3, label: "Dashboard" },
                          { icon: Settings, label: "Configurações" },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                              item.active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </nav>
                    </div>
                    <div className="flex-1 overflow-auto bg-background">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
                          <h2 className="text-xl font-bold">INTELIGÊNCIA ARTIFICIAL</h2>
                          <Button size="sm">Criar Novo</Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle>Sofia</CardTitle>
                                <Badge className="bg-green-500 text-white">ativo</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Comercial</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-2">
                              <Button variant="ghost" size="sm" className="text-xs">
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Desativar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Excluir
                              </Button>
                            </CardFooter>
                          </Card>

                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle>Suporte</CardTitle>
                                <Badge className="bg-green-500 text-white">ativo</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>Atendimento</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-2">
                              <Button variant="ghost" size="sm" className="text-xs">
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Desativar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Excluir
                              </Button>
                            </CardFooter>
                          </Card>

                          <Card className="w-full">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <CardTitle>Vendas</CardTitle>
                                <Badge className="bg-gray-300 text-gray-700">inativo</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                <span>Vendas</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2 pt-2">
                              <Button variant="ghost" size="sm" className="text-xs">
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Ativar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                Excluir
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="dashboard">
                <div className="rounded-lg border shadow-lg overflow-hidden bg-background">
                  <div className="flex h-12 items-center border-b px-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span className="font-semibold">ManyTalks IA</span>
                    </div>
                    <div className="ml-auto flex items-center gap-4">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">AD</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex h-[400px] md:h-[500px] flex-col md:flex-row">
                    <div className="w-full md:w-[220px] border-b md:border-r md:border-b-0 p-2 bg-background">
                      <nav className="space-y-1">
                        {[
                          { icon: Bot, label: "Inteligência Artificial", active: false },
                          { icon: BarChart3, label: "Dashboard", active: true },
                          { icon: Settings, label: "Configurações" },
                        ].map((item, index) => (
                          <div
                            key={index}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                              item.active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </nav>
                    </div>
                    <div className="flex-1 overflow-auto bg-background">
                      <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
                          <h2 className="text-xl font-bold">DASHBOARD</h2>
                          <Select defaultValue="7dias">
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                              <SelectItem value="mes">Este mês</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-4 mb-6">
                          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardDescription>Total de Interações</CardDescription>
                                <CardTitle className="text-3xl">1.248</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">+12% em relação à semana anterior</div>
                              </CardContent>
                              <CardFooter>
                                <Progress value={12} aria-label="Aumento de 12%" />
                              </CardFooter>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardDescription>Novos Contatos</CardDescription>
                                <CardTitle className="text-3xl">87</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">+23% em relação à semana anterior</div>
                              </CardContent>
                              <CardFooter>
                                <Progress value={23} aria-label="Aumento de 23%" />
                              </CardFooter>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardDescription>Taxa de Resolução</CardDescription>
                                <CardTitle className="text-3xl">78%</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">+5% em relação à semana anterior</div>
                              </CardContent>
                              <CardFooter>
                                <Progress value={5} aria-label="Aumento de 5%" />
                              </CardFooter>
                            </Card>

                            <Card>
                              <CardHeader className="pb-2">
                                <CardDescription>Tempo Médio</CardDescription>
                                <CardTitle className="text-3xl">2m 14s</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-xs text-muted-foreground">-18% em relação à semana anterior</div>
                              </CardContent>
                              <CardFooter>
                                <Progress value={18} aria-label="Redução de 18%" className="bg-primary/20" />
                              </CardFooter>
                            </Card>
                          </div>
                        </div>

                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>Relatório de Interações</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0 mb-4">
                              <div className="flex-1">
                                <Label htmlFor="search">Buscar</Label>
                                <Input id="search" placeholder="Buscar por nome, telefone ou interesse" />
                              </div>
                              <div>
                                <Label htmlFor="status">Filtrar por Status</Label>
                                <Select defaultValue="all">
                                  <SelectTrigger id="status" className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Todos" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="novo">Novo</SelectItem>
                                    <SelectItem value="interessado">Interessado</SelectItem>
                                    <SelectItem value="convertido">Convertido</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                                    <TableHead className="hidden md:table-cell">Interesse</TableHead>
                                    <TableHead className="hidden md:table-cell">Interações</TableHead>
                                    <TableHead className="hidden lg:table-cell">Último Contato</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>Maria Silva</TableCell>
                                    <TableCell className="hidden sm:table-cell">+55 11 98765-4321</TableCell>
                                    <TableCell className="hidden md:table-cell">Atendimento Automático</TableCell>
                                    <TableCell className="hidden md:table-cell">12</TableCell>
                                    <TableCell className="hidden lg:table-cell">12/04/2025 14:30</TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-500 text-white">Convertido</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>João Santos</TableCell>
                                    <TableCell className="hidden sm:table-cell">+55 21 99876-5432</TableCell>
                                    <TableCell className="hidden md:table-cell">Vendas</TableCell>
                                    <TableCell className="hidden md:table-cell">8</TableCell>
                                    <TableCell className="hidden lg:table-cell">11/04/2025 09:15</TableCell>
                                    <TableCell>
                                      <Badge className="bg-yellow-500 text-white">Interessado</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Ana Oliveira</TableCell>
                                    <TableCell className="hidden sm:table-cell">+55 31 97654-3210</TableCell>
                                    <TableCell className="hidden md:table-cell">Suporte</TableCell>
                                    <TableCell className="hidden md:table-cell">3</TableCell>
                                    <TableCell className="hidden lg:table-cell">10/04/2025 16:45</TableCell>
                                    <TableCell>
                                      <Badge className="bg-blue-500 text-white">Novo</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Carlos Pereira</TableCell>
                                    <TableCell className="hidden sm:table-cell">+55 41 98765-1234</TableCell>
                                    <TableCell className="hidden md:table-cell">Atendimento Automático</TableCell>
                                    <TableCell className="hidden md:table-cell">15</TableCell>
                                    <TableCell className="hidden lg:table-cell">09/04/2025 11:20</TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-500 text-white">Convertido</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Fernanda Lima</TableCell>
                                    <TableCell className="hidden sm:table-cell">+55 51 99876-2345</TableCell>
                                    <TableCell className="hidden md:table-cell">Vendas</TableCell>
                                    <TableCell className="hidden md:table-cell">5</TableCell>
                                    <TableCell className="hidden lg:table-cell">08/04/2025 13:10</TableCell>
                                    <TableCell>
                                      <Badge className="bg-yellow-500 text-white">Interessado</Badge>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-12 text-center">
              <Button size="lg" onClick={openWhatsApp} className="w-full sm:w-auto">
                Quero Conhecer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Benefícios</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Veja como o ManyTalks IA pode transformar seu negócio
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <CheckCircle className="h-5 w-5 text-primary" /> Atendimento 24/7
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Seus clientes recebem respostas instantâneas a qualquer hora do dia ou da noite, sem necessidade de
                    equipe de plantão.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <CheckCircle className="h-5 w-5 text-primary" /> Redução de Custos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Economize até 70% em custos operacionais de atendimento ao cliente com automação inteligente.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <CheckCircle className="h-5 w-5 text-primary" /> Aumento de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Responder rapidamente às dúvidas dos clientes aumenta significativamente as taxas de conversão e
                    vendas.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 flex-wrap">
                    <CheckCircle className="h-5 w-5 text-primary" /> Escalabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Atenda centenas ou milhares de clientes simultaneamente sem perda de qualidade ou tempo de espera.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">O que Nossos Clientes Dizem</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Empresas que transformaram seu atendimento com nossos agentes
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle>Maria Silva</CardTitle>
                  <CardDescription>Loja de Roupas Online</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "Aumentamos nossas vendas em 40% após implementar o agente de IA. Nossos clientes adoram receber
                    respostas imediatas, mesmo fora do horário comercial."
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle>Carlos Mendes</CardTitle>
                  <CardDescription>Restaurante</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "O agente gerencia todos os nossos pedidos pelo WhatsApp. Reduzimos custos com atendimento e
                    melhoramos a experiência dos clientes."
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle>Ana Costa</CardTitle>
                  <CardDescription>Clínica Estética</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    "O agente agenda consultas, responde dúvidas e faz follow-up com clientes. É como ter um assistente
                    trabalhando 24 horas por dia."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-indigo-600/20 to-purple-600/20 mix-blend-overlay"></div>
          <div className="container px-4 md:px-6 text-center relative z-10">
            <div className="max-w-[800px] mx-auto space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">Transforme seu Atendimento Hoje</h2>
              <p className="text-primary-foreground/90 md:text-xl max-w-[600px] mx-auto">
                Não perca a oportunidade de automatizar seu atendimento com inteligência artificial!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={openWhatsApp}
                  className="bg-white text-primary hover:bg-white/90 w-full sm:w-auto"
                >
                  Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto"
                >
                  <a href="/auth">
                    Acessar Plataforma <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-12 md:px-6">
          <div className="grid gap-8 grid-cols-1 xs:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ManyTalks IA</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformando o atendimento ao cliente com inteligência artificial avançada.
              </p>
              <div className="flex gap-4 mt-4">
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-muted-foreground">
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-muted-foreground">
                    <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                  </svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 p-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-muted-foreground">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                  </svg>
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-muted-foreground hover:text-primary transition-colors">
                    Demonstração
                  </a>
                </li>
                <li>
                  <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">
                    Depoimentos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Contato</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  <span>WhatsApp: +55 53 9700-2767</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                  <span>Email: contato@manytalks.com.br</span>
                </li>
                <li className="pt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href="/auth">Área do Cliente</a>
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Newsletter</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Receba novidades e dicas sobre IA para seu negócio
              </p>
              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  placeholder="Seu email"
                  className="bg-background/80"
                />
                <Button className="w-full">
                  Assinar
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} ManyTalks IA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


