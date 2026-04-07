'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ 
  title, 
  description, 
  icon, 
  children, 
  className 
}: SectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-5 w-5 items-center justify-center text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}




