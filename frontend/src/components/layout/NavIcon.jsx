import { cn } from '../../lib/cn'

const ACCENT_TEXT = {
  indigo: 'text-indigo-400',
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  fuchsia: 'text-fuchsia-400',
}

const SIZES = {
  xs: { wrap: 'w-5 h-5', icon: 'w-3 h-3' },
  sm: { wrap: 'w-5 h-5', icon: 'w-3.5 h-3.5' },
  md: { wrap: 'w-7 h-7 rounded-lg', icon: 'w-3.5 h-3.5' },
}

/** Sidebar: flat icon beside label. Mobile tabs: optional compact tile. */
export default function NavIcon({ item, active, size = 'md', variant = 'tile' }) {
  const Icon = item.icon
  const s = SIZES[size] || SIZES.md
  const accentClass = ACCENT_TEXT[item.accent] || 'text-primary'

  if (variant === 'sidebar') {
    return (
      <Icon
        className={cn(
          s.icon,
          'flex-shrink-0 transition-colors duration-200',
          active ? accentClass : 'text-muted group-hover:text-foreground/80'
        )}
        strokeWidth={active ? 2.25 : 2}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center flex-shrink-0 rounded-lg transition-all duration-200',
        s.wrap,
        active
          ? cn('bg-gradient-to-br ring-1 ring-white/10', item.iconGradient, item.iconShadow)
          : 'bg-white/[0.05] border border-white/[0.06]'
      )}
    >
      <Icon
        className={cn(s.icon, active ? 'text-white' : 'text-muted')}
        strokeWidth={active ? 2.25 : 2}
      />
    </div>
  )
}
