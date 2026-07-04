import { cn } from '../../lib/cn'

export default function Avatar({ src, name, size = 'md', className }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' }
  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={cn('rounded-xl object-cover border border-border bg-surface', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center font-semibold text-white bg-gradient-to-br from-primary to-secondary border border-border',
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}
