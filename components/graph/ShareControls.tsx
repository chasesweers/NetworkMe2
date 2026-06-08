'use client'

import { useEffect, useState } from 'react'

type State = 'loading' | 'none' | 'active' | 'copied'

export function ShareControls() {
  const [state, setState] = useState<State>('loading')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/share')
      .then((r) => r.json())
      .then((data: { token: string | null }) => {
        setToken(data.token)
        setState(data.token ? 'active' : 'none')
      })
      .catch(() => setState('none'))
  }, [])

  async function generate() {
    const res = await fetch('/api/share', { method: 'POST' })
    const data: { token: string } = await res.json()
    setToken(data.token)
    setState('active')
  }

  async function revoke() {
    await fetch('/api/share', { method: 'DELETE' })
    setToken(null)
    setState('none')
  }

  async function copy() {
    if (!token) return
    await navigator.clipboard.writeText(`${location.origin}/shared/${token}`)
    setState('copied')
    setTimeout(() => setState('active'), 2000)
  }

  if (state === 'loading') return null

  if (state === 'none') {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share your graph</p>
        <button
          onClick={generate}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors w-full"
        >
          Generate link
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 flex flex-col gap-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">Share your graph</p>
      <button
        onClick={copy}
        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors w-full"
      >
        {state === 'copied' ? 'Copied!' : 'Copy link'}
      </button>
      <button
        onClick={revoke}
        className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors text-left"
      >
        Revoke
      </button>
    </div>
  )
}
