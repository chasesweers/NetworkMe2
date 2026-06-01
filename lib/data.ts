import type { Connection } from './types'

export function personKey(c: Pick<Connection, 'name' | 'company'>): string {
  return `${c.name}__${c.company}`.toLowerCase().replace(/[^a-z0-9_]/g, '_')
}

export function noteKey(c: Pick<Connection, 'name' | 'company'>): string {
  return `note__${personKey(c)}`
}

export function canonPair(a: string, b: string): [string, string] {
  return a <= b ? [a, b] : [b, a]
}

function parseDateSafe(dateStr: string): Date | null {
  if (!dateStr) return null
  // Append T00:00:00 to ISO-style dates to force local-time parsing
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseDateSafe(dateStr)
  if (!d) return dateStr
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function getYear(dateStr: string): string {
  if (!dateStr) return ''
  const d = parseDateSafe(dateStr)
  return d ? String(d.getFullYear()) : ''
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

/** Deterministic 0–359 hue from a string */
export function avatarHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

export function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): Connection[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Find the header row (LinkedIn exports sometimes have preamble rows)
  let headerIdx = lines.findIndex((l) =>
    l.toLowerCase().includes('first name') || l.toLowerCase().includes('firstname')
  )
  if (headerIdx === -1) headerIdx = 0

  const headers = splitCSVLine(lines[headerIdx]).map((h) => h.toLowerCase())

  const col = (row: string[], candidates: string[]): string => {
    for (const c of candidates) {
      const idx = headers.indexOf(c)
      if (idx !== -1 && row[idx]) return row[idx]
    }
    return ''
  }

  const connections: Connection[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i])
    const firstName = col(row, ['first name', 'firstname'])
    const lastName = col(row, ['last name', 'lastname'])
    const name = [firstName, lastName].filter(Boolean).join(' ')
    if (!name) continue

    connections.push({
      name,
      title: col(row, ['position', 'title', 'job title']),
      company: col(row, ['company', 'organization']),
      connected: col(row, ['connected on', 'connected', 'date connected']),
      url: col(row, ['url', 'profile url', 'linkedin url']),
      email: col(row, ['email address', 'email']),
    })
  }
  return connections
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

export const DEMO_CONNECTIONS: Connection[] = [
  { name: 'Alex Rivera', title: 'Software Engineer', company: 'Acme Corp', connected: '2023-01-15', url: '', email: '' },
  { name: 'Jordan Lee', title: 'Product Manager', company: 'Startup Inc', connected: '2022-11-03', url: '', email: '' },
  { name: 'Morgan Chen', title: 'Designer', company: 'Creative Studio', connected: '2023-03-22', url: '', email: '' },
  { name: 'Taylor Kim', title: 'Data Scientist', company: 'Analytics Co', connected: '2021-07-10', url: '', email: '' },
  { name: 'Casey Park', title: 'Marketing Lead', company: 'Growth Agency', connected: '2023-05-01', url: '', email: '' },
  { name: 'Riley Johnson', title: 'Engineering Manager', company: 'Acme Corp', connected: '2022-04-18', url: '', email: '' },
  { name: 'Sam Torres', title: 'Sales Executive', company: 'SalesForce Co', connected: '2023-08-30', url: '', email: '' },
  { name: 'Drew Williams', title: 'CTO', company: 'Startup Inc', connected: '2021-12-01', url: '', email: '' },
]
