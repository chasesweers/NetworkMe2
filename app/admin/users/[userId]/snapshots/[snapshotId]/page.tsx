import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { SharedGraphView } from '@/components/graph/SharedGraphView'
import { sameCompanyPairs } from '@/lib/autoColleague'
import { personKey } from '@/lib/data'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'

interface PageProps {
  params: Promise<{ userId: string; snapshotId: string }>
}

export default async function AdminSnapshotViewPage({ params }: PageProps) {
  const { userId, snapshotId } = await params
  const jar = await cookies()
  const token = jar.get('nm_token')?.value

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000'}/api/admin/users/${userId}/snapshots/${snapshotId}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store' }
  )

  if (res.status === 404) notFound()
  if (!res.ok) {
    return (
      <div className="flex items-center justify-center h-screen text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Failed to load snapshot.</p>
      </div>
    )
  }

  const snap = await res.json() as {
    connections: (Connection & { personKey: string })[]
    favorites: string[]
    archives: string[]
    relationships: { a: string; b: string; typeId: string; createdAt: number }[]
    customTypes: { id: string; label: string; color: string }[]
    notes: Record<string, string>
    createdAt: number
  }

  const connections: Connection[] = snap.connections
    .filter(c => !snap.archives.includes(c.personKey ?? personKey(c)))
    .map(({ personKey: _pk, ...c }) => c)

  const autoColleagues = sameCompanyPairs(connections)
  const seen = new Set(snap.relationships.map(r => `${r.a}|${r.b}|${r.typeId}`))
  const relationships: Relationship[] = [
    ...snap.relationships,
    ...autoColleagues.filter(r => !seen.has(`${r.a}|${r.b}|${r.typeId}`)).map(r => ({ ...r, createdAt: 0 })),
  ]

  const customTypes: RelationshipType[] = snap.customTypes.map(t => ({ ...t, builtin: false }))

  const date = new Date(snap.createdAt * 1000).toLocaleString()

  return (
    <SharedGraphView
      ownerName={`Admin preview — Snapshot from ${date}`}
      connections={connections}
      relationships={relationships}
      customTypes={customTypes}
    />
  )
}
