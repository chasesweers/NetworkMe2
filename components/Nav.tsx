'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { selectTheme, setTheme, selectIsGuest, setGuest } from '@/stores/uiSlice'
import { selectConnections, clearConnections } from '@/stores/connectionSlice'
import { selectAuthUser, signOut } from '@/stores/authSlice'
import { clearToken } from '@/lib/api'
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
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearToken()
    document.cookie = 'nm_authed=; path=/; max-age=0'
    dispatch(signOut())
    dispatch(clearConnections())
    dispatch(setGuest(false))
    fetch('/api/auth/guest', { method: 'DELETE' })
    router.push('/login')
  }

  const showTabs = user !== null || isGuest

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-40">
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
          NetworkMe
        </Link>

        {/* Desktop layout — hidden below md */}
        <div className="hidden md:flex items-center gap-6 flex-1">
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
              <Link href="/login" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
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

        {/* Mobile right side — hamburger or sign-in link */}
        <div className="flex md:hidden items-center gap-3">
          {!user && !isGuest && (
            <Link href="/login" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              Sign in
            </Link>
          )}
          {showTabs && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {menuOpen ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-4 flex flex-col gap-1">
          {showTabs && TABS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={`relative flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
              {href === '/reminders' && overdueCount > 0 && (
                <span className="ml-2 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
                  {overdueCount}
                </span>
              )}
            </Link>
          ))}

          <hr className="border-gray-100 dark:border-gray-800 my-1" />

          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
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

          {user && (
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate mr-4">
                {user.display_name ?? user.email}
              </span>
              <button
                onClick={() => { setMenuOpen(false); handleSignOut() }}
                className="text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
              >
                Sign out
              </button>
            </div>
          )}

          {!user && isGuest && (
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">Guest</span>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
