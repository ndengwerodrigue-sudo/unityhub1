import { cn } from '../../lib/cn'

const variants = {
  default: 'chip-muted',
  success: 'chip-success',
  warning: 'chip-warning',
  info: 'chip-info',
  post: 'chip bg-primary/10 text-primary border-primary/20',
  opportunity: 'chip bg-success/10 text-success border-success/20',
  business: 'chip bg-secondary/10 text-secondary border-secondary/20',
  event: 'chip bg-primary/10 text-primary border-primary/20',
}

export default function Badge({ variant = 'default', className, children }) {
  return <span className={cn(variants[variant] || variants.default, className)}>{children}</span>
}
