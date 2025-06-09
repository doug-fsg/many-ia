import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/services/database';
import { hash } from 'bcrypt';
import { stripe } from '@/services/stripe';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, isAffiliate } = body;

    console.log('[REGISTER] Iniciando registro de usuário:', { name, email, isAffiliate });

    if (!name || !email || !password) {
      console.log('[REGISTER] Dados incompletos para registro');
      return NextResponse.json(
        { error: 'Dados incompletos para registro.' },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      console.log('[REGISTER] Email já em uso:', email);
      return NextResponse.json(
        { error: 'Este email já está em uso.' },
        { status: 409 }
      );
    }

    // Hashear a senha
    const hashedPassword = await hash(password, 10);

    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
        canCreateTemplates: isAffiliate, // Permitir criação de templates para afiliados
      },
    });

    console.log('[REGISTER] Usuário criado:', {
      id: user.id,
      email: user.email,
      isAffiliate,
      canCreateTemplates: user.canCreateTemplates
    });

    // Se o registro veio da página de afiliados, criar conta Stripe e registro de afiliado
    if (isAffiliate) {
      try {
        console.log('[REGISTER] Criando conta Stripe Connect para afiliado');
        // Criar conta Stripe Connect
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'BR',
          email: email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          business_type: 'individual'
        });

        console.log('[REGISTER] Conta Stripe Connect criada:', account.id);

        // Criar registro de afiliado com a conta Stripe
        const affiliate = await prisma.affiliate.create({
          data: {
            userId: user.id,
            stripeConnectAccountId: account.id,
            referralCode: nanoid(10),
            status: 'pending'
          }
        });

        console.log('[REGISTER] Registro de afiliado criado:', affiliate.id);

        // Gerar link do Stripe Connect
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/templates/affiliate?refresh=true`,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/templates/affiliate?success=true`,
          type: 'account_onboarding'
        });

        console.log('[REGISTER] Link do Stripe Connect gerado');

        // Remover a senha do objeto retornado
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
          { 
            message: 'Usuário criado com sucesso.', 
            user: userWithoutPassword,
            stripeAccountLink: accountLink.url 
          },
          { status: 201 }
        );
      } catch (stripeError) {
        console.error('[REGISTER] Erro ao criar conta Stripe:', stripeError);
        // Se houver erro no Stripe, ainda retornamos sucesso mas sem o link
        // Remover a senha do objeto retornado
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
          { message: 'Usuário criado com sucesso.', user: userWithoutPassword },
          { status: 201 }
        );
      }
    }

    // Remover a senha do objeto retornado
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'Usuário criado com sucesso.', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER] Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação.' },
      { status: 500 }
    );
  }
} 