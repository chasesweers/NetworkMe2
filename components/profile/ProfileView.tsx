'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { selectConnections, selectIsFavorite, toggleFavorite } from '@/stores/connectionSlice'
import { selectNote, setNote } from '@/stores/noteSlice'
import { personKey, initials, avatarHue, formatDate } from '@/lib/data'
import { RelationshipManager } from './RelationshipManager'

export function ProfileView({ personKey: key, from = '/search' }: { personKey: string; from?: string }) {
  const connections = useSelector(selectConnections)
  const connection = connections.find((c) => personKey(c) === key)
  const savedNote = useSelector(selectNote(key))
  const isFavorite = useSelector(selectIsFavorite(key))
  const dispatch = useDispatch()

  const [note, setNoteLocal] = useState(savedNote)
  const [saved, setSaved] = useState(false)

  function save() {
    dispatch(setNote({ key, text: note }))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  if (!connection) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Connection not found.</p>
        <Link href="/search" className="text-indigo-600 hover:underline text-sm">← Back to search</Link>
      </div>
    )
  }

  const hue = avatarHue(key)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <Link href={from} className="text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 inline-block">
        ← Back
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
        >
          {initials(connection.name)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{connection.name}</h1>
            <button
              onClick={() => dispatch(toggleFavorite(key))}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`transition-colors ${
                isFavorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-gray-300 hover:text-amber-400 dark:text-gray-600 dark:hover:text-amber-400'
              }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          </div>
          {connection.title && <p className="text-gray-600 dark:text-gray-400">{connection.title}</p>}
          {connection.company && <p className="text-sm text-gray-500 dark:text-gray-500">{connection.company}</p>}
          {connection.connected && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Connected {formatDate(connection.connected)}
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</h2>
        <textarea
          value={note}
          onChange={(e) => setNoteLocal(e.target.value)}
          placeholder="Add a private note…"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs transition-opacity ${saved ? 'text-emerald-500 opacity-100' : 'opacity-0'}`}>
            Saved
          </span>
          <button
            onClick={save}
            className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Save note
          </button>
        </div>
      </section>

      {/* Relationships */}
      <RelationshipManager currentKey={key} />
    </div>
  )
}
