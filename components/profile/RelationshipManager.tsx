'use client'

import { useState, useRef, useId } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import { selectConnections } from '@/stores/connectionSlice'
import {
  selectRelationshipsFor,
  selectAutoRelationshipsFor,
  selectAllTypes,
  addRelationship,
  removeRelationship,
  addCustomType,
} from '@/stores/relationshipSlice'
import { personKey } from '@/lib/data'

interface Props {
  currentKey: string
}

export function RelationshipManager({ currentKey }: Props) {
  const dispatch = useDispatch()
  const connections = useSelector(selectConnections)
  const relationships = useSelector(selectRelationshipsFor(currentKey))
  const autoRels = useSelector(selectAutoRelationshipsFor(currentKey))
  const allTypes = useSelector(selectAllTypes)
  const searchId = useId()

  const others = connections.filter((c) => personKey(c) !== currentKey)

  // Search state
  const [query, setQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Type + custom form state
  const [selectedTypeId, setSelectedTypeId] = useState(allTypes[0]?.id ?? 'friend')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customColor, setCustomColor] = useState('#6366f1')

  const suggestions = query.trim()
    ? others.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : []

  function selectConnection(key: string, name: string) {
    setSelectedKey(key)
    setQuery(name)
    setIsOpen(false)
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setSelectedKey(null)      // clear selection if user edits text
    setIsOpen(value.trim().length > 0)
  }

  function handleAdd() {
    if (!selectedKey) return
    dispatch(addRelationship({ a: currentKey, b: selectedKey, typeId: selectedTypeId }))
    setQuery('')
    setSelectedKey(null)
    setIsOpen(false)
  }

  function handleRemove(a: string, b: string) {
    dispatch(removeRelationship({ a, b }))
  }

  function handleAddCustomType() {
    if (!customLabel.trim()) return
    const id = customLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    dispatch(addCustomType({ id, label: customLabel.trim(), color: customColor }))
    setSelectedTypeId(id)
    setCustomLabel('')
    setShowCustomForm(false)
  }

  const colleagueType = allTypes.find((t) => t.id === 'colleague')

  const autoColleagues = autoRels.map((r) => {
    const otherKey = r.a === currentKey ? r.b : r.a
    const other = connections.find((c) => personKey(c) === otherKey)
    return { otherKey, other }
  })

  const rels = relationships.map((r) => {
    const otherKey = r.a === currentKey ? r.b : r.a
    const other = connections.find((c) => personKey(c) === otherKey)
    const type = allTypes.find((t) => t.id === r.typeId)
    return { r, otherKey, other, type }
  })

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Relationships</h2>

      {/* Existing relationships */}
      {rels.length === 0 && autoColleagues.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-600 mb-4">No relationships yet.</p>
      ) : rels.length === 0 ? null : (
        <ul className="space-y-2 mb-5">
          {rels.map(({ r, otherKey, other, type }) => (
            <li key={`${r.a}-${r.b}-${r.typeId}`} className="flex items-center gap-3 group">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: type?.color ?? '#6366f1' }}
              />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 truncate">
                {type?.label ?? r.typeId}
              </span>
              {other ? (
                <Link
                  href={`/profile/${otherKey}`}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex-1 truncate"
                >
                  {other.name}
                </Link>
              ) : (
                <span className="text-sm text-gray-400 flex-1 truncate">{otherKey}</span>
              )}
              <button
                onClick={() => handleRemove(r.a, r.b)}
                aria-label="Remove relationship"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 dark:text-gray-700 dark:hover:text-red-400 ml-auto shrink-0"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Automatic colleague relationships */}
      {autoColleagues.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-600 mb-2">
            Same company — automatic
          </p>
          <ul className="space-y-2">
            {autoColleagues.map(({ otherKey, other }) => (
              <li key={otherKey} className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colleagueType?.color ?? '#0ea5e9' }}
                />
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-28 shrink-0 truncate">
                  {colleagueType?.label ?? 'Colleague'}
                </span>
                {other ? (
                  <Link
                    href={`/profile/${otherKey}`}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex-1 truncate"
                  >
                    {other.name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400 flex-1 truncate">{otherKey}</span>
                )}
                <span
                  aria-label="Auto relationship"
                  className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400 shrink-0"
                >
                  Auto
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add relationship form */}
      {others.length > 0 && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Add a relationship</p>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Connection search */}
            <div className="relative flex-1">
              <label htmlFor={searchId} className="sr-only">Search connections</label>
              <input
                id={searchId}
                ref={inputRef}
                type="text"
                role="textbox"
                aria-label="Search connections"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                placeholder="Search connections…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => query.trim() && setIsOpen(true)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                autoComplete="off"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Suggestions dropdown */}
              {isOpen && suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                >
                  {suggestions.map((c) => {
                    const k = personKey(c)
                    return (
                      <li
                        key={k}
                        role="option"
                        aria-selected={selectedKey === k}
                        onClick={() => selectConnection(k, c.name)}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950 flex items-center gap-2"
                      >
                        <span className="font-medium text-gray-900 dark:text-gray-100">{c.name}</span>
                        {c.company && (
                          <span className="text-gray-400 dark:text-gray-600 text-xs truncate">{c.company}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Type selector */}
            <select
              aria-label="Type"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {allTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              disabled={!selectedKey}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              Add relationship
            </button>
          </div>

          {/* Custom type toggle */}
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              + New relationship type
            </button>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type name (e.g. Mentor)"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomType()}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
                title="Type color"
              />
              <button
                onClick={handleAddCustomType}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowCustomForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
