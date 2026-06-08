'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { AdminTable } from '@/components/admin/AdminTable'
import type { UserSnapshot } from '@/lib/types'

interface LiveState {
  connections: unknown[]
  favorites: string[]
  archives: string[]
  relationships: unknown[]
  customTypes: unknown[]
  notes: Record<string, string>
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [liveState, setLiveState] = useState<LiveState | null>(null)
  const [snapshots, setSnapshots] = useState<UserSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function loadData() {
    const [stateRes, snapshotRes] = await Promise.all([
      fetch(`/api/admin/users/${userId}`),
      fetch(`/api/admin/users/${userId}/snapshots`),
    ])
    if (stateRes.ok) setLiveState(await stateRes.json())
    if (snapshotRes.ok) {
      const data = await snapshotRes.json()
      setSnapshots(data.snapshots ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [userId])

  async function handleRestore(snapshotId: number) {
    if (!confirm('Restore this user to the selected snapshot? Their current data will be replaced.')) return
    setRestoring(snapshotId)
    setMessage(null)
    const res = await fetch(`/api/admin/users/${userId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId }),
    })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Account restored successfully.' })
      await loadData()
    } else {
      setMessage({ type: 'error', text: 'Restore failed. Please try again.' })
    }
    setRestoring(null)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">
            ← All Users
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">User #{userId}</h1>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}

        {loading && <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>}

        {!loading && liveState && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3">Live State</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Connections', value: liveState.connections.length },
                { label: 'Relationships', value: liveState.relationships.length },
                { label: 'Notes', value: Object.keys(liveState.notes).length },
                { label: 'Favorites', value: liveState.favorites.length },
                { label: 'Archived', value: liveState.archives.length },
                { label: 'Custom Types', value: liveState.customTypes.length },
              ].map(stat => (
                <div key={stat.label} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              Snapshot History ({snapshots.length} saved)
            </h2>
            {snapshots.length === 0 ? (
              <p className="text-sm text-neutral-400">No snapshots yet. Snapshots are captured automatically when the user saves data.</p>
            ) : (
              <AdminTable
                keyField="id"
                columns={[
                  {
                    key: 'createdAt',
                    label: 'Saved At',
                    render: row => new Date((row.createdAt as number) * 1000).toLocaleString(),
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: row => (
                      <div className="flex items-center gap-4">
                        <a
                          href={`/admin/users/${userId}/snapshots/${row.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:underline"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleRestore(row.id as number)}
                          disabled={restoring === (row.id as number)}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {restoring === (row.id as number) ? 'Restoring…' : 'Restore to this snapshot'}
                        </button>
                      </div>
                    ),
                  },
                ]}
                rows={snapshots as unknown as Record<string, unknown>[]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
