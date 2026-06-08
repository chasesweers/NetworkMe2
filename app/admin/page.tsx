'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { AdminTable } from '@/components/admin/AdminTable'
import type { AdminUser } from '@/lib/types'

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(data.users ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load users'); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin — All Users</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {users.length} registered account{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading && <p className="text-neutral-500 dark:text-neutral-400">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <AdminTable
            keyField="id"
            columns={[
              { key: 'email', label: 'Email' },
              { key: 'displayName', label: 'Name', render: row => (row.displayName as string | null) ?? <span className="text-neutral-400">—</span> },
              {
                key: 'createdAt',
                label: 'Joined',
                render: row => new Date((row.createdAt as number) * 1000).toLocaleDateString(),
              },
              { key: 'connectionCount', label: 'Connections' },
              {
                key: 'actions',
                label: '',
                render: row => (
                  <Link
                    href={`/admin/users/${row.id}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                  >
                    View →
                  </Link>
                ),
              },
            ]}
            rows={users as unknown as Record<string, unknown>[]}
          />
        )}
      </div>
    </div>
  )
}
