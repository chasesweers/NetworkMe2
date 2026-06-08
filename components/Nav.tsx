'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { selectTheme, setTheme, selectIsGuest, setGuest } from '@/stores/uiSlice'
import { selectConnections, clearConnections } from '@/stores/connectionSlice'
import { selectAuthUser, signOut } from '@/stores/authSlice'
import { selectFollowUps } from '@/stores/followUpSlice'

const TABS = [
  { href: '/import', label: 'Import' },
  { href: '/search', label: 'Search' },
  { href: '/graph', label: 'Graph' },
  { href: '/reminders', label: 'Reminders' },
]

const THEMES = ['system', 'light', 'dark'] as const

export function Nav() {
  const pathname = usePathname()
  const dispatch = useDispatch()
  const theme = useSelector(selectTheme)
  const count = useSelector(selectConnections).length
  const user = useSelector(selectAuthUser)
  const isGuest = useSelector(selectIsGuest)
  const followUps = useSelector(selectFollowUps)
  const today = new Date().toISOString().slice(0, 10)
  const overdueCount = Object.values(followUps).filter(f => f.dueAt < today).length
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    dispatch(signOut())
    dispatch(clearConnections())
    dispatch(setGuest(false))
    fetch('/api/auth/guest', { method: 'DELETE' })
    router.push('/login')
  }

  const showTabs = user !== null || isGuest

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
          NetworkMe
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {showTabs && TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {label}
              {href === '/reminders' && overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
                  {overdueCount}
                </span>
              )}
            </Link>
          ))}
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {count > 0 ? `${count} connections` : ''}
        </span>

        {user && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {user.display_name ?? user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}

        {!user && isGuest && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400 dark:text-gray-500">Guest</span>
            <Link
              href="/login"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign in
            </Link>
          </div>
        )}

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
