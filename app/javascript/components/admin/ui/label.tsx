import { forwardRef } from 'react'
import type { LabelHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label(
  { className, ...props },
  ref,
) {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-medium leading-none text-foreground select-none', className)}
      {...props}
    />
  )
})
