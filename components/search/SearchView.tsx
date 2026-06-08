'use client'

import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectFilteredConnections,
  selectConnections,
  selectFavorites,
  selectArchived,
  selectSearchQuery,
  selectFilters,
  setSearchQuery,
  setFilters,
  toggleFavorite,
  toggleArchive,
} from '@/stores/connectionSlice'
import { personKey, initials, avatarHue, formatDate } from '@/lib/data'

export function SearchView() {
  const dispatch = useDispatch()
  const connections = useSelector(selectFilteredConnections)
  const allConnections = useSelector(selectConnections)
  const favorites = useSelector(selectFavorites)
  const archived = useSelector(selectArchived)
  const searchQuery = useSelector(selectSearchQuery)
  const filters = useSelector(selectFilters)

  const companies = [...new Set(allConnections.map((c) => c.company))].sort()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="search"
          placeholder="Search connections…"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filters.company}
          onChange={(e) => dispatch(setFilters({ company: e.target.value }))}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
        >
          <option value="">All companies</option>
          {companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.favoritesOnly}
            onChange={(e) => dispatch(setFilters({ favoritesOnly: e.target.checked }))}
            className="rounded"
          />
          Favorites
        </label>
        <button
          onClick={() => dispatch(setFilters({ archivedOnly: !filters.archivedOnly }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-colors ${
            filters.archivedOnly
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-400'
          }`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v6m4-6v6" />
          </svg>
          {filters.archivedOnly ? 'Archived' : 'Show archived'}
          {archived.length > 0 && !filters.archivedOnly && (
            <span className="ml-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 py-0.5 leading-none">
              {archived.length}
            </span>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-600 mb-4">
        {connections.length} connection{connections.length !== 1 ? 's' : ''}
        {filters.archivedOnly ? ' archived' : ''}
      </p>

      {connections.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <p className="mb-2">{filters.archivedOnly ? 'No archived connections.' : 'No connections found.'}</p>
          {!filters.archivedOnly && (
            <Link href="/import" className="text-indigo-500 hover:underline text-sm">Import connections</Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {connections.map((c) => {
            const key = personKey(c)
            const hue = avatarHue(key)
            const isFav = favorites.includes(key)
            const isArchived = archived.includes(key)

            return (
              <li key={key} className="flex items-center gap-4 py-3 group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${isArchived ? 'opacity-50' : ''}`}
                  style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
                >
                  {initials(c.name)}
                </div>

                <Link href={`/profile/${key}`} className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${isArchived ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {c.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[c.title, c.company].filter(Boolean).join(' · ')}
                  </p>
                </Link>

                <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0 hidden sm:block">
                  {formatDate(c.connected)}
                </span>

                <button
                  onClick={() => dispatch(toggleArchive(key))}
                  aria-label={isArchived ? 'Unarchive connection' : 'Archive connection'}
                  title={isArchived ? 'Unarchive' : 'Archive'}
                  className={`transition-colors ${
                    isArchived
                      ? 'text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300'
                      : 'text-gray-300 dark:text-gray-700 hover:text-indigo-500 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isArchived ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v6m4-6v6" />
                  </svg>
                </button>

                <button
                  onClick={() => dispatch(toggleFavorite(key))}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  className="text-gray-300 dark:text-gray-700 hover:text-amber-400 transition-colors"
                >
                  {isFav ? (
                    <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
