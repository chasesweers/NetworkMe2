'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { selectTheme, setTheme } from '@/stores/uiSlice'
import { selectConnections } from '@/stores/connectionSlice'

const TABS = [
  { href: '/import', label: 'Import' },
  { href: '/search', label: 'Search' },
  { href: '/graph', label: 'Graph' },
]

const THEMES = ['system', 'light', 'dark'] as const

export function Nav() {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const theme = useSelector(selectTheme)
  const count = useSelector(selectConnections).length

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
          NetworkMe
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {count > 0 ? `${count} connections` : ''}
        </span>

        <select
          value={theme}
          onChange={(e) => dispatch(setTheme(e.target.value as typeof theme))}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          aria-label="Theme"
        >
          {THEMES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </nav>
  )
}
