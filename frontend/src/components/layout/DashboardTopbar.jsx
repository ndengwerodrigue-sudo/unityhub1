import { Link } from 'react-router-dom'
import { Menu, Command } from 'lucide-react'
import GlobalSearch from '../GlobalSearch'
import NotificationCenter from '../NotificationCenter'
import Avatar from '../ui/Avatar'
import { useUIStore } from '../../store/uiStore'

export default function DashboardTopbar({ user }) {
  const { setSidebarMobileOpen, setCommandPaletteOpen } = useUIStore()

  return (
    <header className="sticky top-0 z-30 shrink-0 w-full border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="flex h-14 lg:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-5 lg:px-6 w-full min-w-0">
        <button
          type="button"
          className="lg:hidden flex-shrink-0 p-2 rounded-xl text-muted hover:text-foreground hover:bg-card border border-border"
          onClick={() => setSidebarMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 max-w-xl overflow-hidden">
          <GlobalSearch compact />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-subtle hover:text-foreground hover:bg-card border border-border text-xs font-medium"
          >
            <Command className="w-4 h-4" />
            <span className="hidden md:inline">Commands</span>
          </button>

          <NotificationCenter />

          <Link
            to="/profile"
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-card border border-transparent hover:border-border transition-colors"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <span className="hidden md:block text-sm font-medium text-foreground max-w-[100px] truncate">
              {user?.name?.split(' ')[0]}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
