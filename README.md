# ManyTalks - Plataforma de Criação de Agentes IA

## Sobre o Projeto

ManyTalks é uma plataforma SaaS (Software as a Service) que permite a criação e gerenciamento de agentes de Inteligência Artificial personalizados. Com uma interface intuitiva e moderna, os usuários podem criar, treinar e gerenciar seus próprios agentes IA para diferentes propósitos.

## Funcionalidades Principais

- **Criação de Agentes IA**: Interface intuitiva para criar agentes personalizados
- **Gerenciamento de Agentes**: Painel de controle para monitorar e ajustar seus agentes
- **Autenticação Segura**: Sistema robusto de autenticação com suporte a SSO
- **Integração com Stripe**: Sistema de pagamento e gerenciamento de assinaturas
- **API RESTful**: Endpoints para integração com outros sistemas

## Tecnologias Utilizadas

- **Frontend**:
  - Next.js 14 (App Router)
  - React
  - Tailwind CSS
  - Shadcn/ui
  - TypeScript

- **Backend**:
  - Node.js
  - Prisma (ORM)
  - PostgreSQL
  - NextAuth.js

- **Infraestrutura**:
  - Docker
  - Vercel/Self-hosted

## Requisitos do Sistema

- Node.js 18+
- PostgreSQL
- Yarn

## Variáveis de Ambiente

```env
# App
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
NODE_ENV=production

# Auth
NEXTAUTH_SECRET=seu-secret-aqui
JWT_SECRET=seu-jwt-secret-aqui

# Database
DATABASE_URL=sua-url-do-postgres

# Stripe (opcional)
STRIPE_PUBLISHABLE_KEY=sua-chave-publica
STRIPE_SECRET_KEY=sua-chave-secreta
STRIPE_WEBHOOK_SECRET=seu-webhook-secret
```

## Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/manytalks.git
cd manytalks
```

2. Instale as dependências
```bash
yarn install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
```

4. Execute as migrações do banco de dados
```bash
yarn prisma migrate deploy
```

5. Inicie o servidor de desenvolvimento
```bash
yarn dev
```

## Estrutura do Projeto

```
src/
├── app/                    # Rotas e componentes da aplicação
│   ├── api/               # Endpoints da API
│   ├── app/               # Área autenticada
│   └── auth/              # Sistema de autenticação
├── components/            # Componentes reutilizáveis
├── lib/                   # Utilitários e helpers
└── services/             # Serviços externos (Stripe, etc)
```

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

## Contato

ManyTalks - [suporteinovechat@gmail.com](mailto:suporteinovechat@gmail.com)

---

Desenvolvido com ❤️ pela equipe ManyTalks
