import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark } from 'lucide-react';
import api from '../api/axios';
import { normalizeOpportunity } from '../utils/opportunity';
import OpportunityCard from '../components/opportunities/OpportunityCard';
import PageHeading from '../components/layout/PageHeading';
import { Card } from '../components/ui/Card';
import { DashboardSkeleton } from '../components/ui/Skeleton';

export default function SavedOpportunities({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/opportunities/saved/list')
      .then((res) => setItems((res.data.opportunities || []).map((o) => normalizeOpportunity(o, user))))
      .catch(() => toast.error('Log in to view saved opportunities'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (opp) => {
    const res = await api.post(`/opportunities/${opp.id}/save`);
    setItems((prev) => prev.filter((o) => o.id !== opp.id || res.data.isSaved));
    toast.success('Removed from saved');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-3xl">
      <PageHeading
        pathname="/opportunities/saved"
        eyebrow="Careers"
        title="Saved opportunities"
        description="Bookmarks you've saved for later."
      />

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Bookmark className="w-12 h-12 text-subtle mx-auto mb-3 opacity-50" />
          <p className="text-foreground font-medium">Nothing saved yet</p>
          <Link to="/opportunities" className="text-sm text-primary hover:underline mt-2 inline-block">
            Explore opportunities
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((opp, i) => (
            <OpportunityCard key={opp.id} opportunity={opp} index={i} user={user} onSave={handleSave} showQuickApply />
          ))}
        </div>
      )}
    </div>
  );
}
