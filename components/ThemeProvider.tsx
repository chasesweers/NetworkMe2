'use client'

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTheme } from '@/stores/uiSlice'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSelector(selectTheme)

  useEffect(() => {
    const root = document.documentElement
    const apply = (dark: boolean) => root.classList.toggle('dark', dark)

    if (theme === 'dark') {
      apply(true)
    } else if (theme === 'light') {
      apply(false)
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return <>{children}</>
}
