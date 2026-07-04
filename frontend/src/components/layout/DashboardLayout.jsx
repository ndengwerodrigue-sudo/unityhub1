import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import DashboardSidebar from './DashboardSidebar'
import DashboardTopbar from './DashboardTopbar'
import MobileBottomNav from './MobileBottomNav'
import CommandPalette from '../CommandPalette'
import { useUIStore } from '../../store/uiStore'
import { getPageAccent } from '../../config/navigation'
import { cn } from '../../lib/cn'
import useBodyScrollLock from '../../hooks/useBodyScrollLock'
import { LocalContextProvider } from '../../context/LocalContext'

export const SIDEBAR_WIDTH_PX = 220

export default function DashboardLayout({ user, logout }) {
  const { sidebarMobileOpen, commandPaletteOpen } = useUIStore()
  useBodyScrollLock(sidebarMobileOpen || commandPaletteOpen)
  const location = useLocation()
  const navigate = useNavigate()
  const pageAccent = getPageAccent(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="fixed inset-0 bg-gradient-mesh pointer-events-none z-0" aria-hidden />
      <div className={cn('fixed inset-0 pointer-events-none z-0', pageAccent.ambient)} aria-hidden />

      <LocalContextProvider>
        <div className="relative z-10 min-h-screen w-full lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
          <DashboardSidebar user={user} onLogout={handleLogout} />

          <div
            className={cn(
              'min-w-0 w-full flex flex-col',
              'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0'
            )}
          >
            <DashboardTopbar user={user} />
            <main className="flex-1 w-full min-w-0">
              <Outlet context={{ user }} />
            </main>
          </div>
        </div>
      </LocalContextProvider>

      <MobileBottomNav />
      <CommandPalette />
    </div>
  )
}
