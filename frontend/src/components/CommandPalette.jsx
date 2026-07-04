import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, MessageSquare, Briefcase, Building, Calendar, User, Bell, Plus, Search } from 'lucide-react'
import { useUIStore } from '../store/uiStore'
import { cn } from '../lib/cn'

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'feed', label: 'Open Feed', icon: MessageSquare, path: '/feed' },
  { id: 'post', label: 'Create Post', icon: Plus, path: '/feed/create' },
  { id: 'opportunities', label: 'Browse Opportunities', icon: Briefcase, path: '/opportunities' },
  { id: 'businesses', label: 'Business Directory', icon: Building, path: '/businesses' },
  { id: 'events', label: 'View Events', icon: Calendar, path: '/events' },
  { id: 'profile', label: 'Edit Profile', icon: User, path: '/profile' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
]

export default function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommandPaletteOpen])

  const run = (path) => {
    navigate(path)
    setCommandPaletteOpen(false)
  }

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setCommandPaletteOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -8 }} className="fixed left-1/2 top-[20%] -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-[101]">
            <div className="bg-surface border border-border rounded-2xl shadow-premium-lg overflow-hidden" role="dialog" aria-modal="true">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-subtle" />
                <span className="text-sm text-muted">Quick actions</span>
              </div>
              <ul className="py-2 max-h-72 overflow-y-auto scrollbar-thin">
                {COMMANDS.map((cmd) => {
                  const Icon = cmd.icon
                  return (
                    <li key={cmd.id}>
                      <button type="button" onClick={() => run(cmd.path)} className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-card')}>
                        <Icon className="w-4 h-4 text-primary" />
                        {cmd.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
