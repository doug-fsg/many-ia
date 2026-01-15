'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardData } from '../smart-wizard'

interface WizardStep2Props {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
}

const OBJETIVOS = [
  { value: 'vender', label: 'Vender produtos/serviços', desc: 'Converter visitantes em clientes' },
  { value: 'agendar', label: 'Agendar consultas/visitas', desc: 'Marcar horários e compromissos' },
  { value: 'suporte', label: 'Fornecer suporte técnico', desc: 'Resolver problemas e dúvidas' },
  { value: 'qualificar', label: 'Qualificar leads', desc: 'Identificar potenciais clientes' },
  { value: 'informar', label: 'Responder dúvidas frequentes', desc: 'Fornecer informações básicas' },
  { value: 'outro', label: 'Outro objetivo', desc: 'Descreva seu objetivo específico' }
]

export function WizardStep2({ data, onUpdate }: WizardStep2Props) {
  const handleObjetivoChange = (objetivo: string) => {
    onUpdate({ objetivo })
    if (objetivo !== 'outro') {
      onUpdate({ detalhesObjetivo: '' })
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">🎯 Qual o principal objetivo?</h2>
        <p className="text-sm text-muted-foreground">
          Isso define como seu atendente vai interagir com os clientes
        </p>
      </div>

      <div className="space-y-3">
        {OBJETIVOS.map((objetivo) => (
          <div
            key={objetivo.value}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 ${
              data.objetivo === objetivo.value 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-card'
            }`}
            onClick={() => handleObjetivoChange(objetivo.value)}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-4 h-4 border-2 rounded-full mt-0.5 transition-colors ${
                data.objetivo === objetivo.value 
                  ? 'border-primary bg-primary' 
                  : 'border-border'
              }`}>
                {data.objetivo === objetivo.value && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{objetivo.label}</h3>
                <p className="text-sm text-muted-foreground">{objetivo.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.objetivo === 'outro' && (
        <div className="space-y-2">
          <Label htmlFor="detalhes">Descreva seu objetivo específico:</Label>
          <Textarea
            id="detalhes"
            placeholder="Ex: Fazer cotações de seguros, agendar test drives..."
            value={data.detalhesObjetivo || ''}
            onChange={(e) => onUpdate({ detalhesObjetivo: e.target.value })}
            rows={3}
          />
        </div>
      )}
    </div>
  )
}
