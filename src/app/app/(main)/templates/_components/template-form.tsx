'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import * as z from 'zod'
import { Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  quemEhAtendente: z.string().min(1, 'Campo obrigatório'),
  oQueAtendenteFaz: z.string().min(1, 'Campo obrigatório'),
  objetivoAtendente: z.string().min(1, 'Campo obrigatório'),
  comoAtendenteDeve: z.string().min(1, 'Campo obrigatório'),
})

type FormValues = z.infer<typeof formSchema>

export function TemplateForm() {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quemEhAtendente: '',
      oQueAtendenteFaz: '',
      objetivoAtendente: '',
      comoAtendenteDeve: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          nomeAtendenteDigital: data.name,
          horarioAtendimento: '24/7',
          informacoesEmpresa: '',
          tempoRetornoAtendimento: '',
          condicoesAtendimento: '',
          isPublic: false,
          isPublished: false
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar modelo')
      }

      toast.success('Modelo criado com sucesso!')
      router.push('/app/templates')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao criar modelo')
      console.error(error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Modelo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Atendente de Vendas" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quemEhAtendente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quem é o seu Atendente?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva quem é seu atendente digital..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="oQueAtendenteFaz"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que seu Atendente faz?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva as principais atividades do seu atendente..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objetivoAtendente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual o objetivo do seu Atendente?</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os objetivos do seu atendente..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="comoAtendenteDeve"
          render={({ field }) => (
            <FormItem className="space-y-2 rounded-lg p-4 border-2 border-dashed border-orange-200 bg-orange-50/50">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" />
                <FormLabel className="text-orange-700 font-medium">Instruções Internas (Visível apenas para a IA)</FormLabel>
              </div>
              <FormDescription className="text-orange-600">
                Este campo é secreto e será usado apenas pela IA para entender como deve se comportar. Os usuários que utilizarem este template não terão acesso a estas instruções.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Instruções privadas sobre como o atendente deve se comportar..."
                  className="bg-white/50 border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">
          Criar Modelo
        </Button>
      </form>
    </Form>
  )
} 