import { describe, it, expect } from 'vitest'
import { physicsStep, MAX_VEL, type GraphNode, type GraphEdge } from '@/lib/graphData'

function makeNode(key: string, x: number, y: number): GraphNode {
  return { key, label: key, x, y, vx: 0, vy: 0, hue: 0 }
}

function makeFullyConnectedEdges(keys: string[]): GraphEdge[] {
  const edges: GraphEdge[] = []
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++)
      edges.push({ a: keys[i], b: keys[j], color: '#000' })
  return edges
}

function avgSpeed(nodes: GraphNode[]): number {
  const total = nodes.reduce((s, n) => s + Math.sqrt(n.vx * n.vx + n.vy * n.vy), 0)
  return total / nodes.length
}

describe('physicsStep — velocity clamping', () => {
  it('no node exceeds MAX_VEL after a single step with many edges', () => {
    // 6 nodes all at the same company → 15 edges, extreme attraction
    const keys = ['a', 'b', 'c', 'd', 'e', 'f']
    let nodes = keys.map((k, i) => makeNode(k, i * 5, i * 5)) // very close together
    const edges = makeFullyConnectedEdges(keys)
    nodes = physicsStep(nodes, edges, 400, 300)
    for (const n of nodes) {
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy)
      expect(speed).toBeLessThanOrEqual(MAX_VEL + 0.001)
    }
  })
})

describe('physicsStep — bounded simulation', () => {
  it('nodes stay within ±2000 of centre after 300 steps with 10 colleague edges per node', () => {
    const CX = 400
    const CY = 300
    // 5 nodes all "at same company" → 10 edges, fully connected
    const keys = ['a', 'b', 'c', 'd', 'e']
    let nodes = keys.map((k, i) => makeNode(k, CX + (i - 2) * 80, CY + (i - 2) * 80))
    const edges = makeFullyConnectedEdges(keys)

    for (let t = 0; t < 300; t++) {
      nodes = physicsStep(nodes, edges, CX, CY)
    }

    for (const n of nodes) {
      expect(n.x).toBeGreaterThan(CX - 2000)
      expect(n.x).toBeLessThan(CX + 2000)
      expect(n.y).toBeGreaterThan(CY - 2000)
      expect(n.y).toBeLessThan(CY + 2000)
    }
  })

  it('nodes reach approximate equilibrium after 500 steps', () => {
    const CX = 400
    const CY = 300
    const keys = ['a', 'b', 'c', 'd', 'e']
    let nodes = keys.map((k, i) => makeNode(k, CX + (i - 2) * 120, CY + (i - 2) * 120))
    const edges = makeFullyConnectedEdges(keys)

    for (let t = 0; t < 500; t++) {
      nodes = physicsStep(nodes, edges, CX, CY)
    }

    expect(avgSpeed(nodes)).toBeLessThan(0.5)
  })
})

describe('physicsStep — degree normalisation', () => {
  it('a node with 9 edges does not accelerate faster than one with 1 edge (per edge)', () => {
    // Node "hub" connected to 9 others; node "spoke" connected only to hub
    const keys = ['hub', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']
    const CX = 400
    const CY = 300
    let nodes = keys.map((k, i) => makeNode(k, CX + i * 40, CY))
    const edges: GraphEdge[] = keys.slice(1).map((k) => ({ a: 'hub', b: k, color: '#000' }))

    nodes = physicsStep(nodes, edges, CX, CY)

    const hub   = nodes.find((n) => n.key === 'hub')!
    const spoke = nodes.find((n) => n.key === 'a')!
    const hubSpeed   = Math.sqrt(hub.vx * hub.vx + hub.vy * hub.vy)
    const spokeSpeed = Math.sqrt(spoke.vx * spoke.vx + spoke.vy * spoke.vy)
    // Hub should not be wildly faster than spoke; degree-normalization keeps them comparable
    expect(hubSpeed).toBeLessThan(spokeSpeed * 5)
  })
})
