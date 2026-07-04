import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  Building,
  Calendar,
  User,
  Bell,
  Mail,
} from 'lucide-react'

/** Per-route premium accent — icons, gradients, active states */
export const WORKSPACE_NAV = [
  {
    path: '/dashboard',
    label: 'Overview',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    iconGradient: 'from-indigo-500 via-violet-500 to-indigo-600',
    iconShadow: 'shadow-[0_2px_8px_rgba(99,102,241,0.25)]',
    activeBg: 'bg-indigo-500/[0.08]',
    labelGradient: 'from-indigo-200 via-violet-200 to-indigo-300',
    accent: 'indigo',
  },
  {
    path: '/feed',
    label: 'Feed',
    shortLabel: 'Feed',
    icon: MessageSquare,
    iconGradient: 'from-sky-400 via-cyan-500 to-blue-500',
    iconShadow: 'shadow-[0_2px_8px_rgba(6,182,212,0.25)]',
    activeBg: 'bg-cyan-500/[0.08]',
    labelGradient: 'from-sky-200 via-cyan-200 to-blue-300',
    accent: 'cyan',
  },
  {
    path: '/opportunities',
    label: 'Opportunities',
    shortLabel: 'Jobs',
    icon: Briefcase,
    iconGradient: 'from-emerald-400 via-green-500 to-teal-500',
    iconShadow: 'shadow-[0_2px_8px_rgba(16,185,129,0.25)]',
    activeBg: 'bg-emerald-500/[0.08]',
    labelGradient: 'from-emerald-200 via-green-200 to-teal-300',
    accent: 'emerald',
  },
  {
    path: '/businesses',
    label: 'Businesses',
    shortLabel: 'Biz',
    icon: Building,
    iconGradient: 'from-amber-400 via-orange-500 to-amber-600',
    iconShadow: 'shadow-[0_2px_8px_rgba(245,158,11,0.25)]',
    activeBg: 'bg-amber-500/[0.08]',
    labelGradient: 'from-amber-200 via-orange-200 to-amber-300',
    accent: 'amber',
  },
  {
    path: '/events',
    label: 'Events',
    shortLabel: 'Events',
    icon: Calendar,
    iconGradient: 'from-rose-400 via-pink-500 to-fuchsia-500',
    iconShadow: 'shadow-[0_2px_8px_rgba(244,63,94,0.25)]',
    activeBg: 'bg-rose-500/[0.08]',
    labelGradient: 'from-rose-200 via-pink-200 to-fuchsia-300',
    accent: 'rose',
  },
  {
    path: '/opportunities/messages',
    label: 'Messages',
    shortLabel: 'Chat',
    icon: Mail,
    iconGradient: 'from-emerald-400 via-green-500 to-teal-500',
    iconShadow: 'shadow-[0_2px_8px_rgba(16,185,129,0.25)]',
    activeBg: 'bg-emerald-500/[0.08]',
    labelGradient: 'from-emerald-200 via-green-200 to-teal-300',
    accent: 'emerald',
  },
  {
    path: '/notifications',
    label: 'Notifications',
    shortLabel: 'Alerts',
    icon: Bell,
    iconGradient: 'from-yellow-400 via-amber-500 to-orange-500',
    iconShadow: 'shadow-[0_2px_8px_rgba(245,158,11,0.2)]',
    activeBg: 'bg-amber-500/[0.08]',
    labelGradient: 'from-yellow-200 via-amber-200 to-orange-300',
    accent: 'amber',
  },
  {
    path: '/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: User,
    iconGradient: 'from-fuchsia-400 via-purple-500 to-violet-600',
    iconShadow: 'shadow-[0_2px_8px_rgba(168,85,247,0.25)]',
    activeBg: 'bg-fuchsia-500/[0.08]',
    labelGradient: 'from-fuchsia-200 via-purple-200 to-violet-300',
    accent: 'fuchsia',
  },
]

export const MOBILE_TAB_NAV = WORKSPACE_NAV.filter((item) =>
  ['/dashboard', '/feed', '/opportunities', '/opportunities/messages', '/events', '/profile'].includes(item.path)
)

export function getNavItem(pathname) {
  return (
    WORKSPACE_NAV.find((item) => item.path === pathname) ||
    WORKSPACE_NAV.find(
      (item) => item.path !== '/dashboard' && pathname.startsWith(item.path)
    ) ||
    WORKSPACE_NAV[0]
  )
}

export const PAGE_ACCENTS = {
  '/dashboard': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(99,102,241,0.18),transparent_55%)]',
    eyebrow: 'text-indigo-400',
    titleGradient: 'from-white via-indigo-100 to-violet-200',
  },
  '/feed/create': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.2),transparent_55%)]',
    eyebrow: 'text-cyan-400',
    titleGradient: 'from-white via-cyan-100 to-teal-200',
  },
  '/feed': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_80%_-10%,rgba(6,182,212,0.15),transparent_55%)]',
    eyebrow: 'text-cyan-400',
    titleGradient: 'from-white via-cyan-100 to-sky-200',
  },
  '/opportunities': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.15),transparent_55%)]',
    eyebrow: 'text-emerald-400',
    titleGradient: 'from-emerald-300 via-teal-300 to-cyan-400',
  },
  '/businesses': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_30%_-10%,rgba(245,158,11,0.14),transparent_55%)]',
    eyebrow: 'text-amber-400',
    titleGradient: 'from-white via-amber-100 to-orange-200',
  },
  '/events': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_70%_-10%,rgba(244,63,94,0.14),transparent_55%)]',
    eyebrow: 'text-rose-400',
    titleGradient: 'from-white via-rose-100 to-pink-200',
  },
  '/opportunities/messages': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(16,185,129,0.15),transparent_55%)]',
    eyebrow: 'text-emerald-400',
    titleGradient: 'from-emerald-300 via-teal-300 to-cyan-400',
  },
  '/notifications': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(251,191,36,0.12),transparent_55%)]',
    eyebrow: 'text-amber-400',
    titleGradient: 'from-white via-amber-100 to-yellow-200',
  },
  '/profile': {
    ambient: 'bg-[radial-gradient(ellipse_80%_50%_at_40%_-10%,rgba(168,85,247,0.15),transparent_55%)]',
    eyebrow: 'text-fuchsia-400',
    titleGradient: 'from-white via-fuchsia-100 to-purple-200',
  },
}

export function getPageAccent(pathname) {
  if (PAGE_ACCENTS[pathname]) return PAGE_ACCENTS[pathname]
  const match = Object.keys(PAGE_ACCENTS).find(
    (p) => p !== '/dashboard' && pathname.startsWith(p)
  )
  return match ? PAGE_ACCENTS[match] : PAGE_ACCENTS['/dashboard']
}
