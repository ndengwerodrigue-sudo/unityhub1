import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, LogOut } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useUIStore } from '../../store/uiStore'
import { WORKSPACE_NAV } from '../../config/navigation'
import NavIcon from './NavIcon'
import Avatar from '../ui/Avatar'
import { useLocalContext } from '../../context/LocalContext'

const SIDEBAR_WIDTH = 'w-[220px]'

export default function DashboardSidebar({ user, onLogout }) {
  const location = useLocation()
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()
  const { placeLabel, loading: locationLoading } = useLocalContext()

  const handleLogout = () => {
    setSidebarMobileOpen(false)
    onLogout?.()
  }

  const NavContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full min-h-full flex-1">
      <div className="flex items-center gap-2.5 h-14 lg:h-16 px-4 border-b border-white/[0.06] shrink-0">
        <Link
          to="/dashboard"
          className="flex flex-row items-center gap-2.5 min-w-0 flex-1"
          onClick={() => setSidebarMobileOpen(false)}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-semibold text-sm text-foreground block truncate">
              Unity Hub
            </span>
            <span className="text-[10px] text-subtle">Workspace</span>
          </div>
        </Link>
        {mobile && (
          <button
            type="button"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-white/[0.06]"
            onClick={() => setSidebarMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav
        className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin px-2.5 py-4"
        aria-label="Main navigation"
      >
        <ul className="space-y-0.5">
          {WORKSPACE_NAV.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setSidebarMobileOpen(false)}
                  className={cn(
                    'group flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150',
                    active
                      ? 'bg-white/[0.07] text-foreground'
                      : 'text-muted hover:bg-white/[0.04] hover:text-foreground'
                  )}
                >
                  <NavIcon item={item} active={active} size="sm" variant="sidebar" />
                  <span className="text-[13px] font-medium truncate leading-none">
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-auto shrink-0 border-t border-white/[0.06] p-2.5 space-y-1">
        {user && (
          <Link
            to="/profile"
            onClick={() => setSidebarMobileOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted hover:text-foreground hover:bg-white/[0.04] transition-colors min-w-0"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-foreground truncate">{user?.name}</p>
              {(placeLabel || locationLoading) && (
                <p className="text-[10px] text-subtle truncate">
                  {locationLoading && !placeLabel ? 'Detecting location…' : placeLabel}
                </p>
              )}
            </div>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex flex-row items-center gap-2.5 px-2.5 py-2 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="text-[13px] font-medium">Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {sidebarMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-[100dvh] bg-surface border-r border-white/[0.06] flex flex-col lg:hidden transition-transform duration-300',
          SIDEBAR_WIDTH,
          sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent mobile />
      </aside>

      <aside
        className={cn(
          'hidden lg:flex flex-col h-full min-h-full w-full min-w-[220px] max-w-[220px] bg-surface border-r border-white/[0.06] z-30'
        )}
      >
        <NavContent />
      </aside>
    </>
  )
}
