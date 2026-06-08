import type { Connection, Relationship, RelationshipType } from '@/lib/types'
import type { FollowUp } from '@/stores/followUpSlice'

export interface ExportData {
  connections: Connection[]
  favorites: string[]
  archived: string[]
  notes: Record<string, string>
  followUps: Record<string, FollowUp>
  relationships: Relationship[]
  customTypes: RelationshipType[]
}

function csvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"'
  }
  return value
}

function personKeyFromName(name: string, company: string): string {
  return (name + '_' + company).toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

export function buildExportCSV(data: ExportData): string {
  const headers = [
    'First Name', 'Last Name', 'Position', 'Company',
    'Connected On', 'URL', 'Email Address',
    'Favorite', 'Archived', 'Note', 'Follow-up Date', 'Follow-up Note',
  ]

  const rows = data.connections.map(c => {
    const key = personKeyFromName(c.name, c.company)
    const parts = c.name.trim().split(' ')
    const firstName = parts[0] ?? ''
    const lastName = parts.slice(1).join(' ')
    const fu = data.followUps[key]
    return [
      firstName,
      lastName,
      c.title,
      c.company,
      c.connected,
      c.url,
      c.email,
      data.favorites.includes(key) ? 'true' : 'false',
      data.archived.includes(key) ? 'true' : 'false',
      data.notes[key] ?? '',
      fu?.dueAt ?? '',
      fu?.note ?? '',
    ].map(csvField).join(',')
  })

  return [headers.join(','), ...rows].join('\r\n')
}

export function buildExportJSON(data: ExportData): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: 1,
      connections: data.connections,
      favorites: data.favorites,
      archived: data.archived,
      notes: data.notes,
      followUps: data.followUps,
      relationships: data.relationships,
      customTypes: data.customTypes,
    },
    null,
    2
  )
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
