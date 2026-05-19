"use client"

import { useEffect } from "react"
import {
  ReactFlow,
  Background,
  MiniMap,
  ReactFlowProvider,
  ConnectionMode,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react"
import type { Node, Edge, Connection } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { PersonNode } from "./PersonNode"
import { TreeControls } from "./TreeControls"

const nodeTypes = { person: PersonNode }

interface FamilyTreeProps {
  nodes: Node[]
  edges: Edge[]
  focusNodeId?: string | null
  focusToken?: number
  onNodeClick?: (memberId: string) => void
  onConnect?: (connection: Connection) => void
  onNodeDragStop?: (id: string, x: number, y: number) => void
}

function FocusOnNode({
  id,
  token,
  nodes,
}: {
  id: string | null | undefined
  token: number | undefined
  nodes: Node[]
}) {
  const { setCenter } = useReactFlow()
  useEffect(() => {
    if (!id) return
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    setCenter(node.position.x + 72, node.position.y + 50, { zoom: 1.2, duration: 400 })
  }, [id, token, nodes, setCenter])
  return null
}

export function FamilyTree({
  nodes,
  edges,
  focusNodeId,
  focusToken,
  onNodeClick,
  onConnect,
  onNodeDragStop,
}: FamilyTreeProps) {
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes)
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges)

  useEffect(() => {
    setLocalNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      return nodes.map((n) => {
        const existing = prevById.get(n.id)
        return existing ? { ...n, position: existing.position } : n
      })
    })
  }, [nodes, setLocalNodes])

  useEffect(() => {
    setLocalEdges(edges)
  }, [edges, setLocalEdges])

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative">
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_e, node) => onNodeClick?.(node.id)}
          onNodeDragStop={(_e, node) => onNodeDragStop?.(node.id, node.position.x, node.position.y)}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap nodeStrokeWidth={3} zoomable pannable />
          <TreeControls />
          <FocusOnNode id={focusNodeId} token={focusToken} nodes={localNodes} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}
