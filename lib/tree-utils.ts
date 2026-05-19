import type { MemberData, RelationshipData } from "@/types"
import type { Node, Edge } from "@xyflow/react"

export function buildGraphData(
  members: MemberData[],
  relationships: RelationshipData[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = members.map((m, i) => ({
    id: m.id,
    type: "person",
    position: {
      x: m.x ?? (i % 5) * 200,
      y: m.y ?? Math.floor(i / 5) * 150,
    },
    data: { member: m },
  }))

  const edges: Edge[] = relationships.flatMap((r) => {
    if (r.type === "PARENT_CHILD" && r.parentId && r.childId) {
      return [
        {
          id: r.id,
          source: r.parentId,
          sourceHandle: "parent-bottom",
          target: r.childId,
          targetHandle: "parent-top",
          label: "parent",
        },
      ]
    }
    if (r.type === "SPOUSE" && r.spouse1Id && r.spouse2Id) {
      return [
        {
          id: r.id,
          source: r.spouse1Id,
          sourceHandle: "spouse-right",
          target: r.spouse2Id,
          targetHandle: "spouse-left",
          label: "spouse",
          type: "straight",
        },
      ]
    }
    return []
  })

  return { nodes, edges }
}
