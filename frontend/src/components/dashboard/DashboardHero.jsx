import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Sparkles, MapPin, Clock, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useLocalContext } from '../../context/LocalContext'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const nameVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 },
  },
}

export default function DashboardHero({ firstName, className }) {
  const today = format(new Date(), 'EEEE, MMMM d')
  const { placeLabel, formattedTime, formattedTimeShort, weather, loading, locationDenied } = useLocalContext()
  const WeatherIcon = weather?.Icon

  const infoPillClass =
    'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-border/60 bg-surface/70 text-foreground/85 backdrop-blur-sm'

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      {/* Ambient orbs */}
      <motion.div
        aria-hidden
        className="absolute -top-8 -left-6 w-32 h-32 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute top-4 right-0 w-24 h-24 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none"
        animate={{ opacity: [0.25, 0.45, 0.25], x: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <motion.div variants={container} initial="hidden" animate="show" className="relative space-y-5 sm:space-y-6">
        {/* Date pill */}
        <motion.div variants={fadeUp} className="flex items-center gap-2.5">
          <span className="hero-date-pill inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm sm:text-base font-semibold tracking-wide border border-indigo-500/25 bg-indigo-500/10 shadow-[0_0_24px_rgba(99,102,241,0.12)]">
            <motion.span
              className="relative flex h-2.5 w-2.5"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400" />
            </motion.span>
            <span className="hero-date-text bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-violet-200 to-cyan-300">
              {today}
            </span>
          </span>
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45, duration: 0.4 }}
            className="hidden sm:inline-flex"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400/80" strokeWidth={2} />
          </motion.span>
        </motion.div>

        {/* Location, time & weather */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {(placeLabel || loading || locationDenied) && (
            <span className={infoPillClass}>
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" strokeWidth={2} />
              {loading && !placeLabel ? (
                <span className="text-muted">Detecting location…</span>
              ) : locationDenied && !placeLabel ? (
                <span className="text-muted">Location unavailable</span>
              ) : (
                <span className="truncate max-w-[200px] sm:max-w-none">{placeLabel}</span>
              )}
            </span>
          )}

          <span className={cn(infoPillClass, 'tabular-nums')}>
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" strokeWidth={2} />
            <span className="hidden sm:inline">{formattedTime}</span>
            <span className="sm:hidden">{formattedTimeShort}</span>
          </span>

          {(loading || weather) && (
            <span className={infoPillClass}>
              {loading && !weather ? (
                <>
                  <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0" />
                  <span className="text-muted">Loading weather…</span>
                </>
              ) : weather ? (
                <>
                  {WeatherIcon && (
                    <WeatherIcon className="w-4 h-4 text-amber-300 shrink-0" strokeWidth={2} />
                  )}
                  <span className="tabular-nums">{weather.temperature}°C</span>
                  <span className="text-muted hidden sm:inline">· {weather.label}</span>
                </>
              ) : null}
            </span>
          )}
        </motion.div>

        {/* Headline */}
        <motion.div variants={fadeUp} className="space-y-2">
          <h1 className="text-[2rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight">
            <motion.span
              className="inline-block text-foreground/90"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Welcome back,
            </motion.span>
            <br className="sm:hidden" />
            <motion.span
              initial="hidden"
              animate="show"
              variants={nameVariants}
              className="hero-name-shimmer inline-block sm:ml-2 mt-0.5 sm:mt-0 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-[length:200%_auto]"
            >
              {firstName}
            </motion.span>
          </h1>
          <motion.div
            className="h-0.5 w-20 sm:w-32 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0 }}
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg leading-relaxed max-w-2xl text-foreground/75"
        >
          <span>
            Your workspace for{' '}
          </span>
          <motion.span
            className="text-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            community growth
          </motion.span>
          <span>, </span>
          <motion.span
            className="hero-accent-emerald font-semibold bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 to-teal-300"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.45 }}
          >
            opportunities
          </motion.span>
          <span>, and </span>
          <motion.span
            className="hero-accent-rose font-semibold bg-clip-text text-transparent bg-gradient-to-r from-rose-300 to-pink-300"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.45 }}
          >
            events
          </motion.span>
          <span> across </span>
          <motion.span
            className="inline-flex items-center gap-1 font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-yellow-300 to-red-400"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
          >
            Cameroon
          </motion.span>
          <span>.</span>
        </motion.p>
      </motion.div>
    </div>
  )
}
