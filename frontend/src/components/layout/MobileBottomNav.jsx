import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '../../lib/cn'
import { MOBILE_TAB_NAV } from '../../config/navigation'
import { useUIStore } from '../../store/uiStore'
import NavIcon from './NavIcon'

export default function MobileBottomNav() {
  const location = useLocation()
  const { setSidebarMobileOpen } = useUIStore()

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/[0.06] bg-surface/95 backdrop-blur-xl safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1.5 pb-2">
        {MOBILE_TAB_NAV.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-1 rounded-lg',
                active ? 'text-foreground' : 'text-muted'
              )}
            >
              <NavIcon item={item} active={active} size="xs" variant="tile" />
              <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
                {item.shortLabel}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setSidebarMobileOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-1 rounded-lg text-muted"
          aria-label="Open full menu"
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-white/[0.06]">
            <Menu className="w-3 h-3" strokeWidth={2.25} />
          </div>
          <span className="text-[10px] font-medium leading-none">Menu</span>
        </button>
      </div>
    </nav>
  )
}
