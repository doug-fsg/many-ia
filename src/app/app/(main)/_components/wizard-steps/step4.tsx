'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WizardData } from '../smart-wizard'

interface WizardStep4Props {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
}

const HORARIOS = [
  { value: 'Atender 24h por dia', label: '24 horas por dia', desc: 'Atendimento contínuo, sempre disponível' },
  { value: 'Fora do horário de atendimento', label: 'Fora do horário comercial', desc: 'Só quando você não estiver disponível' },
  { value: 'Dentro do horário de atendimento', label: 'No horário comercial', desc: 'Apenas durante o expediente' }
]

export function WizardStep4({ data, onUpdate }: WizardStep4Props) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">⏰ Quando deve funcionar?</h2>
        <p className="text-sm text-muted-foreground">
          Configure quando seu atendente estará ativo
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Horário de funcionamento:</Label>
          {HORARIOS.map((horario) => (
            <div
              key={horario.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                data.horario === horario.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-card'
              }`}
              onClick={() => onUpdate({ horario: horario.value })}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-4 h-4 border-2 rounded-full mt-0.5 transition-colors ${
                  data.horario === horario.value 
                    ? 'border-primary bg-primary' 
                    : 'border-border'
                }`}>
                  {data.horario === horario.value && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{horario.label}</h3>
                  <p className="text-sm text-muted-foreground">{horario.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mencionar">Algo específico para mencionar? (opcional)</Label>
          <Input
            id="mencionar"
            placeholder="Ex: Promoção atual, novo produto, contato WhatsApp..."
            value={data.mencionar || ''}
            onChange={(e) => onUpdate({ mencionar: e.target.value })}
          />
          <p className="text-sm text-muted-foreground">
            Informações extras que o atendente deve sempre mencionar
          </p>
        </div>
      </div>

      <div className="bg-accent/50 rounded-lg p-3">
        <h3 className="font-medium text-sm mb-1">✨ Resumo do seu atendente:</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="truncate"><strong>{data.nomeAtendente || 'Atendente'}</strong> - {data.empresa || 'Empresa'}</p>
          <p className="truncate">🎯 {data.objetivo === 'outro' ? (data.detalhesObjetivo || 'Objetivo personalizado') : data.objetivo || 'Objetivo'}</p>
          <p className="truncate">⏰ {data.horario || 'Horário de atendimento'}</p>
        </div>
      </div>
    </div>
  )
}
