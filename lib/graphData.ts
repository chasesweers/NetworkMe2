import type { Connection, Relationship, RelationshipType } from './types'
import { personKey, avatarHue } from './data'

export interface GraphNode {
  key: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  hue: number
}

export interface GraphEdge {
  a: string
  b: string
  color: string
}

/** Returns true only when a new relationship has been added (count grew). */
export function shouldResetLayout(prevRelCount: number, nextRelCount: number): boolean {
  return nextRelCount > prevRelCount
}

/**
 * Returns the canvas buffer dimensions for a given CSS size and devicePixelRatio.
 * Multiply CSS dimensions by dpr so the buffer has one physical pixel per screen pixel.
 */
export function scaledCanvasSize(
  cssW: number,
  cssH: number,
  dpr: number,
): { bufW: number; bufH: number } {
  const d = Math.max(1, dpr)
  return { bufW: cssW * d, bufH: cssH * d }
}

// ---------- Physics constants ----------
export const REPEL       = 3500   // node-node repulsion strength
export const ATTRACT     = 0.012  // spring attraction (per edge, per pixel of separation)
export const DAMPING     = 0.78   // velocity damping per frame
export const CENTER_PULL = 0.004  // gentle pull toward canvas centre
export const MAX_VEL     = 8      // max speed (px/frame) — prevents explosion with many edges

/**
 * Advance the force-directed simulation by one tick.
 * Returns a *new* array of nodes with updated positions and velocities.
 * Does NOT mutate the input array.
 */
export function physicsStep(
  nodes: GraphNode[],
  edges: GraphEdge[],
  cx: number,   // canvas centre x
  cy: number,   // canvas centre y
): GraphNode[] {
  // Work on shallow copies so we never mutate the input objects
  const ns: GraphNode[] = nodes.map((n) => ({ ...n }))

  // 1. Centre gravity
  for (const n of ns) {
    n.vx += (cx - n.x) * CENTER_PULL
    n.vy += (cy - n.y) * CENTER_PULL
  }

  // 2. Node-node repulsion
  for (let i = 0; i < ns.length; i++) {
    const a = ns[i]
    for (let j = i + 1; j < ns.length; j++) {
      const b = ns[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist2 = dx * dx + dy * dy + 1
      const d = Math.sqrt(dist2)
      const force = REPEL / dist2
      a.vx += (dx / d) * force
      a.vy += (dy / d) * force
      b.vx -= (dx / d) * force
      b.vy -= (dy / d) * force
    }
  }

  // 3. Edge spring attraction — force is divided by each node's degree so
  //    a highly-connected node is never accelerated proportionally harder.
  const degree = new Map<string, number>()
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1)
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1)
  }
  const nodeMap = new Map(ns.map((n) => [n.key, n]))
  for (const edge of edges) {
    const a = nodeMap.get(edge.a)
    const b = nodeMap.get(edge.b)
    if (!a || !b) continue
    const dx = b.x - a.x
    const dy = b.y - a.y
    const da = degree.get(edge.a) ?? 1
    const db = degree.get(edge.b) ?? 1
    a.vx += (dx * ATTRACT) / da
    a.vy += (dy * ATTRACT) / da
    b.vx -= (dx * ATTRACT) / db
    b.vy -= (dy * ATTRACT) / db
  }

  // 4. Damping + velocity clamp + position update
  for (const n of ns) {
    n.vx *= DAMPING
    n.vy *= DAMPING
    const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
    if (speed > MAX_VEL) {
      n.vx = (n.vx / speed) * MAX_VEL
      n.vy = (n.vy / speed) * MAX_VEL
    }
    n.x += n.vx
    n.y += n.vy
  }

  return ns
}

export function buildEdges(
  relationships: Relationship[],
  filterTypeId: string,
  allTypes: RelationshipType[],
): GraphEdge[] {
  const activeRels =
    filterTypeId === 'all'
      ? relationships
      : relationships.filter((r) => r.typeId === filterTypeId)

  return activeRels.map((r) => ({
    a: r.a,
    b: r.b,
    color: allTypes.find((t) => t.id === r.typeId)?.color ?? '#6366f1',
  }))
}

export function buildNodes(
  connections: Connection[],
  existing: GraphNode[],
  canvasW: number,
  canvasH: number,
): GraphNode[] {
  return connections.map((c) => {
    const key = personKey(c)
    const prev = existing.find((n) => n.key === key)
    return {
      key,
      label: c.name,
      x: prev?.x ?? canvasW / 2 + (Math.random() - 0.5) * 300,
      y: prev?.y ?? canvasH / 2 + (Math.random() - 0.5) * 300,
      vx: prev?.vx ?? 0,
      vy: prev?.vy ?? 0,
      hue: avatarHue(key),
    }
  })
}
