import { cn } from '../../lib/cn'
import { getPageAccent } from '../../config/navigation'

export default function PageHeading({
  eyebrow,
  title,
  description,
  pathname,
  children,
  className,
}) {
  const accent = getPageAccent(pathname || '/dashboard')

  return (
    <div className={cn('space-y-2 mb-8 w-full min-w-0', className)}>
      {eyebrow && (
        <p className={cn('text-xs font-bold uppercase tracking-[0.2em]', accent.eyebrow)}>
          {eyebrow}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 w-full min-w-0">
        <div className="space-y-2 max-w-2xl min-w-0 flex-1">
          <h1
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r',
              accent.titleGradient
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-muted leading-relaxed">{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap gap-2 shrink-0 w-full sm:w-auto">{children}</div>}
      </div>
    </div>
  )
}
