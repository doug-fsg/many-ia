import { PuzzleIcon } from 'lucide-react';

export function IntegrationsHeader() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <PuzzleIcon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
      </div>
      <p className="text-muted-foreground">
        Conecte seu agente de IA com outras ferramentas e serviços para expandir suas funcionalidades.
      </p>
    </div>
  );
} 