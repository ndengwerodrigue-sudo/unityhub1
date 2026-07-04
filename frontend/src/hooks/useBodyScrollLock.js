import { useEffect } from 'react'

/**
 * Prevents background scroll / horizontal drift while overlays are open (mobile drawer, modals).
 */
export default function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined

    const scrollY = window.scrollY
    const { style } = document.body

    style.position = 'fixed'
    style.top = `-${scrollY}px`
    style.left = '0'
    style.right = '0'
    style.width = '100%'
    style.overflow = 'hidden'

    document.documentElement.style.overflow = 'hidden'

    return () => {
      style.position = ''
      style.top = ''
      style.left = ''
      style.right = ''
      style.width = ''
      style.overflow = ''
      document.documentElement.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
