'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const createCalendarSchema = z.object({
  name: z.string().min(1, 'O nome da agenda é obrigatório'),
  description: z.string().optional(),
});

type CreateCalendarFormData = z.infer<typeof createCalendarSchema>;

interface GoogleCalendarCreateCalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GoogleCalendarCreateCalendarDialog({
  isOpen,
  onClose,
  onSuccess,
}: GoogleCalendarCreateCalendarDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CreateCalendarFormData>({
    resolver: zodResolver(createCalendarSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: CreateCalendarFormData) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/integrations/google-calendar/calendars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar agenda');
      }

      toast({
        title: 'Sucesso',
        description: 'Nova agenda criada com sucesso.',
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Erro ao criar agenda:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a agenda.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Agenda</DialogTitle>
          <DialogDescription>
            Crie uma nova agenda no Google Calendar para organizar seus eventos.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={e => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Agenda</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Agendamentos Automáticos" {...field} />
                  </FormControl>
                  <FormDescription>
                    Este nome será exibido no Google Calendar
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Eventos criados pelo agente de IA" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Uma breve descrição para identificar o propósito desta agenda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Criando...' : 'Criar Agenda'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 