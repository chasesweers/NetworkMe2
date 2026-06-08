'use client'

import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { selectConnections } from '@/stores/connectionSlice'
import { selectFollowUps, clearFollowUp } from '@/stores/followUpSlice'
import { personKey, initials, avatarHue } from '@/lib/data'

export default function RemindersPage() {
  const connections = useSelector(selectConnections)
  const followUps = useSelector(selectFollowUps)
  const dispatch = useDispatch()
  const today = new Date().toISOString().slice(0, 10)

  const items = connections
    .filter(c => !!followUps[personKey(c)])
    .map(c => {
      const key = personKey(c)
      const fu = followUps[key]
      return { connection: c, key, dueAt: fu.dueAt, note: fu.note }
    })
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))

  const overdue = items.filter(i => i.dueAt < today)
  const upcoming = items.filter(i => i.dueAt >= today)

  function formatDue(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function ReminderRow({ item }: { item: typeof items[number] }) {
    const hue = avatarHue(item.key)
    return (
      <div className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
        >
          {initials(item.connection.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.connection.name}</p>
          {item.connection.company && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.connection.company}</p>
          )}
          {item.note && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">{item.note}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xs font-medium ${item.dueAt < today ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {formatDue(item.dueAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/profile/${encodeURIComponent(item.key)}?from=/reminders`}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View
          </Link>
          <button
            onClick={() => dispatch(clearFollowUp(item.key))}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h1>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p className="text-sm">No reminders set.</p>
          <p className="text-xs mt-1">Open a connection profile to add a follow-up date.</p>
        </div>
      )}

      {overdue.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">
            Overdue ({overdue.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4">
            {overdue.map(item => <ReminderRow key={item.key} item={item} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Upcoming ({upcoming.length})
          </h2>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-4">
            {upcoming.map(item => <ReminderRow key={item.key} item={item} />)}
          </div>
        </section>
      )}
    </div>
  )
}
