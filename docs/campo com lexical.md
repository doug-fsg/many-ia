# Campo: Quem é o seu Atendente?

## Descrição
Este campo é usado para definir a persona do atendente digital, estabelecendo sua identidade e papel no sistema de atendimento automatizado.

## Características Técnicas
- **Tipo**: String
- **Obrigatório**: Sim
- **Validação**: Mínimo de 1 caractere
- **Componente**: LexicalTextEditor (Editor de texto rico)
- **Armazenamento**: Campo `quemEhAtendente` na tabela `AIConfig` do banco de dados

## Uso
O campo deve ser preenchido com uma descrição clara e concisa da identidade do atendente digital, incluindo:
- Quem ele é
- Sua especialidade
- Seu papel no atendimento

## Exemplos de Uso

### Atendente de Suporte
```text
Sou um assistente de suporte ao cliente dedicado, especializado em resolver problemas e fornecer ajuda técnica.
```

### Consultor de Vendas
```text
Sou um consultor de vendas especializado em identificar necessidades e oferecer as melhores soluções para cada cliente.
```

## Boas Práticas
1. **Seja Específico**: Defina claramente a especialidade do atendente
2. **Use Primeira Pessoa**: Escreva como se o atendente estivesse se apresentando
3. **Mantenha Profissionalismo**: Use linguagem formal e profissional
4. **Seja Conciso**: Evite descrições muito longas ou complexas
5. **Alinhe com o Objetivo**: A descrição deve refletir o propósito principal do atendente

## Integração com Outros Campos
- Trabalha em conjunto com "O que seu Atendente faz?" para definir o escopo completo do atendente
- Influencia diretamente como o atendente se apresentará aos clientes
- Deve estar alinhado com o "Objetivo do Atendente"

## Interface do Usuário
- Campo expansível para edição em tela cheia
- Suporta formatação rica através do editor Lexical
- Indicador visual de preenchimento (verde quando preenchido, amarelo quando vazio)
- Botão de expansão para edição em área maior

## Validações
1. Não pode estar vazio
2. Deve conter uma descrição significativa
3. É validado pelo schema Zod antes do salvamento

## Considerações Técnicas
- Parte do formulário principal de configuração de IA
- Armazenado como texto plano no banco de dados
- Suporta recursos de edição rica através do LexicalTextEditor
- Mantém estado consistente entre edições normais e em tela cheia

## Impacto no Sistema
- Define a base da personalidade do atendente digital
- Influencia o tom e estilo das respostas automáticas
- Fundamental para a experiência do usuário final