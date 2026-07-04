import { Bookmark, Filter, Sparkles, RotateCcw, ChevronDown, Briefcase, Inbox, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  OPPORTUNITY_TYPES, WORK_MODES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS,
} from '../../constants/opportunities';
import { cn } from '../../lib/cn';

const selectClass =
  'w-full h-10 px-3 rounded-lg bg-background/50 border border-border/70 text-foreground text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 [color-scheme:dark]';

const EMPTY_FILTERS = {
  search: '',
  type: '',
  location: '',
  workMode: '',
  employmentType: '',
  experienceLevel: '',
};

export default function OpportunityFiltersSidebar({
  filters,
  onChange,
  savedCount = 0,
  unreadMessageCount = 0,
  recommended = [],
  className,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const set = (key, value) => onChange({ ...filters, [key]: value });

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && v
  ).length + (filters.search ? 1 : 0);

  const clearAll = () => onChange({ ...EMPTY_FILTERS });

  const panel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-surface/30 backdrop-blur-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="w-4 h-4 text-emerald-400" /> Refine search
          </div>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[11px] text-muted hover:text-emerald-400 inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <FilterField label="Type">
          <select className={selectClass} value={filters.type} onChange={(e) => set('type', e.target.value)}>
            <option value="" className="bg-surface">All types</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Work mode">
          <select className={selectClass} value={filters.workMode} onChange={(e) => set('workMode', e.target.value)}>
            {WORK_MODES.map((m) => (
              <option key={m.value} value={m.value} className="bg-surface">{m.label}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Employment">
          <select className={selectClass} value={filters.employmentType} onChange={(e) => set('employmentType', e.target.value)}>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-surface">{t.label}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Experience">
          <select className={selectClass} value={filters.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value)}>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l.value} value={l.value} className="bg-surface">{l.label}</option>
            ))}
          </select>
        </FilterField>

        <FilterField label="Location">
          <input
            className={selectClass}
            placeholder="City or country"
            value={filters.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </FilterField>
      </div>

      <div className="rounded-xl border border-border/60 bg-surface/30 backdrop-blur-sm p-4 space-y-3">
        <Link to="/opportunities/messages" className="flex items-center justify-between group">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">
            <MessageSquare className="w-4 h-4" /> Messages
          </span>
          {unreadMessageCount > 0 && (
            <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full">
              {unreadMessageCount}
            </span>
          )}
        </Link>
        <Link to="/opportunities/saved" className="flex items-center justify-between group">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">
            <Bookmark className="w-4 h-4" /> Saved
          </span>
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {savedCount}
          </span>
        </Link>
        <Link to="/opportunities/applications" className="block text-sm text-muted hover:text-emerald-400 transition-colors">
          My applications →
        </Link>
        <Link to="/opportunities/mine" className="flex items-center gap-2 text-sm text-muted hover:text-emerald-400 transition-colors mt-2">
          <Briefcase className="w-4 h-4" /> My opportunities →
        </Link>
        <Link to="/opportunities/applications/received" className="flex items-center gap-2 text-sm text-muted hover:text-emerald-400 transition-colors mt-2">
          <Inbox className="w-4 h-4" /> Received applications →
        </Link>
      </div>

      <div className="rounded-xl border border-border/60 bg-surface/30 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Sparkles className="w-4 h-4 text-teal-400" /> For you
        </div>
        {recommended.length > 0 ? (
          <ul className="space-y-3">
            {recommended.slice(0, 4).map((opp) => (
              <li key={opp.id}>
                <Link to={`/opportunities/${opp.id}`} className="text-sm text-muted hover:text-emerald-400 line-clamp-2 transition-colors">
                  {opp.title}
                </Link>
                <p className="text-[11px] text-subtle mt-0.5">{opp.company}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-subtle leading-relaxed">
            Complete your profile skills to get personalised recommendations from live listings.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className={cn('xl:hidden mb-4', className)}>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between rounded-xl border border-border/60 bg-surface/30 px-4 py-3 text-sm font-medium text-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            Filters {activeCount > 0 && `(${activeCount})`}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-muted transition-transform', mobileOpen && 'rotate-180')} />
        </button>
        {mobileOpen && <div className="mt-3">{panel}</div>}
      </div>

      {/* Desktop sidebar */}
      <aside className={cn('hidden xl:block xl:sticky xl:top-24 space-y-0', className)}>
        {panel}
      </aside>
    </>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-subtle uppercase tracking-wider">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export { EMPTY_FILTERS };
