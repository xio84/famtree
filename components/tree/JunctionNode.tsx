"use client"

import { Handle, Position } from "@xyflow/react"

/**
 * An invisible 1px node placed at the centre of a couple's spouse line.
 * Children connectors fan out from its bottom handle, so every line in the
 * tree is straight and the descent point is exactly mid-couple.
 */
export function JunctionNode() {
  return (
    <div style={{ width: 1, height: 1 }}>
      <Handle id="j-top" type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle id="j-bottom" type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}
