import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command, ArrowRight, Clock, Hash } from 'lucide-react'
import { cn } from '../lib/cn'
import { useUIStore } from '../store/uiStore'

const SEARCH_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', category: 'Pages' },
  { label: 'Community Feed', path: '/feed', category: 'Pages' },
  { label: 'Create Post', path: '/feed/create', category: 'Pages' },
  { label: 'Opportunities', path: '/opportunities', category: 'Pages' },
  { label: 'Businesses', path: '/businesses', category: 'Pages' },
  { label: 'Events', path: '/events', category: 'Pages' },
  { label: 'Profile', path: '/profile', category: 'Pages' },
  { label: 'Notifications', path: '/notifications', category: 'Pages' },
]

export default function GlobalSearch({ compact = false, className }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const { recentSearches, addRecentSearch } = useUIStore()

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return SEARCH_ITEMS.filter((item) => item.label.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const go = (path, label) => {
    addRecentSearch(label || path)
    navigate(path)
    setQuery('')
    setOpen(false)
  }

  const showPanel = open && (query.trim() || recentSearches.length > 0)

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={compact ? 'Search...' : 'Search workspace...'}
          className={cn('input-field w-full min-w-0 pl-9 py-2 h-10 text-sm', compact ? 'pr-3' : 'pr-16')}
          aria-label="Search"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-subtle bg-background border border-border rounded-md">
          <Command className="w-3 h-3" />K
        </kbd>
      </div>

      {showPanel && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 max-w-full bg-surface border border-border rounded-xl shadow-premium-lg z-50 overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
          {query.trim() ? (
            results.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted text-center">No results</p>
            ) : (
              <ul>
                {results.map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => go(item.path, item.label)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-card text-left"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Hash className="w-4 h-4 text-subtle flex-shrink-0" />
                        <span className="truncate">
                          <span className="text-foreground font-medium">{item.label}</span>
                          <span className="text-subtle text-xs ml-2">{item.category}</span>
                        </span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-subtle flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            recentSearches.length > 0 && (
              <div className="p-1.5">
                <p className="px-2 py-1 text-[10px] font-semibold text-subtle uppercase tracking-wider">Recent</p>
                {recentSearches.map((term) => {
                  const match = SEARCH_ITEMS.find((s) => s.label === term)
                  return (
                    <button
                      key={term}
                      type="button"
                      onClick={() => go(match?.path || '/dashboard', term)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted hover:bg-card hover:text-foreground"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {term}
                    </button>
                  )
                })}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
