import { Bot, CheckCircle2, Clock, MessageCircle, Shield, Users, ArrowRight, CheckCircle, User } from "lucide-react"
import { useState, useEffect } from "react"

export default function ManyTalksSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      title: "IA atende automaticamente",
      description: "Responde perguntas simples instantaneamente",
      icon: Bot,
      color: "bg-emerald-500"
    },
    {
      title: "Humano assume",
      description: "Atendente resolve a situação complexa",
      icon: User,
      color: "bg-blue-500"
    },
    {
      title: "IA retorna automaticamente",
      description: "Volta a atender após tempo configurado",
      icon: CheckCircle,
      color: "bg-green-500"
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <section className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-16">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Bot className="h-4 w-4" />
            Conheça o ManyTalks
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
            Atendimento com <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Inteligência Artificial</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            ManyTalks é a plataforma ideal para quem quer um atendente com inteligência artificial no WhatsApp — do seu jeito, com a sua linguagem, atendendo 24h por dia.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Como funciona na prática?</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    A IA conversa direto no WhatsApp da empresa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Você define como ela fala e o que responde
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Quando um humano entra, a IA para automaticamente
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Totalmente Personalizável
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">Ensine tudo sobre seu negócio</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-violet-50 dark:bg-violet-900/30 rounded-2xl">
                <Clock className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">Horários de atendimento</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                <MessageCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">Envie anexos aos clientes</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">IA pausa quando humano assume</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* IA que Sabe Quando Parar - Seção dedicada */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/80 rounded-xl border border-primary/20 p-6 md:p-8 shadow-lg max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">IA que Sabe Quando Parar</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-2xl mx-auto">
              Nossa tecnologia exclusiva: a IA reconhece automaticamente quando um humano deve intervir
            </p>
          </div>

          {/* Fluxo Visual */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              
              return (
                <div key={index} className="flex flex-col items-center text-center relative w-full md:w-1/3">
                  {/* Conexão entre os steps */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-full w-12 h-0.5 bg-primary/20">
                      <ArrowRight className="absolute -top-2 right-0 h-5 w-5 text-primary/40" />
                    </div>
                  )}
                  
                  {/* Ícone */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isActive ? step.color : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <Icon className={`h-8 w-8 transition-colors duration-500 ${
                      isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  
                  {/* Título */}
                  <h4 className={`text-base font-medium mt-4 transition-colors duration-500 ${
                    isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.title}
                  </h4>
                  
                  {/* Descrição */}
                  <p className={`text-sm mt-2 max-w-[200px] mx-auto transition-opacity duration-500 ${
                    isActive ? 'text-gray-600 dark:text-gray-300 opacity-100' : 'opacity-50'
                  }`}>
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Benefício Principal */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/30 text-primary dark:text-white text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Atendimento perfeito com toque humano quando necessário
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 