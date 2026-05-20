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
import { JunctionNode } from "./JunctionNode"
import { TreeControls } from "./TreeControls"
import { NODE_W, NODE_H } from "@/lib/tree-utils"

const nodeTypes = { person: PersonNode, junction: JunctionNode }

interface FamilyTreeProps {
  nodes: Node[]
  edges: Edge[]
  focusNodeId?: string | null
  focusToken?: number
  onNodeClick?: (memberId: string) => void
  onConnect?: (connection: Connection) => void
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
    setCenter(node.position.x + NODE_W / 2, node.position.y + NODE_H / 2, {
      zoom: 1.2,
      duration: 400,
    })
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
}: FamilyTreeProps) {
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState(nodes)
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState(edges)

  // The layout is generated procedurally, so always adopt the latest
  // positions rather than preserving anything from a previous render.
  useEffect(() => {
    setLocalNodes(nodes)
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
          nodesDraggable={false}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_e, node) => {
            if (node.type === "person") onNodeClick?.(node.id)
          }}
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
