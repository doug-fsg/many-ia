'use client'

import { TemplateForm } from '../_components/template-form'

export default function NovoTemplatePage() {
  return (
    <div className="h-full p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Novo Modelo</h1>
        <p className="text-sm text-muted-foreground">
          Crie um novo modelo para seu atendente digital
        </p>
      </div>
      <div className="space-y-4 max-w-4xl">
        <TemplateForm />
      </div>
    </div>
  )
} 