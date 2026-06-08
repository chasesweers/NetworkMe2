import { getDb } from '@/lib/db'
import { SharedGraphView } from '@/components/graph/SharedGraphView'
import { sameCompanyPairs } from '@/lib/autoColleague'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SharedGraphPage({ params }: PageProps) {
  const { token } = await params
  const db = getDb()

  const shareRow = db.prepare('SELECT user_id FROM shared_graphs WHERE token = ?').get(token) as { user_id: number } | undefined

  if (!shareRow) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">This link is no longer active</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">The owner may have revoked this shared graph.</p>
        </div>
      </div>
    )
  }

  const uid = shareRow.user_id

  const dbConnections = db.prepare(
    'SELECT name, title, company, connected, url, email FROM connections WHERE user_id = ?'
  ).all(uid) as Connection[]

  const manualRelationships = db.prepare(
    'SELECT a, b, type_id AS typeId, created_at AS createdAt FROM relationships WHERE user_id = ?'
  ).all(uid) as Relationship[]

  // Merge auto-colleague pairs (same logic as selectAllRelationships selector)
  const autoColleagues = sameCompanyPairs(dbConnections)
  const seen = new Set(manualRelationships.map((r) => `${r.a}|${r.b}|${r.typeId}`))
  const relationships: Relationship[] = [
    ...manualRelationships,
    ...autoColleagues
      .filter((r) => !seen.has(`${r.a}|${r.b}|${r.typeId}`))
      .map((r) => ({ ...r, createdAt: 0 })),
  ]

  const dbCustomTypes = db.prepare(
    'SELECT id, label, color FROM custom_types WHERE user_id = ?'
  ).all(uid) as (Omit<RelationshipType, 'builtin'>)[]

  const userRow = db.prepare('SELECT display_name, email FROM users WHERE id = ?').get(uid) as { display_name: string | null; email: string }

  const customTypes: RelationshipType[] = dbCustomTypes.map((t) => ({ ...t, builtin: false }))

  return (
    <SharedGraphView
      ownerName={userRow.display_name ?? userRow.email}
      connections={dbConnections}
      relationships={relationships}
      customTypes={customTypes}
    />
  )
}
