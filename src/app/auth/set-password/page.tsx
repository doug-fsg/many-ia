'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';

function SetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const form = useForm();

  const sessionId = searchParams.get('session_id');
  const affiliateRef = searchParams.get('affiliate_ref');

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Link Inválido</h1>
          <p className="text-gray-500 dark:text-gray-400">
            O link para definir sua senha é inválido ou expirou.
          </p>
        </div>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => window.location.href = '/auth'}
        >
          Voltar para o login
        </Button>
      </div>
    );
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsLoading(true);

      if (data.password !== data.confirmPassword) {
        toast({
          title: 'Erro',
          description: 'As senhas não coincidem.',
          variant: 'destructive',
        });
        return;
      }

      // Preparar os dados para envio, incluindo o código de afiliado se existir
      const requestData = {
        sessionId,
        password: data.password,
      };
      
      // Se tiver código de afiliado, incluir na requisição
      if (affiliateRef) {
        Object.assign(requestData, { affiliateRef });
        console.log('[SET-PASSWORD] Enviando código de afiliado na requisição:', affiliateRef);
      }

      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ocorreu um erro ao definir sua senha.');
      }

      toast({
        title: 'Senha definida',
        description: 'Sua senha foi definida com sucesso. Você já pode fazer login.',
      });

      // Redirecionar para a página de login após 2 segundos
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="mx-auto max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Definir Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Digite sua senha abaixo para começar a usar sua conta.
        </p>
        <p className="text-sm text-blue-600">
          Enviamos também um email com um link para definir sua senha, caso você precise fazer isso depois.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            placeholder="********"
            disabled={isLoading}
            {...form.register('password')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirme a Senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            placeholder="********"
            disabled={isLoading}
            {...form.register('confirmPassword')}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Definindo...' : 'Definir Senha'}
        </Button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Carregando...</h1>
        </div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
} 