import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '../../lib/cn'

const statThemes = {
  post: {
    gradient: 'from-sky-500 to-cyan-600',
    shadow: 'shadow-[0_4px_14px_rgba(6,182,212,0.3)]',
    trend: 'text-emerald-400',
  },
  opportunity: {
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-[0_4px_14px_rgba(16,185,129,0.3)]',
    trend: 'text-emerald-400',
  },
  business: {
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-[0_4px_14px_rgba(245,158,11,0.3)]',
    trend: 'text-emerald-400',
  },
  event: {
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-[0_4px_14px_rgba(244,63,94,0.3)]',
    trend: 'text-emerald-400',
  },
  default: {
    gradient: 'from-indigo-500 to-violet-600',
    shadow: 'shadow-[0_4px_14px_rgba(99,102,241,0.3)]',
    trend: 'text-emerald-400',
  },
}

export default function StatCard({ label, value, icon: Icon, trend, trendUp = true, onClick, delay = 0, type }) {
  const theme = statThemes[type] || statThemes.default

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200',
        'hover:border-border-strong hover:bg-card-hover hover:shadow-premium-hover',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="absolute inset-0 bg-gradient-subtle opacity-40 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div
          className={cn(
            'p-2.5 rounded-xl bg-gradient-to-br flex items-center justify-center',
            theme.gradient,
            theme.shadow
          )}
        >
          {Icon && <Icon className="w-5 h-5 text-white" strokeWidth={2.25} />}
        </div>
        {trend && (
          <span className={cn('inline-flex items-center text-xs font-semibold tabular-nums', theme.trend)}>
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            {trend}
          </span>
        )}
      </div>
      <p className="relative text-[11px] font-bold uppercase tracking-wider text-subtle">{label}</p>
      <p className="relative text-2xl font-bold text-foreground mt-1 tabular-nums">
        {value}
      </p>
    </motion.article>
  )
}
