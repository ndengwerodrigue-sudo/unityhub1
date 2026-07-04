import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  MessageSquare, Inbox, Loader2, Search, Archive, ArchiveRestore,
  Trash2, X,
} from 'lucide-react';
import api from '../api/axios';
import PageHeading from '../components/layout/PageHeading';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/cn';
import Avatar from '../components/ui/Avatar';
import ChatInterface from '../components/opportunities/ChatInterface';

const STATUS_FILTERS = [
  { value: '', label: 'Inbox' },
  { value: 'archived', label: 'Archived' },
];

export default function OpportunityMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(searchParams.get('c') || null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showMobileList, setShowMobileList] = useState(!searchParams.get('c'));

  const currentUserId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.id || u?._id || null;
    } catch { return null; }
  })();

  const fetchConversations = useCallback(async (term = search, status = statusFilter) => {
    try {
      const params = {};
      if (term?.trim()) params.search = term.trim();
      if (status) params.status = status;
      const [convRes, unreadRes] = await Promise.all([
        api.get('/conversations', { params }),
        api.get('/messages/unread-count'),
      ]);
      setConversations(convRes.data.conversations || []);
      setUnreadCount(unreadRes.data.count || 0);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const convFromUrl = searchParams.get('c');
    if (convFromUrl) {
      setActiveConvId(convFromUrl);
      setShowMobileList(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchConversations(search, statusFilter), 350);
    return () => clearTimeout(t);
  }, [search, statusFilter, fetchConversations]);

  const selectConversation = (convId) => {
    setActiveConvId(convId);
    setShowMobileList(false);
    setSearchParams(convId ? { c: convId } : {}, { replace: true });
  };

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setLoading(true);
    fetchConversations(search, status);
  };

  const handleArchive = async (convId, currentlyArchived) => {
    try {
      if (currentlyArchived) {
        await api.patch(`/conversations/${convId}/unarchive`);
      } else {
        await api.patch(`/conversations/${convId}/archive`);
      }
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setSearchParams({}, { replace: true });
      }
      toast.success(currentlyArchived ? 'Unarchived' : 'Archived');
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (convId) => {
    if (!window.confirm('Hide this conversation from your inbox?')) return;
    try {
      await api.delete(`/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConvId === convId) {
        setActiveConvId(null);
        setSearchParams({}, { replace: true });
      }
      toast.success('Conversation hidden');
    } catch { toast.error('Failed to hide'); }
  };

  if (loading && conversations.length === 0) return <DashboardSkeleton />;

  return (
    <div className="dashboard-page max-w-6xl">
      <PageHeading
        pathname="/opportunities/messages"
        eyebrow="Messaging"
        title="Messages"
        description={unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'Your opportunity messaging center'}
      />

      <div className="flex flex-col lg:flex-row rounded-2xl border border-border/60 bg-surface/25 overflow-hidden min-h-[min(75vh,700px)]">
        <div className={cn(
          'w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border/60 flex flex-col shrink-0',
          !showMobileList && 'hidden lg:flex'
        )}>
          <div className="px-3 py-3 border-b border-border/60 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, opportunity, message…"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-background/50 border border-border/70 text-sm text-foreground placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/30 [color-scheme:dark]"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-subtle hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => handleFilterChange(f.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    statusFilter === f.value
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'border-border/60 text-muted hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Inbox className="w-8 h-8 text-subtle mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted">
                  {search || statusFilter ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-xs text-subtle mt-1">
                  Apply to opportunities or receive applications to start messaging.
                </p>
                <Link to="/opportunities" className="inline-block mt-4 text-sm text-emerald-400 hover:underline">
                  Browse opportunities →
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConvId === conv.id;
                return (
                  <div key={conv.id} className={cn('border-b border-border/40', isActive && 'bg-emerald-500/10')}>
                    <button
                      type="button"
                      onClick={() => selectConversation(conv.id)}
                      className="w-full text-left px-4 py-3.5 hover:bg-surface/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar src={conv.otherUserAvatar} name={conv.otherUserName} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground truncate">{conv.otherUserName}</span>
                            {conv.unreadCount > 0 && (
                              <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">{conv.opportunityTitle}</p>
                          {conv.lastMessage && (
                            <p className="text-xs text-subtle truncate mt-1">
                              {String(conv.lastSenderId) === String(currentUserId) && <span className="text-emerald-400">You: </span>}
                              {conv.lastMessage}
                            </p>
                          )}
                          {conv.lastMessageAt && (
                            <p className="text-[10px] text-subtle mt-1">
                              {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex justify-end gap-0.5 px-4 pb-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleArchive(conv.id, conv.isArchived); }}
                        className="p-1 rounded text-subtle hover:text-foreground hover:bg-white/5"
                        title={conv.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        {conv.isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                        className="p-1 rounded text-subtle hover:text-rose-400 hover:bg-white/5"
                        title="Hide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className={cn('flex-1 flex flex-col min-w-0', showMobileList && 'hidden lg:flex')}>
          {!activeConvId ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-subtle mx-auto mb-3 opacity-30" />
                <p className="text-foreground font-medium">Select a conversation</p>
                <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
                  Pick a thread from the left to read and reply.
                </p>
              </div>
            </div>
          ) : (
            <ChatInterface
              conversationId={activeConvId}
              currentUserId={currentUserId}
              onBack={() => { setActiveConvId(null); setShowMobileList(true); setSearchParams({}, { replace: true }); }}
              onMessageSent={() => fetchConversations()}
            />
          )}
        </div>
      </div>
    </div>
  );
}
