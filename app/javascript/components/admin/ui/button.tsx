import { cloneElement, forwardRef, isValidElement } from 'react'
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../lib/cn'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link'
type Size = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  asChild?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
  ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  link: 'text-foreground underline-offset-4 hover:underline',
}

const SIZE_CLASSES: Record<Size, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-6 text-base',
  icon: 'h-9 w-9',
}

const BASE = 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'default', asChild = false, className, children, ...props },
  ref,
) {
  const classes = cn(BASE, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className)

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string; children?: ReactNode }>
    return cloneElement(child, {
      ...props,
      className: cn(classes, child.props.className),
    } as Record<string, unknown>)
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})
