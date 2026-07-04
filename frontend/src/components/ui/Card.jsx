import { cn } from '../../lib/cn'

const titleGradients = {
  default: 'text-foreground',
  indigo: 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-violet-300',
  cyan: 'bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-sky-300',
  emerald: 'bg-clip-text text-transparent bg-gradient-to-r from-emerald-200 to-teal-300',
  amber: 'bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-orange-300',
  rose: 'bg-clip-text text-transparent bg-gradient-to-r from-rose-200 to-pink-300',
  fuchsia: 'bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-200 to-purple-300',
}

export function Card({ className, children, hover, ...props }) {
  return (
    <div className={cn(hover ? 'card-premium-hover' : 'card-premium', 'min-w-0 max-w-full', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('px-4 sm:px-6 pt-6 pb-4 flex flex-wrap items-center justify-between gap-4 min-w-0', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, accent = 'default' }) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight', titleGradients[accent] || titleGradients.default, className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children }) {
  return <p className={cn('text-sm text-muted mt-0.5', className)}>{children}</p>
}

export function CardContent({ className, children }) {
  return <div className={cn('px-4 sm:px-6 pb-6 min-w-0', className)}>{children}</div>
}
