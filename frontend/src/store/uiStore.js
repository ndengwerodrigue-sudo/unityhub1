import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      sidebarMobileOpen: false,
      commandPaletteOpen: false,
      recentSearches: [],
      setSidebarMobileOpen: (open) => set({ sidebarMobileOpen: open }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      addRecentSearch: (term) =>
        set((s) => ({
          recentSearches: [term, ...s.recentSearches.filter((t) => t !== term)].slice(0, 8),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'unity-hub-ui',
      partialize: (s) => ({
        recentSearches: s.recentSearches,
      }),
    }
  )
)
