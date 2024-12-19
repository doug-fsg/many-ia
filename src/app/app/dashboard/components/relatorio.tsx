'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export default function Dashboard() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Seus Pedidos</CardTitle>
            <CardDescription>
              Apresentando nosso painel de pedidos dinâmico para gerenciamento e
              análise eficientes.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button>Criar Novo Pedido</Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Esta Semana</CardDescription>
            <CardTitle className="text-4xl">R$1.329</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +25% em relação à semana passada
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={25} aria-label="Aumento de 25%" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este Mês</CardDescription>
            <CardTitle className="text-4xl">R$5.329</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              +10% em relação ao mês passado
            </div>
          </CardContent>
          <CardFooter>
            <Progress value={12} aria-label="Aumento de 12%" />
          </CardFooter>
        </Card>
      </div>
      <Tabs defaultValue="semana">
        <TabsList>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="ano">Ano</TabsTrigger>
        </TabsList>
        <TabsContent value="semana">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos da Semana</CardTitle>
              <CardDescription>
                Visão geral dos pedidos desta semana.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Conteúdo dos pedidos da semana aqui */}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="mes">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos do Mês</CardTitle>
              <CardDescription>
                Visão geral dos pedidos deste mês.
              </CardDescription>
            </CardHeader>
            <CardContent>{/* Conteúdo dos pedidos do mês aqui */}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ano">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos do Ano</CardTitle>
              <CardDescription>
                Visão geral dos pedidos deste ano.
              </CardDescription>
            </CardHeader>
            <CardContent>{/* Conteúdo dos pedidos do ano aqui */}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
