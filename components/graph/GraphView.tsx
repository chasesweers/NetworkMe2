'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector, useDispatch } from 'react-redux'
import { selectConnections } from '@/stores/connectionSlice'
import { selectRelationships, selectAllTypes } from '@/stores/relationshipSlice'
import { personKey, initials, avatarHue } from '@/lib/data'
import Link from 'next/link'

interface Node {
  key: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  hue: number
}

interface Edge {
  a: string
  b: string
  color: string
}

const NODE_R = 22
const REPEL = 4000
const ATTRACT = 0.04
const DAMPING = 0.85
const CENTER_PULL = 0.005

export function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const connections = useSelector(selectConnections)
  const relationships = useSelector(selectRelationships)
  const allTypes = useSelector(selectAllTypes)

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

  useEffect(() => {
    const W = canvasRef.current?.width ?? 800
    const H = canvasRef.current?.height ?? 600

    nodesRef.current = connections.map((c) => {
      const key = personKey(c)
      const existing = nodesRef.current.find((n) => n.key === key)
      return {
        key,
        label: c.name,
        x: existing?.x ?? W / 2 + (Math.random() - 0.5) * 300,
        y: existing?.y ?? H / 2 + (Math.random() - 0.5) * 300,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        hue: avatarHue(key),
      }
    })

    const activeRels = filterTypeId === 'all' ? relationships : relationships.filter((r) => r.typeId === filterTypeId)
    edgesRef.current = activeRels.map((r) => ({
      a: r.a,
      b: r.b,
      color: allTypes.find((t) => t.id === r.typeId)?.color ?? '#6366f1',
    }))
  }, [connections, relationships, filterTypeId, allTypes])

  const tick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const nodes = nodesRef.current
    const edges = edgesRef.current
    const { x: tx, y: ty, scale } = transformRef.current
    const W = canvas.width
    const H = canvas.height
    const cx = W / 2
    const cy = H / 2

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      a.vx += (cx - a.x) * CENTER_PULL
      a.vy += (cy - a.y) * CENTER_PULL
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist2 = dx * dx + dy * dy + 1
        const force = REPEL / dist2
        const d = Math.sqrt(dist2)
        a.vx += (dx / d) * force
        a.vy += (dy / d) * force
        b.vx -= (dx / d) * force
        b.vy -= (dy / d) * force
      }
    }

    for (const edge of edges) {
      const a = nodes.find((n) => n.key === edge.a)
      const b = nodes.find((n) => n.key === edge.b)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      a.vx += dx * ATTRACT
      a.vy += dy * ATTRACT
      b.vx -= dx * ATTRACT
      b.vy -= dy * ATTRACT
    }

    for (const n of nodes) {
      n.vx *= DAMPING
      n.vy *= DAMPING
      n.x += n.vx
      n.y += n.vy
    }

    ctx.clearRect(0, 0, W, H)
    ctx.save()
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

    const connectedKeys = hoveredKey
      ? new Set(edges.filter((e) => e.a === hoveredKey || e.b === hoveredKey).flatMap((e) => [e.a, e.b]))
      : null

    for (const node of nodes) {
      const isHovered = node.key === hoveredKey
      const isConnected = connectedKeys?.has(node.key)
      const dimmed = hoveredKey && !isHovered && !isConnected

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

      if (showLabels || isHovered) {
        ctx.fillStyle = 'white'
        ctx.font = `${isHovered ? 'bold ' : ''}12px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(initials(node.label), node.x, node.y)
      }

      if ((showLabels && !dimmed) || isHovered) {
        ctx.fillStyle = isHovered ? '#1e1b4b' : '#374151'
        ctx.font = `${isHovered ? 'bold ' : ''}11px system-ui`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillText(node.label.split(' ')[0], node.x, node.y + NODE_R + 4)
      }
    }

    ctx.restore()
    animFrameRef.current = requestAnimationFrame(tick)
  }, [hoveredKey, showLabels])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
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
    const node = getNodeAt(e.clientX, e.clientY)
    if (node) router.push(`/profile/${node.key}`)
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

  if (connections.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-center">
        <div>
          <p className="text-gray-400 dark:text-gray-600 mb-3">No connections to visualize.</p>
          <Link href="/import" className="text-indigo-500 hover:underline text-sm">Import connections</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)]">
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

      {tooltip && (
        <div
          className="pointer-events-none absolute bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm z-10"
          style={{ left: tooltip.x + 12, top: tooltip.y }}
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">{tooltip.conn.name}</p>
          {tooltip.conn.title && <p className="text-gray-500 dark:text-gray-400 text-xs">{tooltip.conn.title}</p>}
          {tooltip.conn.company && <p className="text-gray-400 dark:text-gray-600 text-xs">{tooltip.conn.company}</p>}
          <p className="text-indigo-500 text-xs mt-1">Click to view profile</p>
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
      </div>
    </div>
  )
}
