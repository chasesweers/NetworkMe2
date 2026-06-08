import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildExportCSV, buildExportJSON, downloadFile, type ExportData } from '@/lib/export'

const BASE_DATA: ExportData = {
  connections: [],
  favorites: [],
  archived: [],
  notes: {},
  followUps: {},
  relationships: [],
  customTypes: [],
}

const ALICE = { name: 'Alice Smith', title: 'Engineer', company: 'Acme', connected: '2024-01-15', url: 'https://linkedin.com/in/alice', email: 'alice@acme.com' }
const BOB   = { name: 'Bob', title: '', company: '', connected: '', url: '', email: '' }

// personKey for ALICE = "alice_smith_acme", BOB = "bob_"
const ALICE_KEY = 'alice_smith_acme'
const BOB_KEY   = 'bob_'

// ─── buildExportCSV ──────────────────────────────────────────────────────────

describe('buildExportCSV', () => {
  it('produces the correct header row', () => {
    const csv = buildExportCSV(BASE_DATA)
    const header = csv.split('\r\n')[0]
    expect(header).toBe('First Name,Last Name,Position,Company,Connected On,URL,Email Address,Favorite,Archived,Note,Follow-up Date,Follow-up Note')
  })

  it('returns only the header when connections is empty', () => {
    const csv = buildExportCSV(BASE_DATA)
    expect(csv.split('\r\n')).toHaveLength(1)
  })

  it('splits a multi-part name into first and last name columns', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    const row = csv.split('\r\n')[1]
    const cols = row.split(',')
    expect(cols[0]).toBe('Alice')
    expect(cols[1]).toBe('Smith')
  })

  it('handles a single-word name (no last name)', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [BOB] })
    const row = csv.split('\r\n')[1]
    const cols = row.split(',')
    expect(cols[0]).toBe('Bob')
    expect(cols[1]).toBe('')
  })

  it('maps all basic connection fields to the correct columns', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[2]).toBe('Engineer')
    expect(cols[3]).toBe('Acme')
    expect(cols[4]).toBe('2024-01-15')
    expect(cols[5]).toBe('https://linkedin.com/in/alice')
    expect(cols[6]).toBe('alice@acme.com')
  })

  it('marks favorite=true for favorited connections', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE], favorites: [ALICE_KEY] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[7]).toBe('true')
  })

  it('marks favorite=false for non-favorited connections', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[7]).toBe('false')
  })

  it('marks archived=true for archived connections', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE], archived: [ALICE_KEY] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[8]).toBe('true')
  })

  it('includes the note for a connection', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE], notes: { [ALICE_KEY]: 'Met at conf' } })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[9]).toBe('Met at conf')
  })

  it('leaves note blank when no note exists', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[9]).toBe('')
  })

  it('includes follow-up date and note', () => {
    const csv = buildExportCSV({
      ...BASE_DATA,
      connections: [ALICE],
      followUps: { [ALICE_KEY]: { dueAt: '2025-03-01', note: 'Check in' } },
    })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[10]).toBe('2025-03-01')
    expect(cols[11]).toBe('Check in')
  })

  it('leaves follow-up columns blank when no follow-up exists', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    const cols = csv.split('\r\n')[1].split(',')
    expect(cols[10]).toBe('')
    expect(cols[11]).toBe('')
  })

  it('produces one row per connection', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE, BOB] })
    expect(csv.split('\r\n')).toHaveLength(3) // header + 2 rows
  })

  it('uses CRLF line endings', () => {
    const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
    expect(csv).toContain('\r\n')
  })

  describe('CSV escaping', () => {
    it('quotes a field containing a comma', () => {
      const conn = { ...ALICE, title: 'VP, Engineering' }
      const csv = buildExportCSV({ ...BASE_DATA, connections: [conn] })
      expect(csv).toContain('"VP, Engineering"')
    })

    it('quotes a field containing a double-quote and escapes it', () => {
      const conn = { ...ALICE, title: 'The "Boss"' }
      const csv = buildExportCSV({ ...BASE_DATA, connections: [conn] })
      expect(csv).toContain('"The ""Boss"""')
    })

    it('quotes a field containing a newline', () => {
      const conn = { ...ALICE, title: 'Line1\nLine2' }
      const csv = buildExportCSV({ ...BASE_DATA, connections: [conn] })
      expect(csv).toContain('"Line1\nLine2"')
    })

    it('does not quote a plain field', () => {
      const csv = buildExportCSV({ ...BASE_DATA, connections: [ALICE] })
      expect(csv).not.toContain('"Alice"')
      expect(csv).not.toContain('"Engineer"')
    })
  })
})

// ─── buildExportJSON ─────────────────────────────────────────────────────────

describe('buildExportJSON', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(buildExportJSON(BASE_DATA))).not.toThrow()
  })

  it('includes version: 1', () => {
    const obj = JSON.parse(buildExportJSON(BASE_DATA))
    expect(obj.version).toBe(1)
  })

  it('includes an exportedAt ISO timestamp', () => {
    const obj = JSON.parse(buildExportJSON(BASE_DATA))
    expect(() => new Date(obj.exportedAt)).not.toThrow()
    expect(obj.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('serialises connections, favorites, archived, notes, followUps, relationships, customTypes', () => {
    const data: ExportData = {
      ...BASE_DATA,
      connections: [ALICE],
      favorites: [ALICE_KEY],
      archived: [],
      notes: { [ALICE_KEY]: 'great contact' },
      followUps: { [ALICE_KEY]: { dueAt: '2025-06-01', note: 'ping' } },
      relationships: [{ a: ALICE_KEY, b: BOB_KEY, typeId: 'friend', createdAt: 1700000000000 }],
      customTypes: [{ id: 'vip', label: 'VIP', color: '#ff0000', builtin: false }],
    }
    const obj = JSON.parse(buildExportJSON(data))
    expect(obj.connections).toHaveLength(1)
    expect(obj.favorites).toContain(ALICE_KEY)
    expect(obj.notes[ALICE_KEY]).toBe('great contact')
    expect(obj.followUps[ALICE_KEY].dueAt).toBe('2025-06-01')
    expect(obj.relationships[0].typeId).toBe('friend')
    expect(obj.customTypes[0].id).toBe('vip')
  })

  it('pretty-prints with 2-space indent', () => {
    const json = buildExportJSON(BASE_DATA)
    expect(json).toContain('  "version"')
  })
})

// ─── downloadFile ─────────────────────────────────────────────────────────────

describe('downloadFile', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(document, 'createElement')
  })

  it('creates an anchor with the correct filename and clicks it', () => {
    const click = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click } as unknown as HTMLAnchorElement)

    downloadFile('export.csv', 'a,b,c', 'text/csv')

    expect(click).toHaveBeenCalledOnce()
  })

  it('sets the download attribute to the given filename', () => {
    const anchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)

    downloadFile('myfile.json', '{}', 'application/json')

    expect(anchor.download).toBe('myfile.json')
  })

  it('revokes the object URL after clicking', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({ href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement)

    downloadFile('f.csv', '', 'text/csv')

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  })
})
