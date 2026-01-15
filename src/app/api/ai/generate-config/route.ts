import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Usar IA real se a chave estiver configurada
    let generatedConfig
    if (process.env.OPENAI_API_KEY) {
      generatedConfig = await generateWithAI(data)
    } else {
      // Fallback para mock se não houver chave da API
      generatedConfig = generateMockConfig(data)
    }

    return NextResponse.json(generatedConfig)
  } catch (error) {
    console.error('Erro ao gerar configuração:', error)
    // Em caso de erro, usar fallback
    const fallbackConfig = generateMockConfig(await request.json())
    return NextResponse.json(fallbackConfig)
  }
}

async function generateWithAI(data: any) {
  const prompt = createPrompt(data)
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Você é um especialista em criação de atendentes virtuais. Gere respostas profissionais e naturais baseadas nas informações fornecidas."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
  })

  const response = completion.choices[0]?.message?.content
  if (!response) throw new Error('Resposta vazia da IA')

  // Parse da resposta da IA (assumindo formato JSON)
  try {
    return JSON.parse(response)
  } catch {
    // Se não conseguir fazer parse, usar fallback
    return generateMockConfig(data)
  }
}

function createPrompt(data: any): string {
  return `
Crie uma configuração completa para um atendente virtual baseado nas seguintes informações:

Empresa: ${data.empresa}
Ramo: ${data.ramo}
${data.produtos ? `Produtos/Serviços: ${data.produtos}` : ''}
Nome do Atendente: ${data.nomeAtendente}
Gênero: ${data.genero}
Personalidade: ${data.personalidade}
Objetivo: ${data.objetivo}
${data.detalhesObjetivo ? `Detalhes do Objetivo: ${data.detalhesObjetivo}` : ''}
Horário: ${data.horario}
${data.mencionar ? `Mencionar: ${data.mencionar}` : ''}

Retorne APENAS um JSON válido com os seguintes campos:
{
  "nomeAtendenteDigital": "nome do atendente",
  "quemEhAtendente": "descrição de quem é o atendente (2-3 frases)",
  "oQueAtendenteFaz": "descrição das atividades (2-3 frases)",
  "objetivoAtendente": "objetivo principal (2-3 frases)",
  "comoAtendenteDeve": "instruções de como deve responder (3-4 frases)",
  "informacoesEmpresa": "informações sobre a empresa (2-3 frases)",
  "horarioAtendimento": "${data.horario}",
  "isActive": true,
  "enviarParaAtendente": true,
  ${data.isIntegrationUser 
    ? '"condicoesAtendimento": "condições específicas para encaminhar ao atendente humano"'
    : '"tempoRetornoAtendimento": "Não retornar automaticamente" ou escolha um tempo adequado'
  }
}

Importante: Use linguagem natural e profissional. Adapte o tom à personalidade escolhida.
`
}

function generateMockConfig(data: any) {
  const config: any = {
    nomeAtendenteDigital: data.nomeAtendente,
    quemEhAtendente: generateQuemEhAtendente(data),
    oQueAtendenteFaz: generateOQueAtendenteFaz(data),
    objetivoAtendente: generateObjetivoAtendente(data),
    comoAtendenteDeve: generateComoAtendenteDeve(data),
    informacoesEmpresa: generateInformacoesEmpresa(data),
    horarioAtendimento: data.horario,
    isActive: true,
    enviarParaAtendente: true
  }

  // Tratamento específico para usuários de integração
  if (data.isIntegrationUser) {
    // Para usuários de integração, incluir condições de atendimento
    config.enviarParaAtendente = true
    config.condicoesAtendimento = generateCondicoesAtendimento(data)
  } else {
    // Para usuários normais, incluir tempo de retorno
    config.tempoRetornoAtendimento = 'Não retornar automaticamente'
  }

  return config
}

function generateQuemEhAtendente(data: any): string {
  const pronome = data.genero === 'feminino' ? 'ela' : data.genero === 'masculino' ? 'ele' : 'essa IA'
  const artigo = data.genero === 'feminino' ? 'uma' : data.genero === 'masculino' ? 'um' : 'uma'
  
  return `${data.nomeAtendente} é ${artigo} atendente digital especializada em ${data.ramo.toLowerCase()} que trabalha na ${data.empresa}. ${pronome.charAt(0).toUpperCase() + pronome.slice(1)} foi desenvolvida para oferecer um atendimento ${getPersonalidadeDesc(data.personalidade)} e ajudar clientes de forma eficiente.`
}

function generateOQueAtendenteFaz(data: any): string {
  const objetivo = getObjetivoDesc(data)
  return `${data.nomeAtendente} realiza atendimento ao cliente com foco em ${objetivo}. Responde dúvidas sobre ${data.ramo.toLowerCase()}, fornece informações sobre produtos e serviços da ${data.empresa}, e orienta clientes durante todo o processo de atendimento.${data.produtos ? ` Tem conhecimento especializado em ${data.produtos.toLowerCase()}.` : ''}`
}

function generateObjetivoAtendente(data: any): string {
  const objetivo = getObjetivoDesc(data)
  return `O principal objetivo é ${objetivo} de forma eficiente e personalizada. ${data.nomeAtendente} busca entender as necessidades de cada cliente e direcioná-los para a melhor solução oferecida pela ${data.empresa}.${data.mencionar ? ` Sempre menciona: ${data.mencionar.toLowerCase()}.` : ''}`
}

function generateComoAtendenteDeve(data: any): string {
  const personalidade = getPersonalidadeStyle(data.personalidade)
  return `${data.nomeAtendente} deve responder de forma ${personalidade}. Sempre cumprimentar o cliente, apresentar-se pelo nome, entender a necessidade específica e fornecer informações relevantes. Manter o tom ${getPersonalidadeDesc(data.personalidade)} durante toda a conversa e finalizar oferecendo ajuda adicional.`
}

function generateInformacoesEmpresa(data: any): string {
  return `${data.empresa} é uma empresa do ramo de ${data.ramo.toLowerCase()} que se destaca pelo atendimento de qualidade.${data.produtos ? ` Especializada em ${data.produtos.toLowerCase()}.` : ''} Nosso compromisso é oferecer a melhor experiência para nossos clientes, com soluções personalizadas e atendimento humanizado.`
}

function getObjetivoDesc(data: any): string {
  const objetivos = {
    'vender': 'vendas e conversão de clientes',
    'agendar': 'agendamento de consultas e visitas',
    'suporte': 'suporte técnico e resolução de problemas',
    'qualificar': 'qualificação de leads e prospecção',
    'informar': 'fornecimento de informações e esclarecimentos',
    'outro': data.detalhesObjetivo || 'atendimento personalizado'
  }
  return objetivos[data.objetivo] || 'atendimento de qualidade'
}

function getPersonalidadeDesc(personalidade: string): string {
  const descrições = {
    'formal': 'profissional e respeitoso',
    'amigavel': 'amigável e acolhedor',
    'tecnico': 'objetivo e direto',
    'consultivo': 'consultivo e educativo'
  }
  return descrições[personalidade] || 'profissional'
}

function getPersonalidadeStyle(personalidade: string): string {
  const estilos = {
    'formal': 'formal, utilizando linguagem técnica apropriada',
    'amigavel': 'descontraída e próxima, como uma conversa entre amigos',
    'tecnico': 'direta e objetiva, focando em eficiência',
    'consultivo': 'educativa, explicando detalhes e orientando o cliente'
  }
  return estilos[personalidade] || 'profissional'
}

function generateCondicoesAtendimento(data: any): string {
  const objetivo = getObjetivoDesc(data)
  return `Encaminhar para atendente humano quando: o cliente solicitar informações específicas sobre ${objetivo}, quiser falar com uma pessoa, houver dúvidas complexas sobre produtos/serviços da ${data.empresa}, ou quando a situação exigir intervenção humana especializada.`
}
