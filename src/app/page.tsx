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
import { Bot, Zap, Clock, Users, ArrowRight, Star, BarChart3, Settings, Bell, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"ia" | "dashboard">("ia")

  // Function to open WhatsApp with the provided number
  const openWhatsApp = () => {
    window.open("https://wa.me/5553997002767", "_blank")
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ManyTalks IA</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Recursos
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Como Funciona
            </a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Demonstração
            </a>
          </nav>
          <Button onClick={openWhatsApp} className="hidden sm:flex">
            Fale Conosco <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <Badge
                  className="mb-2 bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors border-amber-200"
                  variant="outline"
                >
                  <Clock className="mr-1 h-3 w-3" /> Oferta por tempo limitado
                </Badge>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Automatize seu atendimento no WhatsApp com Inteligência Artificial
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Crie agentes de IA personalizados que atendem seus clientes 24/7, aumentando suas vendas e reduzindo
                  custos operacionais.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={openWhatsApp}>
                    Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <a href="#demo">Ver Demonstração</a>
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Mais de 500 empresas já utilizam nossos agentes</span>
                </div>
              </div>
              <div className="relative lg:ml-auto">
                {/* Dashboard Preview */}
                <div className="rounded-lg border shadow-xl overflow-hidden bg-background">
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
                  <div className="flex h-[500px]">
                    <div className="w-[220px] border-r p-2 bg-background">
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
                          <Image src="/images/ia-01.png" alt="Dashboard do Sistema" fill className="object-contain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Recursos Exclusivos</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Nossos agentes de IA são projetados para transformar seu atendimento no WhatsApp
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Bot className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Agentes Personalizados</CardTitle>
                  <CardDescription>
                    Crie e gerencie agentes de IA com personalidade e conhecimentos específicos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure agentes para diferentes setores e funções, como vendas, suporte ou agendamento.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Dashboard Analítico</CardTitle>
                  <CardDescription>Acompanhe métricas e estatísticas de desempenho em tempo real</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize gráficos e dados que mostram como seus agentes estão performando e onde podem melhorar.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Respostas Instantâneas</CardTitle>
                  <CardDescription>Atendimento imediato para seus clientes, sem tempo de espera</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nossos agentes respondem em segundos, garantindo que nenhum cliente fique esperando.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Badge variant="secondary" className="mb-4 bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="mr-1 h-3 w-3" /> Últimas 3 vagas disponíveis
              </Badge>
              <Button size="lg" onClick={openWhatsApp}>
                Garanta sua Vaga Agora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-12 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Como Funciona</h2>
              <p className="text-muted-foreground md:text-xl max-w-[700px] mx-auto">
                Implementação simples em apenas 3 passos
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h3 className="text-xl font-bold">Personalize seu Agente</h3>
                <p className="text-muted-foreground">
                  Defina as características, conhecimentos e tom de voz do seu agente de IA.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h3 className="text-xl font-bold">Conecte ao WhatsApp</h3>
                <p className="text-muted-foreground">
                  Integramos o agente ao seu número de WhatsApp Business em minutos.
                </p>
              </div>

              <div className="flex flex-col items-center text-center space-y-3">
                <div className="bg-primary/10 p-3 rounded-full">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h3 className="text-xl font-bold">Comece a Atender</h3>
                <p className="text-muted-foreground">
                  Seu agente está pronto para atender seus clientes 24 horas por dia, 7 dias por semana.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Button size="lg" onClick={openWhatsApp}>
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
                  <div className="flex h-[500px]">
                    <div className="w-[220px] border-r p-2 bg-background">
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
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold">INTELIGÊNCIA ARTIFICIAL</h2>
                          <Button size="sm">Criar Novo</Button>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          <Card className="w-full max-w-[300px]">
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
                            <CardFooter className="flex gap-2 pt-2">
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

                          <Card className="w-full max-w-[300px]">
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
                            <CardFooter className="flex gap-2 pt-2">
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

                          <Card className="w-full max-w-[300px]">
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
                            <CardFooter className="flex gap-2 pt-2">
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
                  <div className="flex h-[500px]">
                    <div className="w-[220px] border-r p-2 bg-background">
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
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold">DASHBOARD</h2>
                          <Select defaultValue="7dias">
                            <SelectTrigger className="w-[180px]">
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
                          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
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
                                  <SelectTrigger id="status" className="w-[180px]">
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
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Interesse</TableHead>
                                    <TableHead>Interações</TableHead>
                                    <TableHead>Último Contato</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>Maria Silva</TableCell>
                                    <TableCell>+55 11 98765-4321</TableCell>
                                    <TableCell>Atendimento Automático</TableCell>
                                    <TableCell>12</TableCell>
                                    <TableCell>12/04/2025 14:30</TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-500 text-white">Convertido</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>João Santos</TableCell>
                                    <TableCell>+55 21 99876-5432</TableCell>
                                    <TableCell>Vendas</TableCell>
                                    <TableCell>8</TableCell>
                                    <TableCell>11/04/2025 09:15</TableCell>
                                    <TableCell>
                                      <Badge className="bg-yellow-500 text-white">Interessado</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Ana Oliveira</TableCell>
                                    <TableCell>+55 31 97654-3210</TableCell>
                                    <TableCell>Suporte</TableCell>
                                    <TableCell>3</TableCell>
                                    <TableCell>10/04/2025 16:45</TableCell>
                                    <TableCell>
                                      <Badge className="bg-blue-500 text-white">Novo</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Carlos Pereira</TableCell>
                                    <TableCell>+55 41 98765-1234</TableCell>
                                    <TableCell>Atendimento Automático</TableCell>
                                    <TableCell>15</TableCell>
                                    <TableCell>09/04/2025 11:20</TableCell>
                                    <TableCell>
                                      <Badge className="bg-green-500 text-white">Convertido</Badge>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>Fernanda Lima</TableCell>
                                    <TableCell>+55 51 99876-2345</TableCell>
                                    <TableCell>Vendas</TableCell>
                                    <TableCell>5</TableCell>
                                    <TableCell>08/04/2025 13:10</TableCell>
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
              <Button size="lg" onClick={openWhatsApp}>
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

            <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                  <CardTitle className="flex items-center gap-2">
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
                  <CardTitle className="flex items-center gap-2">
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
                  <CardTitle className="flex items-center gap-2">
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
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 mix-blend-overlay"></div>
          <div className="container px-4 md:px-6 text-center relative z-10">
            <div className="max-w-[800px] mx-auto space-y-4">
              <Badge variant="secondary" className="bg-white text-amber-600 border border-amber-200 font-medium">
                Oferta Especial
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Transforme seu Atendimento Hoje</h2>
              <p className="text-primary-foreground/90 md:text-xl">
                Primeiros 10 clientes recebem 30% de desconto e configuração gratuita
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={openWhatsApp}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Saiba Mais <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={openWhatsApp}
                  className="border-white text-white hover:bg-white/10"
                >
                  Agendar Demonstração
                </Button>
              </div>
              <p className="text-sm text-primary-foreground/80 mt-4">
                <Clock className="inline h-4 w-4 mr-1" /> Oferta válida por tempo limitado
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted">
        <div className="container px-4 py-8 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ManyTalks IA</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transformando o atendimento ao cliente com inteligência artificial avançada.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-primary">
                    Recursos
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-muted-foreground hover:text-primary">
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-muted-foreground hover:text-primary">
                    Demonstração
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Contato</h3>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">WhatsApp: +55 53 9700-2767</li>
                <li className="text-muted-foreground">Email: contato@manytalks.com.br</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Newsletter</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Seu email"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button variant="outline" size="sm">
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

