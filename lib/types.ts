export interface Connection {
  name: string
  title: string
  company: string
  connected: string
  url: string
  email: string
}

export interface Relationship {
  a: string
  b: string
  typeId: string
  createdAt: number
}

export interface RelationshipType {
  id: string
  label: string
  color: string
  builtin: boolean
}

export interface AuthUser {
  id: number
  email: string
  display_name?: string
}

export const BUILTIN_RELATIONSHIP_TYPES: RelationshipType[] = [
  { id: 'friend', label: 'Friend', color: '#6366f1', builtin: true },
  { id: 'colleague', label: 'Works at same corporation', color: '#0ea5e9', builtin: true },
  { id: 'school', label: 'Goes to school with', color: '#10b981', builtin: true },
  { id: 'family', label: 'Family', color: '#f59e0b', builtin: true },
  { id: 'mentor', label: 'Mentor / Mentee', color: '#ec4899', builtin: true },
]
