const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Criar usuário Douglas
  const passwordHash = await bcrypt.hash('84476291', 10)
  const douglasUser = await prisma.user.upsert({
    where: { email: 'doug.fsg@gmail.com' },
    update: {
      name: 'Douglas',
      canCreateTemplates: true,
    },
    create: {
      email: 'doug.fsg@gmail.com',
      name: 'Douglas',
      password: passwordHash,
      canCreateTemplates: true,
    },
  })

  console.log('✅ Usuário Douglas criado/atualizado')

  // Criar um usuário padrão para os templates do sistema
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@manytalks.ai' },
    update: {
      canCreateTemplates: true,
    },
    create: {
      email: 'system@manytalks.ai',
      name: 'System',
      canCreateTemplates: true,
    },
  })

  console.log('✅ Usuário do sistema criado/atualizado')

  const systemTemplates = [
    {
      name: 'suporteCliente',
      nomeAtendenteDigital: 'Assistente de Suporte',
      quemEhAtendente: 'Sou um assistente de suporte ao cliente dedicado, especializado em resolver problemas e fornecer ajuda técnica.',
      oQueAtendenteFaz: 'Ajudo clientes com dúvidas técnicas, problemas com produtos/serviços, e forneço soluções rápidas e eficientes.',
      objetivoAtendente: 'Garantir a satisfação do cliente através de respostas rápidas e precisas, resolvendo problemas de forma eficiente.',
      comoAtendenteDeve: 'Ser paciente, empático e profissional. Usar linguagem clara e acessível. Seguir protocolos de atendimento.',
      horarioAtendimento: 'Atender 24h por dia',
      tempoRetornoAtendimento: 'Não retornar automaticamente',
      condicoesAtendimento: 'Quando houver reclamação grave, Quando precisar de aprovação superior, Quando envolver reembolso',
      informacoesEmpresa: '',
      isPublic: true,
      isPublished: false
    },
    {
      name: 'consultorVendas',
      nomeAtendenteDigital: 'Consultor Comercial',
      quemEhAtendente: 'Sou um consultor de vendas especializado em identificar necessidades e oferecer as melhores soluções para cada cliente.',
      oQueAtendenteFaz: 'Apresento produtos/serviços, esclareço dúvidas sobre preços e condições, e auxilio no processo de compra.',
      objetivoAtendente: 'Converter leads em vendas através de um atendimento consultivo e personalizado.',
      comoAtendenteDeve: 'Ser proativo, persuasivo e profissional. Focar em benefícios e valor agregado. Qualificar leads adequadamente.',
      horarioAtendimento: 'Dentro do horário de atendimento',
      tempoRetornoAtendimento: 'Não retornar automaticamente',
      condicoesAtendimento: 'Quando houver negociação especial, Quando for pedido personalizado',
      informacoesEmpresa: '',
      isPublic: true,
      isPublished: false
    },
    {
      name: 'corretor',
      nomeAtendenteDigital: 'Consultor Imobiliário',
      quemEhAtendente: 'Sou um corretor de imóveis especializado em encontrar a propriedade ideal para cada cliente.',
      oQueAtendenteFaz: 'Apresento imóveis, esclareço dúvidas sobre localização, preços e documentação, e agendo visitas.',
      objetivoAtendente: 'Facilitar o processo de compra/aluguel de imóveis, matching perfeito entre cliente e propriedade.',
      comoAtendenteDeve: 'Ser conhecedor do mercado, profissional e atencioso. Entender necessidades específicas do cliente.',
      horarioAtendimento: 'Dentro do horário de atendimento',
      tempoRetornoAtendimento: 'Não retornar automaticamente',
      condicoesAtendimento: 'Quando houver proposta, Quando precisar de visita, Quando solicitar documentação',
      informacoesEmpresa: '',
      isPublic: true,
      isPublished: false
    },
  ]

  for (const template of systemTemplates) {
    await prisma.template.upsert({
      where: { name: template.name },
      update: {
        ...template,
        userId: systemUser.id,
      },
      create: {
        ...template,
        userId: systemUser.id,
      },
    })
    console.log(`✅ Template ${template.name} criado/atualizado`)
  }

  console.log('✨ Seed finalizado!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 