'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WizardData } from '../smart-wizard'

interface WizardStep1Props {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
}

const RAMOS_ATIVIDADE = [
  'Imobiliária',
  'Loja de Roupas',
  'Restaurante',
  'Clínica Médica',
  'Escritório de Advocacia',
  'Salão de Beleza',
  'Academia',
  'Escola/Curso',
  'E-commerce',
  'Consultoria',
  'Agência de Marketing',
  'Oficina Mecânica',
  'Petshop',
  'Farmácia',
  'Outro'
]

export function WizardStep1({ data, onUpdate }: WizardStep1Props) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">👋 Vamos conhecer seu negócio</h2>
        <p className="text-sm text-muted-foreground">
          Essas informações ajudam a personalizar seu atendente
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ramo">Qual é o seu ramo de atividade?</Label>
          <Select value={data.ramo} onValueChange={(value) => onUpdate({ ramo: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu ramo de atividade..." />
            </SelectTrigger>
            <SelectContent>
              {RAMOS_ATIVIDADE.map((ramo) => (
                <SelectItem key={ramo} value={ramo}>
                  {ramo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="empresa">Qual o nome da sua empresa?</Label>
          <Input
            id="empresa"
            placeholder="Ex: Imobiliária Santos, Loja da Maria..."
            value={data.empresa}
            onChange={(e) => onUpdate({ empresa: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="produtos">Produto/serviço específico? (opcional)</Label>
          <Input
            id="produtos"
            placeholder="Ex: Apartamentos, Roupas femininas, Pizza..."
            value={data.produtos || ''}
            onChange={(e) => onUpdate({ produtos: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Isso ajuda a personalizar as respostas do atendente
          </p>
        </div>
      </div>
    </div>
  )
}
