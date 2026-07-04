import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { normalizeOpportunity } from '../utils/opportunity';
import OpportunityHero from '../components/opportunities/OpportunityHero';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import OpportunityFiltersSidebar, { EMPTY_FILTERS } from '../components/opportunities/OpportunityFiltersSidebar';
import Button from '../components/ui/Button';

function filtersFromParams(params) {
  return {
    search: params.get('search') || '',
    type: params.get('type') || '',
    location: params.get('location') || '',
    workMode: params.get('workMode') || '',
    employmentType: params.get('employmentType') || '',
    experienceLevel: params.get('experienceLevel') || '',
  };
}

function paramsFromFilters(filters, page) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  if (page > 1) params.set('page', String(page));
  return params;
}

export default function Opportunities({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [opportunities, setOpportunities] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [hubStats, setHubStats] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(() => Math.max(1, parseInt(searchParams.get('page') || '1', 10)));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [searchDraft, setSearchDraft] = useState(() => filtersFromParams(searchParams).search);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters]
  );

  const updateFilters = useCallback((next) => {
    setFilters(next);
    setSearchDraft(next.search);
    setPage(1);
    setSearchParams(paramsFromFilters(next, 1), { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const fromUrl = filtersFromParams(searchParams);
    setFilters(fromUrl);
    setSearchDraft(fromUrl.search);
    setPage(Math.max(1, parseInt(searchParams.get('page') || '1', 10)));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchDraft) return prev;
        const next = { ...prev, search: searchDraft };
        setPage(1);
        setSearchParams(paramsFromFilters(next, 1), { replace: true });
        return next;
      });
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft, setSearchParams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [listRes, recRes, statsRes, myAppsRes] = await Promise.all([
        api.get('/opportunities', { params: { ...filters, page, limit: 12 } }),
        api.get('/opportunities/recommended').catch(() => ({ data: { opportunities: [] } })),
        api.get('/opportunities/hub/stats').catch(() => ({ data: { stats: null } })),
        token ? api.get('/opportunities/applications/me').catch(() => ({ data: { applications: [] } })) : Promise.resolve({ data: { applications: [] } }),
      ]);

      const appByOpp = {};
      (myAppsRes.data.applications || []).forEach((a) => {
        if (a.status !== 'withdrawn') appByOpp[a.opportunityId] = a;
      });

      const enrich = (opp) => {
        const normalized = normalizeOpportunity(opp, user);
        const app = appByOpp[opp.id];
        if (app) {
          normalized.hasApplied = true;
          normalized.userApplication = app;
        }
        return normalized;
      };

      setOpportunities((listRes.data.opportunities || []).map(enrich));
      setTotalPages(listRes.data.pagination?.pages || 1);
      setTotal(listRes.data.pagination?.total || 0);
      setRecommended((recRes.data.opportunities || []).map((o) => normalizeOpportunity(o, user)));
      setHubStats(statsRes.data.stats);

      if (token) {
        const savedRes = await api.get('/opportunities/saved/list').catch(() => ({ data: { opportunities: [] } }));
        setSavedCount(savedRes.data.opportunities?.length || 0);
      }
    } catch {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  }, [filters, page, user]);

  useEffect(() => {
    const t = setTimeout(fetchData, 250);
    return () => clearTimeout(t);
  }, [fetchData]);

  const goToPage = (nextPage) => {
    setPage(nextPage);
    setSearchParams(paramsFromFilters(filters, nextPage), { replace: true });
  };

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api.get('/messages/unread-count')
        .then((res) => setUnreadMessageCount(res.data.count))
        .catch(() => {});
    }
  }, []);

  const handleSave = async (opp) => {
    if (!localStorage.getItem('token')) {
      toast.error('Log in to save opportunities');
      return;
    }
    try {
      const res = await api.post(`/opportunities/${opp.id}/save`);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, isSaved: res.data.isSaved } : o))
      );
      setSavedCount((c) => (res.data.isSaved ? c + 1 : Math.max(0, c - 1)));
      toast.success(res.data.isSaved ? 'Saved' : 'Removed from saved');
    } catch {
      toast.error('Could not update bookmark');
    }
  };

  const handleShare = async (opp) => {
    const url = `${window.location.origin}/opportunities/${opp.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: opp.title, text: opp.company, url });
        return;
      } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  return (
    <div className="dashboard-page max-w-6xl">
      <OpportunityHero
        search={searchDraft}
        onSearchChange={setSearchDraft}
        onTrendingClick={(term) => updateFilters({ ...filters, search: term })}
        onTypeClick={(type) => updateFilters({ ...filters, type })}
        activeType={filters.type}
        stats={hubStats}
      />

      <OpportunityFiltersSidebar
        filters={filters}
        onChange={updateFilters}
        savedCount={savedCount}
        unreadMessageCount={unreadMessageCount}
        recommended={recommended}
        className="xl:hidden"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-6 xl:gap-8 items-start">
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              {loading ? 'Loading…' : (
                <>
                  <span className="text-foreground font-medium">{total}</span>
                  {total === 1 ? ' opportunity' : ' opportunities'}
                  {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-border/50 bg-surface/20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
              <p className="text-sm text-muted">Fetching live listings…</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border/60 bg-surface/20">
              <Briefcase className="w-12 h-12 text-subtle mx-auto mb-3 opacity-40" />
              <p className="text-foreground font-medium">No opportunities match your filters</p>
              <p className="text-sm text-muted mt-1 max-w-sm mx-auto">
                Try clearing filters or be the first to post an opportunity for the community.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Button variant="secondary" onClick={() => updateFilters({ ...EMPTY_FILTERS })}>
                  Clear filters
                </Button>
                <Link to="/opportunities/post">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 border-0">Post opportunity</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {opportunities.map((opp, i) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    index={i}
                    user={user}
                    onSave={handleSave}
                    onShare={handleShare}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-8">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted tabular-nums">{page} / {totalPages}</span>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <OpportunityFiltersSidebar
          filters={filters}
          onChange={updateFilters}
          savedCount={savedCount}
          unreadMessageCount={unreadMessageCount}
          recommended={recommended}
          className="hidden xl:block"
        />
      </div>
    </div>
  );
}
