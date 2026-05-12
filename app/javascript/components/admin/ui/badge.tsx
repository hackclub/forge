import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Variant = 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground border border-transparent',
  secondary: 'bg-secondary text-secondary-foreground border border-transparent',
  outline: 'text-foreground border border-border',
  destructive: 'bg-destructive text-destructive-foreground border border-transparent',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-transparent',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-transparent',
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  )
}
