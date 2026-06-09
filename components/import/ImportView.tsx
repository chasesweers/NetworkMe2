'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { setConnections, mergeConnections, selectConnections, selectFavorites, selectArchived } from '@/stores/connectionSlice'
import { selectNotes } from '@/stores/noteSlice'
import { selectFollowUps } from '@/stores/followUpSlice'
import { selectRelationships, selectCustomTypes } from '@/stores/relationshipSlice'
import { parseCSV, DEMO_CONNECTIONS } from '@/lib/data'
import { buildExportJSON, buildExportCSV, downloadFile } from '@/lib/export'

export function ImportView() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const connections = useSelector(selectConnections)
  const favorites = useSelector(selectFavorites)
  const archived = useSelector(selectArchived)
  const notes = useSelector(selectNotes)
  const followUps = useSelector(selectFollowUps)
  const relationships = useSelector(selectRelationships)
  const customTypes = useSelector(selectCustomTypes)

  const exportData = { connections, favorites, archived, notes, followUps, relationships, customTypes }
  const hasData = connections.length > 0

  function handleExportJSON() {
    downloadFile('networkme-export.json', buildExportJSON(exportData), 'application/json')
  }

  function handleExportCSV() {
    downloadFile('networkme-export.csv', buildExportCSV(exportData), 'text/csv')
  }

  function handleFile(file: File) {
    setError(null)
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const connections = parseCSV(text)
      if (connections.length === 0) {
        setError('No connections found. Make sure this is a LinkedIn connections CSV.')
        return
      }
      dispatch(mergeConnections(connections))
      setSuccess(`Added ${connections.length} connections to your network`)
      setTimeout(() => router.push('/search'), 1000)
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  function loadDemo() {
    dispatch(setConnections(DEMO_CONNECTIONS))
    setSuccess(`Loaded ${DEMO_CONNECTIONS.length} demo connections`)
    setTimeout(() => router.push('/search'), 800)
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Import connections</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
        Upload your LinkedIn connections CSV, or load demo data to explore.
      </p>

      <label
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-6 sm:p-12 cursor-pointer transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-900'
        }`}
      >
        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Drop your CSV here, or <span className="text-indigo-600 dark:text-indigo-400 font-medium">browse</span>
        </span>
        <input
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{success}</p>}

      <div className="flex items-center gap-4 my-6">
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">or</span>
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export your data</p>
        <div className="flex gap-3">
          <button
            onClick={handleExportJSON}
            disabled={!hasData}
            title={!hasData ? 'No connections to export' : 'Download full backup as JSON'}
            className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!hasData}
            title={!hasData ? 'No connections to export' : 'Download connections as CSV'}
            className="flex-1 py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 my-6">
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">or</span>
        <hr className="flex-1 border-gray-200 dark:border-gray-700" />
      </div>

      <button
        onClick={loadDemo}
        className="w-full py-3 px-6 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      >
        Load demo data
      </button>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 text-center">
        To export from LinkedIn: Settings → Data Privacy → Get a copy of your data → Connections
      </p>
    </div>
  )
}
