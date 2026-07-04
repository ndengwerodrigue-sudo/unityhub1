import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import AuthVideoPanel from './AuthVideoPanel'

export const authInputClass =
  'w-full h-11 pl-10 pr-4 rounded-lg bg-background/50 border border-border text-foreground placeholder:text-subtle ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition disabled:opacity-50'

export const authLabelClass = 'block text-sm font-medium text-foreground/90 mb-1.5'

export default function AuthLayout({ children, title, subtitle, footer }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px] bg-background text-foreground [color-scheme:dark]">
      {/* Left — hero video (desktop) */}
      <AuthVideoPanel className="hidden lg:flex min-h-screen border-r border-border/60" />

      {/* Right — form panel */}
      <div className="relative flex flex-col min-h-screen bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none lg:hidden" />

        {/* Mobile: compact video strip */}
        <div className="lg:hidden relative w-full aspect-video max-h-[220px] shrink-0 border-b border-border/60 overflow-hidden">
          <AuthVideoPanel className="h-full w-full" compact />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 lg:px-12 xl:px-14">
          <div className="lg:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2 font-semibold text-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              Unity Hub
            </Link>
          </div>

          <div className="w-full max-w-[400px] mx-auto lg:mx-0 lg:max-w-none">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
              {subtitle && (
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{subtitle}</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-6 sm:p-7">
              {children}
            </div>

            {footer && (
              <div className="mt-5 text-center lg:text-left">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
