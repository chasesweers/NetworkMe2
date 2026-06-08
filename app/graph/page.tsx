import { GraphView } from '@/components/graph/GraphView'
import { ShareControls } from '@/components/graph/ShareControls'

export default function GraphPage() {
  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      <GraphView controlsSlot={<ShareControls />} />
    </div>
  )
}
