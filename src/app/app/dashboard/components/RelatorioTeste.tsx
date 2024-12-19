import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export const RelatorioTeste: React.FC = () => {
  // Dados de exemplo
  const totalCreditos = 10000
  const creditoGastoSemana = 3000
  const creditoGastoMes = 7000
  const contatosSemana = 200
  const contatosMes = 600

  // Cálculos
  const creditoRestante = totalCreditos - creditoGastoMes
  const porcentagemCreditoSemana = (creditoGastoSemana / totalCreditos) * 100
  const porcentagemCreditoMes = (creditoGastoMes / totalCreditos) * 100
  const porcentagemCreditoRestante = (creditoRestante / totalCreditos) * 100

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
      {/* Card Total de Créditos no Mês */}
      <Card className="sm:col-span-2">
        <CardHeader>
          <CardTitle>Total de Créditos no Mês</CardTitle>
          <CardDescription>
            Total de créditos gastos pela IA no mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{creditoGastoMes}</p>
          <Progress
            value={porcentagemCreditoMes}
            aria-label={`Créditos gastos no mês`}
          />
        </CardContent>
      </Card>

      {/* Card Total de Créditos na Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Total de Créditos na Semana</CardTitle>
          <CardDescription>
            Total de créditos gastos pela IA na semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{creditoGastoSemana}</p>
          <Progress
            value={porcentagemCreditoSemana}
            aria-label={`Créditos gastos na semana`}
          />
        </CardContent>
      </Card>

      {/* Card Crédito Restante */}
      <Card>
        <CardHeader>
          <CardTitle>Crédito Restante</CardTitle>
          <CardDescription>
            Quanto ainda resta de crédito disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{creditoRestante}</p>
          <Progress
            value={porcentagemCreditoRestante}
            aria-label={`Restam ${creditoRestante} de crédito`}
          />
        </CardContent>
      </Card>

      {/* Card Contatos feitos pela IA na Semana */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos pela IA na Semana</CardTitle>
          <CardDescription>
            Total de contatos feitos pela IA na semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{contatosSemana}</p>
        </CardContent>
      </Card>

      {/* Card Contatos feitos pela IA no Mês */}
      <Card>
        <CardHeader>
          <CardTitle>Contatos pela IA no Mês</CardTitle>
          <CardDescription>
            Total de contatos feitos pela IA no mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{contatosMes}</p>
        </CardContent>
      </Card>
    </div>
  )
}
