import { Users, Image, Sparkles, PenSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'

export default function FeedSidebar({ user, totalLoaded }) {
  return (
    <aside className="hidden xl:block space-y-5 sticky top-20 self-start">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle accent="cyan" className="text-base">Your feed</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-subtle">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Showing <span className="text-foreground font-medium tabular-nums">{totalLoaded}</span> posts from the community database.
          </p>
        </CardContent>
      </Card>

      <Card className="p-4">
        <Link
          to="/feed/create"
          className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
        >
          <PenSquare className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Post Studio</p>
            <p className="text-xs text-muted">Create with templates &amp; preview</p>
          </div>
        </Link>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle accent="indigo" className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-xs text-muted space-y-2.5 leading-relaxed">
            <li className="flex gap-2">
              <Image className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              Click any image to view it full size on desktop.
            </li>
            <li>Use Post Studio for templates, hashtags, and live preview.</li>
            <li>Like, comment, repost, and save posts — all synced to your account.</li>
          </ul>
        </CardContent>
      </Card>
    </aside>
  )
}
