import { Loader2 } from 'lucide-react';

export function SpinnerLoader() {
  return (
    <div className="flex items-center justify-center h-24">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}
