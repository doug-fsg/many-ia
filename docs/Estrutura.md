# Diretrizes de Desenvolvimento

## Princípios Gerais

1. **Simplicidade Primeiro**
   - Preferir soluções simples e diretas
   - Evitar over-engineering
   - Manter o código fácil de entender e manter

2. **Organização do Código**
   - Arquivos não devem exceder 200-300 linhas
   - Funções devem ser pequenas e focadas
   - Dividir componentes grandes em menores quando necessário
   - Manter uma estrutura de diretórios clara e organizada

3. **Bibliotecas e Dependências**
   - Minimizar o número de bibliotecas externas
   - Preferir bibliotecas bem estabelecidas e mantidas
   - Usar shadcn/ui como base para componentes UI
   - Evitar duplicação de funcionalidades entre bibliotecas

4. **Padrões de Código**
   - Usar TypeScript para type safety
   - Nomear funções com verbos (exceto em testes/mocks)
   - Manter consistência no estilo de código
   - Evitar duplicação de código

5. **Segurança e Ambiente**
   - Considerar diferentes ambientes (dev, test, prod)
   - Nunca expor chaves de API no código
   - Usar variáveis de ambiente apropriadamente
   - Garantir que o código seja seguro para produção

6. **Performance**
   - Otimizar para build em produção
   - Evitar re-renders desnecessários
   - Manter o bundle size pequeno
   - Considerar carregamento lazy quando apropriado

## Práticas Específicas

### Componentes React
- Estender componentes base do shadcn/ui em vez de criar do zero
- Usar forwardRef quando necessário para compatibilidade
- Manter props tipadas corretamente
- Documentar props complexas

### Formulários
- Usar react-hook-form para gerenciamento de formulários
- Validar com Zod
- Manter validações consistentes entre cliente e servidor

### Estilização
- Usar Tailwind CSS
- Manter classes organizadas e legíveis
- Evitar CSS customizado quando possível
- Usar variáveis CSS para temas

### Gerenciamento de Estado
- Manter estado local quando possível
- Usar Context API para estado global quando necessário
- Evitar estado global desnecessário

## Processo de Desenvolvimento

1. **Planejamento**
   - Entender completamente o requisito
   - Mapear impactos da mudança
   - Planejar a implementação antes de começar

2. **Implementação**
   - Fazer mudanças incrementais
   - Testar cada mudança
   - Manter o código limpo e documentado

3. **Revisão**
   - Verificar impacto em diferentes ambientes
   - Garantir que não há regressões
   - Validar performance e segurança

4. **Manutenção**
   - Manter documentação atualizada
   - Remover código não utilizado
   - Refatorar quando necessário

## Comandos e Ambiente

- Usar Yarn como gerenciador de pacotes
- Desenvolvimento local: `yarn dev`
- Produção: `yarn build` seguido de `yarn start`
- Não executar comandos diretamente no terminal do usuário
- Não executar comandos PostgreSQL diretamente

## Considerações Finais

- Sempre pensar em produção
- Manter o código escalável
- Facilitar a manutenção futura
- Priorizar a experiência do usuário