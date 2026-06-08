'use client'

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { selectConnections } from '@/stores/connectionSlice'
import { selectAllRelationships, selectAllTypes } from '@/stores/relationshipSlice'
import { personKey, initials } from '@/lib/data'
import { buildEdges, buildNodes, physicsStep, shouldResetLayout, scaledCanvasSize, type GraphNode, type GraphEdge } from '@/lib/graphData'
import Link from 'next/link'
import type { Connection, Relationship, RelationshipType } from '@/lib/types'

// Re-export types under local aliases for internal use
type Node = GraphNode
type Edge = GraphEdge

const NODE_R = 22

/**
 * Module-level position cache — survives component unmount/remount so node
 * positions are preserved when the user navigates away and returns to /graph.
 * Cleared when a new relationship is added or the user clicks "Refresh graph".
 */
let positionCache: Node[] = []

interface GraphViewProps {
  initialConnections?: Connection[]
  initialRelationships?: Relationship[]
  initialTypes?: RelationshipType[]
  readOnly?: boolean
  controlsSlot?: React.ReactNode
}

export function GraphView({ initialConnections, initialRelationships, initialTypes, readOnly = false, controlsSlot }: GraphViewProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const storeConnections = useSelector(selectConnections)
  const storeRelationships = useSelector(selectAllRelationships)
  const storeTypes = useSelector(selectAllTypes)
  const connections = initialConnections ?? storeConnections
  const relationships = initialRelationships ?? storeRelationships
  const allTypes = initialTypes ?? storeTypes

  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const animFrameRef = useRef<number>(0)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 })
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; conn: (typeof connections)[0] } | null>(null)
  const isPanningRef = useRef(false)
  const lastPanRef = useRef({ x: 0, y: 0 })
  const [filterTypeId, setFilterTypeId] = useState<string>('all')
  const [showLabels, setShowLabels] = useState(true)
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const prevRelCountRef = useRef(relationships.length)

  // Reset layout when a new relationship is added
  useEffect(() => {
    if (shouldResetLayout(prevRelCountRef.current, relationships.length)) {
      positionCache = []
    }
    prevRelCountRef.current = relationships.length
  }, [relationships.length])

  // Rebuild nodes — uses positionCache so layout survives navigation.
  // Always work in CSS pixels (offsetWidth/Height), not the scaled buffer dimensions.
  useEffect(() => {
    const W = canvasRef.current?.offsetWidth ?? 800
    const H = canvasRef.current?.offsetHeight ?? 600
    nodesRef.current = buildNodes(connections, positionCache, W, H)
  }, [connections])

  // Rebuild edges whenever relationships, filter, or types change
  useEffect(() => {
    edgesRef.current = buildEdges(relationships, filterTypeId, allTypes)
  }, [relationships, filterTypeId, allTypes])

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const edges = edgesRef.current
    const { x: tx, y: ty, scale } = transformRef.current
    const dpr = window.devicePixelRatio || 1
    // Buffer dimensions (physical pixels) — used only for clearRect
    const bufW = canvas.width
    const bufH = canvas.height
    // CSS dimensions — all drawing coordinates and physics live in CSS pixel space
    const cssW = canvas.offsetWidth
    const cssH = canvas.offsetHeight
    const cx = cssW / 2
    const cy = cssH / 2

    // Advance physics using the stable, degree-normalised step
    nodesRef.current = physicsStep(nodesRef.current, edges, cx, cy)
    const nodes = nodesRef.current

    ctx.clearRect(0, 0, bufW, bufH)
    ctx.save()
    // Scale up to physical pixels first, then apply user pan/zoom — keeps all
    // node/edge coordinates in CSS pixel space for crisp rendering on HiDPI displays.
    ctx.scale(dpr, dpr)
    ctx.translate(tx, ty)
    ctx.scale(scale, scale)

    for (const edge of edges) {
      const a = nodes.find((n) => n.key === edge.a)
      const b = nodes.find((n) => n.key === edge.b)
      if (!a || !b) continue
      const isHighlighted = hoveredKey && (a.key === hoveredKey || b.key === hoveredKey)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle = isHighlighted ? edge.color : `${edge.color}66`
      ctx.lineWidth = isHighlighted ? 2 : 1
      ctx.stroke()
    }

    const activeKey = hoveredKey ?? pinnedKey
    const connectedKeys = activeKey
      ? new Set(edges.filter((e) => e.a === activeKey || e.b === activeKey).flatMap((e) => [e.a, e.b]))
      : null

    for (const node of nodes) {
      const isHovered = node.key === activeKey
      const isConnected = connectedKeys?.has(node.key)
      const dimmed = activeKey && !isHovered && !isConnected

      ctx.beginPath()
      ctx.arc(node.x, node.y, NODE_R, 0, Math.PI * 2)
      ctx.fillStyle = dimmed
        ? `hsl(${node.hue} 20% 60% / 0.3)`
        : `hsl(${node.hue} 60% ${isHovered ? '45%' : '55%'})`
      ctx.fill()

      if (isHovered) {
        ctx.strokeStyle = `hsl(${node.hue} 60% 35%)`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (node.key === pinnedKey) {
        const pulse = (Math.sin(Date.now() / 300) + 1) / 2  // 0–1
        const radius = NODE_R + 6 + pulse * 6
        const alpha = 0.4 + pulse * 0.6
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`
        ctx.lineWidth = 3
        ctx.stroke()
      }

      if (showLabels || isHovered) {
        ctx.fillStyle = 'white'
        ctx.font = `${isHovered ? 'bold ' : ''}12px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(initials(node.label), node.x, node.y)
      }

      if ((showLabels && !dimmed) || isHovered) {
        const isDark = document.documentElement.classList.contains('dark')
        ctx.fillStyle = isHovered ? (isDark ? '#c7d2fe' : '#1e1b4b') : (isDark ? '#ffffff' : '#374151')
        ctx.font = `${isHovered ? 'bold ' : ''}11px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(node.label.split(' ')[0], node.x, node.y + NODE_R + 4)
      }
    }

    ctx.restore()
    animFrameRef.current = requestAnimationFrame(tick)
  }, [hoveredKey, pinnedKey, showLabels])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(animFrameRef.current)
      // Persist positions so they survive navigation away and back
      positionCache = [...nodesRef.current]
    }
  }, [tick])

  // useLayoutEffect fires synchronously after the DOM is ready but BEFORE the
  // browser paints — guaranteeing the canvas buffer is correctly sized at the
  // correct physical resolution before the very first RAF tick draws anything.
  // useEffect fires AFTER paint, so the first few frames would draw into the
  // browser-default 300×150 buffer and appear blurry/zoomed on every refresh.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function resize() {
      const dpr = window.devicePixelRatio || 1
      const { bufW, bufH } = scaledCanvasSize(canvas!.offsetWidth, canvas!.offsetHeight, dpr)
      canvas!.width  = bufW
      canvas!.height = bufH
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    return () => ro.disconnect()
  }, [])

  function getNodeAt(clientX: number, clientY: number): Node | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const { x: tx, y: ty, scale } = transformRef.current
    const mx = (clientX - rect.left - tx) / scale
    const my = (clientY - rect.top - ty) / scale
    for (const n of nodesRef.current) {
      const dx = n.x - mx
      const dy = n.y - my
      if (dx * dx + dy * dy <= NODE_R * NODE_R) return n
    }
    return null
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (isPanningRef.current) {
      transformRef.current.x += e.clientX - lastPanRef.current.x
      transformRef.current.y += e.clientY - lastPanRef.current.y
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      setTooltip(null)
      return
    }
    const node = getNodeAt(e.clientX, e.clientY)
    if (node) {
      setHoveredKey(node.key)
      const conn = connections.find((c) => personKey(c) === node.key)
      if (conn) {
        const rect = canvasRef.current!.getBoundingClientRect()
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 60, conn })
      }
    } else {
      setHoveredKey(null)
      setTooltip(null)
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!getNodeAt(e.clientX, e.clientY)) {
      isPanningRef.current = true
      lastPanRef.current = { x: e.clientX, y: e.clientY }
    }
  }

  function onMouseUp() { isPanningRef.current = false }

  function onClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return
    const node = getNodeAt(e.clientX, e.clientY)
    if (node) router.push(`/profile/${node.key}?from=/graph`)
  }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const { x: tx, y: ty, scale } = transformRef.current
    transformRef.current = {
      scale: Math.max(0.2, Math.min(5, scale * factor)),
      x: mx - (mx - tx) * factor,
      y: my - (my - ty) * factor,
    }
  }

  const suggestions = searchQuery.trim().length > 0
    ? connections.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : []

  function selectSuggestion(conn: (typeof connections)[0]) {
    setPinnedKey(personKey(conn))
    setSearchQuery(conn.name)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClick}
        onWheel={onWheel}
      />

      {connections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
          <div className="pointer-events-auto">
            <p className="text-gray-400 dark:text-gray-600 mb-3">No connections to visualize.</p>
            <Link href="/import" className="text-indigo-500 hover:underline text-sm">Import connections</Link>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 z-20 w-56">
        <input
          type="text"
          placeholder="Search connections…"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); if (!e.target.value) setPinnedKey(null) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((c) => (
              <li key={personKey(c)}>
                <button
                  onMouseDown={() => selectSuggestion(c)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                >
                  {c.name}
                  {c.company && <span className="text-xs text-gray-400 ml-1">· {c.company}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y }}
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">{tooltip.conn.name}</p>
          {tooltip.conn.title && <p className="text-gray-500 dark:text-gray-400 text-xs">{tooltip.conn.title}</p>}
          {tooltip.conn.company && <p className="text-gray-400 dark:text-gray-600 text-xs">{tooltip.conn.company}</p>}
          {!readOnly && <p className="text-indigo-500 text-xs mt-1">Click to view profile</p>}
        </div>
      )}

      <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3 flex flex-col gap-3 min-w-44">
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Filter by relationship</label>
        <select
          value={filterTypeId}
          onChange={(e) => setFilterTypeId(e.target.value)}
          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
        >
          <option value="all">All types</option>
          {allTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="rounded"
          />
          Show labels
        </label>

        <button
          onClick={() => { transformRef.current = { x: 0, y: 0, scale: 1 } }}
          className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
        >
          Reset zoom
        </button>

        <button
          onClick={() => {
            positionCache = []
            const W = canvasRef.current?.offsetWidth ?? 800
            const H = canvasRef.current?.offsetHeight ?? 600
            nodesRef.current = buildNodes(connections, [], W, H)
          }}
          className="text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
          aria-label="Refresh graph"
        >
          Refresh graph
        </button>
        {controlsSlot}
      </div>
    </div>
  )
}
