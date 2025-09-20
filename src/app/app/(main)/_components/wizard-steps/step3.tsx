'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WizardData } from '../smart-wizard'

interface WizardStep3Props {
  data: WizardData
  onUpdate: (data: Partial<WizardData>) => void
}

const PERSONALIDADES = [
  { value: 'formal', label: 'Formal e Profissional', desc: 'Linguagem técnica e respeitosa' },
  { value: 'amigavel', label: 'Amigável e Descontraído', desc: 'Conversa natural e próxima' },
  { value: 'tecnico', label: 'Técnico e Objetivo', desc: 'Direto ao ponto, sem enrolação' },
  { value: 'consultivo', label: 'Consultivo e Educativo', desc: 'Explica e orienta o cliente' }
]

const GENEROS = [
  { value: 'feminino', label: 'Feminino', emoji: '👩' },
  { value: 'masculino', label: 'Masculino', emoji: '👨' },
  { value: 'neutro', label: 'Neutro', emoji: '🤖' }
]

export function WizardStep3({ data, onUpdate }: WizardStep3Props) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-1">🎭 Como seu atendente deve ser?</h2>
        <p className="text-sm text-muted-foreground">
          Defina a personalidade e o nome do seu atendente digital
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Qual o nome do atendente?</Label>
          <Input
            id="nome"
            placeholder="Ex: Ana, Carlos, Maria..."
            value={data.nomeAtendente}
            onChange={(e) => onUpdate({ nomeAtendente: e.target.value })}
          />
        </div>

        <div className="space-y-3">
          <Label>Gênero do atendente:</Label>
          <div className="flex gap-3">
            {GENEROS.map((genero) => (
              <div
                key={genero.value}
                className={`flex-1 p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                  data.genero === genero.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card'
                }`}
                onClick={() => onUpdate({ genero: genero.value })}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{genero.emoji}</div>
                  <div className="text-sm font-medium">{genero.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Que personalidade deve ter?</Label>
          {PERSONALIDADES.map((personalidade) => (
            <div
              key={personalidade.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                data.personalidade === personalidade.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-card'
              }`}
              onClick={() => onUpdate({ personalidade: personalidade.value })}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-4 h-4 border-2 rounded-full mt-0.5 transition-colors ${
                  data.personalidade === personalidade.value 
                    ? 'border-primary bg-primary' 
                    : 'border-border'
                }`}>
                  {data.personalidade === personalidade.value && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{personalidade.label}</h3>
                  <p className="text-sm text-muted-foreground">{personalidade.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
