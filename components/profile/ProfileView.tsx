'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { selectConnections } from '@/stores/connectionSlice'
import { selectNote, setNote } from '@/stores/noteSlice'
import { selectRelationshipsFor, selectAllTypes } from '@/stores/relationshipSlice'
import { personKey, initials, avatarHue, formatDate } from '@/lib/data'
import type { RootState } from '@/stores/index'

export function ProfileView({ personKey: key }: { personKey: string }) {
  const connections = useSelector(selectConnections)
  const connection = connections.find((c) => personKey(c) === key)
  const savedNote = useSelector(selectNote(key))
  const relationships = useSelector(selectRelationshipsFor(key))
  const allTypes = useSelector(selectAllTypes)
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
  const rels = relationships.map((r) => {
    const otherKey = r.a === key ? r.b : r.a
    const other = connections.find((c) => personKey(c) === otherKey)
    const type = allTypes.find((t) => t.id === r.typeId)
    return { other, type, key: otherKey }
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/search" className="text-sm text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 inline-block">
        ← Back
      </Link>

      <div className="flex items-start gap-5 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
          style={{ backgroundColor: `hsl(${hue} 60% 50%)` }}
        >
          {initials(connection.name)}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{connection.name}</h1>
          {connection.title && <p className="text-gray-600 dark:text-gray-400">{connection.title}</p>}
          {connection.company && <p className="text-sm text-gray-500 dark:text-gray-500">{connection.company}</p>}
          {connection.connected && (
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
              Connected {formatDate(connection.connected)}
            </p>
          )}
        </div>
      </div>

      <section className="mb-8">
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

      {rels.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Relationships</h2>
          <ul className="space-y-2">
            {rels.map((r) => (
              <li key={r.key} className="flex items-center gap-3 text-sm">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.type?.color ?? '#6366f1' }} />
                <span className="text-gray-500 dark:text-gray-400">{r.type?.label}</span>
                {r.other ? (
                  <Link href={`/profile/${r.key}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {r.other.name}
                  </Link>
                ) : (
                  <span className="text-gray-400">{r.key}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
