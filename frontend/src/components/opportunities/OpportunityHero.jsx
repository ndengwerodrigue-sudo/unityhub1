import { Search, Sparkles, TrendingUp, Briefcase, Users, Eye, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OPPORTUNITY_TYPES } from '../../constants/opportunities';
import Button from '../ui/Button';

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 backdrop-blur-sm">
      <Icon className="h-4 w-4 text-emerald-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[10px] text-subtle uppercase tracking-wide mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function OpportunityHero({
  search,
  onSearchChange,
  onTrendingClick,
  stats,
  onTypeClick,
  activeType = '',
}) {
  const trending = stats?.trending?.length ? stats.trending : [];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 mb-8">
      {/* Dark premium backdrop — no white */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(16,185,129,0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_0%_100%,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Unity Hub Careers
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-foreground tracking-tight leading-tight">
              Find roles, programs &amp; opportunities{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                built for you
              </span>
            </h1>
            <p className="text-muted mt-2 text-sm sm:text-base max-w-xl leading-relaxed">
              Jobs, internships, scholarships, hackathons, and grants — curated from our community database.
            </p>
          </div>

          <Link to="/opportunities/post" className="shrink-0">
            <Button className="gap-2 w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0">
              Post opportunity <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 max-w-2xl">
            <StatPill icon={Briefcase} label="Live listings" value={stats.liveCount ?? '—'} />
            <StatPill icon={Users} label="Applications" value={stats.totalApplications ?? '—'} />
            <StatPill icon={Eye} label="Total views" value={stats.totalViews ?? '—'} />
          </div>
        )}

        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, company, skills…"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-background/60 border border-border/80 text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition [color-scheme:dark]"
          />
        </div>

        {trending.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-subtle inline-flex items-center gap-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Popular:
            </span>
            {trending.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onTrendingClick(term)}
                className="text-xs font-medium text-muted hover:text-emerald-400 bg-surface/60 border border-border/60 rounded-full px-3 py-1 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onTypeClick?.('')}
            className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-lg border transition-colors ${
              !activeType
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-surface/50 border-border/60 text-muted hover:text-foreground hover:border-border'
            }`}
          >
            All
          </button>
          {OPPORTUNITY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => onTypeClick?.(t.value)}
              className={`shrink-0 text-xs font-medium px-3.5 py-2 rounded-lg border transition-colors ${
                activeType === t.value
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-surface/50 border-border/60 text-muted hover:text-foreground hover:border-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
