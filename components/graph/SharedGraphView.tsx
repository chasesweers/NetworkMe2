'use client'

import { GraphView } from '@/components/graph/GraphView'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'

interface SharedGraphViewProps {
  ownerName: string
  connections: Connection[]
  relationships: Relationship[]
  customTypes: RelationshipType[]
}

export function SharedGraphView({ ownerName, connections, relationships, customTypes }: SharedGraphViewProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950 border-b border-indigo-200 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-300">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span>Viewing <strong>{ownerName}</strong>&apos;s shared network — read only</span>
      </div>
      <div className="flex-1 min-h-0">
        <GraphView
          readOnly
          initialConnections={connections}
          initialRelationships={relationships}
          initialTypes={customTypes}
        />
      </div>
    </div>
  )
}
