import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function Card(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
})

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardHeader(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('flex flex-col gap-1 p-4', className)} {...props} />
})

export const CardTitle = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardTitle(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
})

export const CardDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardDescription(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
})

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardContent(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('px-4 pb-4 last:pb-4 first:pt-4', className)} {...props} />
})

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function CardFooter(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('flex items-center px-4 pb-4 first:pt-4', className)} {...props} />
})
