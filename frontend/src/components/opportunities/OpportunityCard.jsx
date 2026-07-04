import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, Bookmark, Share2, Users, Eye, BadgeCheck, Zap, ArrowUpRight, Settings, CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/cn';
import Button from '../ui/Button';

function CompanyLogo({ company, logo }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className="w-14 h-14 rounded-xl object-cover border border-border/80 ring-1 ring-border/40"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-primary/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
      <span className="text-xl font-bold text-emerald-400">{company?.charAt(0)?.toUpperCase() || 'O'}</span>
    </div>
  );
}

export default function OpportunityCard({
  opportunity,
  onSave,
  onShare,
  index = 0,
  showQuickApply = true,
  user = null,
}) {
  const deadline = opportunity.deadline ? new Date(opportunity.deadline) : null;
  const isOwner = opportunity.isOwner;
  const hasApplied = opportunity.hasApplied;
  const showApply = showQuickApply && !isOwner && !hasApplied;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35 }}
      className={cn(
        'group relative rounded-2xl border overflow-hidden',
        'bg-surface/30 backdrop-blur-sm border-border/70',
        'hover:border-emerald-500/25 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-300',
        opportunity.isFeatured && 'ring-1 ring-emerald-500/20'
      )}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 sm:p-6">
        {opportunity.isFeatured && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" /> Featured
          </span>
        )}

        <div className="flex gap-4">
          <CompanyLogo company={opportunity.company} logo={opportunity.companyLogo} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                {opportunity.typeLabel}
              </span>
              {opportunity.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-400">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <Link
              to={`/opportunities/${opportunity.id}`}
              className="group/title flex items-start gap-1.5 hover:text-emerald-400 transition-colors"
            >
              <h3 className="text-lg font-semibold text-foreground leading-snug pr-12">{opportunity.title}</h3>
              <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5 opacity-0 group-hover/title:opacity-100 transition-opacity text-emerald-400" />
            </Link>
            <p className="text-sm text-muted mt-0.5">{opportunity.company}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          <MetaChip icon={MapPin}>{opportunity.location}</MetaChip>
          <MetaChip>{opportunity.workModeLabel}</MetaChip>
          {opportunity.employmentType && (
            <MetaChip className="capitalize">{opportunity.employmentType.replace('-', ' ')}</MetaChip>
          )}
          {opportunity.salaryLabel && (
            <MetaChip className="text-emerald-400 border-emerald-500/20 bg-emerald-500/10">{opportunity.salaryLabel}</MetaChip>
          )}
          {deadline && (
            <MetaChip icon={Clock}>{deadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</MetaChip>
          )}
        </div>

        <p className="text-sm text-muted/90 mt-3 line-clamp-2 leading-relaxed">{opportunity.description}</p>

        {opportunity.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {opportunity.skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="text-[10px] font-medium text-subtle bg-background/50 border border-border/50 px-2 py-0.5 rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-[11px] text-subtle">
          <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{opportunity.applicationCount} applicants</span>
          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{opportunity.viewCount} views</span>
          {opportunity.createdAt && (
            <span>{formatDistanceToNow(new Date(opportunity.createdAt), { addSuffix: true })}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-border/50">
          {isOwner ? (
            <>
              <Link to={`/opportunities/applications/received?opportunityId=${opportunity.id}`} className="flex-1 sm:flex-none min-w-[120px]">
                <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 border-0 gap-1">
                  <Settings className="w-3.5 h-3.5" />
                  Manage ({opportunity.applicationCount})
                </Button>
              </Link>
              <Link to={`/opportunities/${opportunity.id}/edit`}>
                <Button variant="secondary" size="sm">Edit</Button>
              </Link>
            </>
          ) : hasApplied ? (
            <Link to={`/opportunities/applications/${opportunity.userApplication?.id || ''}`} className="flex-1 sm:flex-none min-w-[120px]">
              <Button size="sm" variant="secondary" className="w-full gap-1" disabled={!opportunity.userApplication?.id}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Applied
              </Button>
            </Link>
          ) : showApply ? (
            <Link to={`/opportunities/${opportunity.id}/apply`} className="flex-1 sm:flex-none min-w-[120px]">
              <Button
                size="sm"
                disabled={!opportunity.isOpen}
                className="w-full bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 border-0"
              >
                {opportunity.isOpen ? 'Quick apply' : 'Closed'}
              </Button>
            </Link>
          ) : null}
          <Link to={`/opportunities/${opportunity.id}`}>
            <Button variant="secondary" size="sm">Details</Button>
          </Link>
          <div className="flex gap-1.5 ml-auto sm:ml-0">
            <IconBtn
              onClick={() => onSave?.(opportunity)}
              active={opportunity.isSaved}
              label="Save"
            >
              <Bookmark className={cn('w-4 h-4', opportunity.isSaved && 'fill-current')} />
            </IconBtn>
            <IconBtn onClick={() => onShare?.(opportunity)} label="Share">
              <Share2 className="w-4 h-4" />
            </IconBtn>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function MetaChip({ icon: Icon, children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[11px] text-muted bg-background/40 border border-border/50 rounded-md px-2 py-1',
      className
    )}>
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}

function IconBtn({ children, onClick, active, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'p-2 rounded-lg border transition-colors',
        active
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-border/60 text-muted hover:text-foreground hover:bg-surface/80'
      )}
    >
      {children}
    </button>
  );
}
