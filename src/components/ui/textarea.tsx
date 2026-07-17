import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-surface px-2.5 py-2 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-disabled-foreground disabled:opacity-100 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-surface dark:disabled:bg-surface-elevated dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/30',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
