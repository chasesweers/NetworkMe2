import type { Connection, Relationship } from './types'
import { personKey, canonPair } from './data'

/**
 * Derives automatic "colleague" relationships for every pair of connections
 * that share the same non-empty company name.
 */
export function sameCompanyPairs(connections: Connection[]): Omit<Relationship, 'createdAt'>[] {
  const byCompany = new Map<string, string[]>()

  for (const c of connections) {
    const company = c.company?.trim()
    if (!company) continue
    const key = personKey(c)
    if (!byCompany.has(company)) byCompany.set(company, [])
    byCompany.get(company)!.push(key)
  }

  const pairs: Omit<Relationship, 'createdAt'>[] = []
  const seen = new Set<string>()

  for (const keys of byCompany.values()) {
    // Deduplicate keys within the company group first
    const unique = [...new Set(keys)]
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const [a, b] = canonPair(unique[i], unique[j])
        const id = `${a}|${b}`
        if (!seen.has(id)) {
          seen.add(id)
          pairs.push({ a, b, typeId: 'colleague' })
        }
      }
    }
  }

  return pairs
}
