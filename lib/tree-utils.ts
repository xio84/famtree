import type { MemberData, RelationshipData } from "@/types"
import type { Node, Edge } from "@xyflow/react"

// Node + layout geometry. PersonNode is rendered with a fixed size (w-36 h-28).
export const NODE_W = 144
export const NODE_H = 112
const SPOUSE_GAP = 56 // horizontal gap between two spouses
const SIBLING_GAP = 56 // horizontal gap between neighbouring family units
const GEN_HEIGHT = 230 // vertical distance between generations

const LINE = { stroke: "#9ca3af", strokeWidth: 2 }

/** A horizontal unit on a single row: either a single person or a married couple. */
interface Unit {
  id: string
  members: string[] // 1 person, or [spouse1, spouse2]
  center: number
  depth: number
}

/**
 * Builds a procedurally-generated family tree layout. Node positions are
 * derived entirely from the relationships — they are never read from or
 * written to the database. Spouses sit side by side joined by a straight
 * line; children hang from the centre of that line on straight connectors.
 */
export function buildGraphData(
  members: MemberData[],
  relationships: RelationshipData[],
  selfId?: string | null
): { nodes: Node[]; edges: Edge[] } {
  const memberIds = new Set(members.map((m) => m.id))

  const spouseRels = relationships.filter(
    (r) =>
      r.type === "SPOUSE" &&
      r.spouse1Id &&
      r.spouse2Id &&
      memberIds.has(r.spouse1Id) &&
      memberIds.has(r.spouse2Id)
  )
  const parentRels = relationships.filter(
    (r) =>
      r.type === "PARENT_CHILD" &&
      r.parentId &&
      r.childId &&
      memberIds.has(r.parentId) &&
      memberIds.has(r.childId)
  )

  // --- Build units (couples first, then remaining singletons) ---
  const unitOf = new Map<string, Unit>()
  const units: Unit[] = []
  const newUnit = (ids: string[]): Unit => {
    const u: Unit = { id: `u${units.length}`, members: ids, center: 0, depth: 0 }
    units.push(u)
    ids.forEach((id) => unitOf.set(id, u))
    return u
  }
  for (const r of spouseRels) {
    if (unitOf.has(r.spouse1Id!) || unitOf.has(r.spouse2Id!)) continue
    newUnit([r.spouse1Id!, r.spouse2Id!])
  }
  for (const m of members) {
    if (!unitOf.has(m.id)) newUnit([m.id])
  }

  // --- Parent/child structure between units ---
  const childUnits = new Map<Unit, Set<Unit>>()
  units.forEach((u) => childUnits.set(u, new Set()))
  const parentUnitOf = new Map<Unit, Unit>() // a unit descends from at most one family

  for (const r of parentRels) {
    const pu = unitOf.get(r.parentId!)!
    const cu = unitOf.get(r.childId!)!
    if (pu === cu) continue
    childUnits.get(pu)!.add(cu)
    if (!parentUnitOf.has(cu)) parentUnitOf.set(cu, pu)
  }

  // --- Position units with a simple tidy-tree pass ---
  const unitWidth = (u: Unit) =>
    u.members.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W
  const placed = new Set<Unit>()
  let cursorX = 0

  const place = (u: Unit, depth: number): number => {
    if (placed.has(u)) return u.center
    placed.add(u)
    u.depth = depth

    const kids = [...childUnits.get(u)!].filter(
      (c) => parentUnitOf.get(c) === u && !placed.has(c)
    )

    if (kids.length === 0) {
      u.center = cursorX + unitWidth(u) / 2
      cursorX += unitWidth(u) + SIBLING_GAP
    } else {
      const centers = kids.map((k) => place(k, depth + 1))
      u.center = (Math.min(...centers) + Math.max(...centers)) / 2
      cursorX = Math.max(cursorX, u.center + unitWidth(u) / 2 + SIBLING_GAP)
    }
    return u.center
  }

  units.filter((u) => !parentUnitOf.has(u)).forEach((u) => place(u, 0))
  units.forEach((u) => place(u, 0)) // any leftovers from relationship cycles

  // --- Member node positions ---
  const pos = new Map<string, { x: number; y: number }>()
  for (const u of units) {
    const y = u.depth * GEN_HEIGHT
    if (u.members.length === 1) {
      pos.set(u.members[0], { x: u.center - NODE_W / 2, y })
    } else {
      pos.set(u.members[0], { x: u.center - SPOUSE_GAP / 2 - NODE_W, y })
      pos.set(u.members[1], { x: u.center + SPOUSE_GAP / 2, y })
    }
  }

  const nodes: Node[] = members.map((m) => ({
    id: m.id,
    type: "person",
    position: pos.get(m.id) ?? { x: 0, y: 0 },
    data: { member: m, isSelf: m.id === selfId },
    draggable: false,
  }))

  const edges: Edge[] = []

  // Straight horizontal line between spouses.
  for (const r of spouseRels) {
    edges.push({
      id: r.id,
      source: r.spouse1Id!,
      sourceHandle: "spouse-right",
      target: r.spouse2Id!,
      targetHandle: "spouse-left",
      type: "straight",
      style: LINE,
    })
  }

  // A junction sits at the centre of each family's spouse line; children
  // hang from it on straight (right-angled) connectors.
  const childLinks = new Map<string, Set<string>>() // unit.id -> child member ids
  for (const r of parentRels) {
    const pu = unitOf.get(r.parentId!)!
    if (!childLinks.has(pu.id)) childLinks.set(pu.id, new Set())
    childLinks.get(pu.id)!.add(r.childId!)
  }

  for (const u of units) {
    const kids = childLinks.get(u.id)
    if (!kids || kids.size === 0) continue
    const junctionId = `j-${u.id}`
    nodes.push({
      id: junctionId,
      type: "junction",
      position: { x: u.center, y: u.depth * GEN_HEIGHT + NODE_H / 2 },
      data: {},
      draggable: false,
      selectable: false,
    })
    for (const childId of kids) {
      edges.push({
        id: `pc-${u.id}-${childId}`,
        source: junctionId,
        sourceHandle: "j-bottom",
        target: childId,
        targetHandle: "parent-top",
        type: "step",
        style: LINE,
      })
    }
  }

  return { nodes, edges }
}
