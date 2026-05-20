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

export interface BuildGraphOptions {
  selfId?: string | null
  /**
   * memberId -> chosen spouseId. For a person with several spouses, only one
   * pairing can be drawn at a time; this picks which. Defaults to the first.
   */
  spouseChoice?: Record<string, string>
}

/**
 * Builds a procedurally-generated family tree layout. Node positions are
 * derived entirely from the relationships — they are never read from or
 * written to the database. Spouses sit side by side joined by a straight
 * line; children hang from the centre of that line on straight connectors.
 *
 * A person with multiple spouses is drawn beside one spouse at a time (chosen
 * via `spouseChoice`); their children follow the displayed pairing.
 */
export function buildGraphData(
  members: MemberData[],
  relationships: RelationshipData[],
  options: BuildGraphOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const { selfId, spouseChoice } = options
  const memberIds = new Set(members.map((m) => m.id))
  const memberById = new Map(members.map((m) => [m.id, m]))

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

  // --- Spouse adjacency ---
  const spousesOf = new Map<string, string[]>()
  const linkSpouse = (a: string, b: string) => {
    const list = spousesOf.get(a) ?? []
    if (!list.includes(b)) list.push(b)
    spousesOf.set(a, list)
  }
  for (const r of spouseRels) {
    linkSpouse(r.spouse1Id!, r.spouse2Id!)
    linkSpouse(r.spouse2Id!, r.spouse1Id!)
  }

  /** The spouse currently shown beside a member (or undefined if unmarried). */
  const activeSpouseOf = (id: string): string | undefined => {
    const list = spousesOf.get(id)
    if (!list || list.length === 0) return undefined
    const chosen = spouseChoice?.[id]
    return chosen && list.includes(chosen) ? chosen : list[0]
  }

  // --- Build units: couples from the active spouse first, then singletons ---
  const unitOf = new Map<string, Unit>()
  const units: Unit[] = []
  const newUnit = (ids: string[]): Unit => {
    const u: Unit = { id: `u${units.length}`, members: ids, center: 0, depth: 0 }
    units.push(u)
    ids.forEach((id) => unitOf.set(id, u))
    return u
  }
  for (const m of members) {
    if (unitOf.has(m.id)) continue
    const s = activeSpouseOf(m.id)
    if (s && !unitOf.has(s)) newUnit([m.id, s])
  }
  for (const m of members) {
    if (!unitOf.has(m.id)) newUnit([m.id])
  }

  // --- Parents of each child ---
  const parentsOf = new Map<string, string[]>()
  for (const r of parentRels) {
    const list = parentsOf.get(r.childId!) ?? []
    if (!list.includes(r.parentId!)) list.push(r.parentId!)
    parentsOf.set(r.childId!, list)
  }

  /**
   * The unit a child hangs from. A child of a couple appears under that couple
   * only while the couple is the displayed pairing; otherwise it falls back to
   * a lone parent, so switching a spouse also switches the visible children.
   */
  const ownerUnitOf = (childId: string): Unit | undefined => {
    const ps = parentsOf.get(childId)
    if (!ps || ps.length === 0) return undefined
    if (ps.length >= 2) {
      const couple = units.find(
        (u) => u.members.length === 2 && ps.every((p) => u.members.includes(p))
      )
      if (couple) return couple
      // The relevant marriage isn't displayed — hang from a lone parent if any.
      return ps.map((p) => unitOf.get(p)).find((u) => u && u.members.length === 1)
    }
    return unitOf.get(ps[0])
  }

  // --- Parent/child structure between units ---
  const childUnits = new Map<Unit, Set<Unit>>()
  units.forEach((u) => childUnits.set(u, new Set()))
  const parentUnitOf = new Map<Unit, Unit>() // a unit descends from at most one family
  const bloodChildId = new Map<Unit, string>() // member linking a unit to its parent family
  const childrenOfUnit = new Map<Unit, Set<string>>() // unit -> child member ids

  for (const m of members) {
    const owner = ownerUnitOf(m.id)
    if (!owner) continue
    const cu = unitOf.get(m.id)!
    if (owner === cu) continue
    childUnits.get(owner)!.add(cu)
    if (!parentUnitOf.has(cu)) {
      parentUnitOf.set(cu, owner)
      bloodChildId.set(cu, m.id)
    }
    const kids = childrenOfUnit.get(owner) ?? new Set<string>()
    kids.add(m.id)
    childrenOfUnit.set(owner, kids)
  }

  // Birth time of the blood descendant linking a unit to its parents, used to
  // order siblings oldest-to-youngest. Undated units sort last.
  const birthTime = (u: Unit): number => {
    const d = memberById.get(bloodChildId.get(u) ?? "")?.birthDate
    return d ? new Date(d).getTime() : Number.POSITIVE_INFINITY
  }

  // --- Position units with a simple tidy-tree pass ---
  const unitWidth = (u: Unit) =>
    u.members.length === 2 ? NODE_W * 2 + SPOUSE_GAP : NODE_W
  const placed = new Set<Unit>()
  let cursorX = 0

  // Places a unit's whole subtree and returns every unit in it, so the caller
  // can shift the block sideways as one piece.
  const place = (u: Unit, depth: number): Unit[] => {
    if (placed.has(u)) return []
    placed.add(u)
    u.depth = depth

    const kids = [...childUnits.get(u)!]
      .filter((c) => parentUnitOf.get(c) === u && !placed.has(c))
      .sort((a, b) => birthTime(a) - birthTime(b))

    if (kids.length === 0) {
      u.center = cursorX + unitWidth(u) / 2
      cursorX += unitWidth(u) + SIBLING_GAP
      return [u]
    }

    const startX = cursorX
    const subtree: Unit[] = [u]
    const centers: number[] = []
    for (const k of kids) {
      subtree.push(...place(k, depth + 1))
      centers.push(k.center)
    }
    u.center = (Math.min(...centers) + Math.max(...centers)) / 2

    // A couple is wider than a lone person: if u's own footprint spills past
    // the left edge of its children's block, shift the whole subtree right so
    // the spouse doesn't overlap the previous sibling.
    const half = unitWidth(u) / 2
    const overflowLeft = startX - (u.center - half)
    if (overflowLeft > 0) {
      for (const s of subtree) s.center += overflowLeft
      cursorX += overflowLeft
    }
    cursorX = Math.max(cursorX, u.center + half + SIBLING_GAP)
    return subtree
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

  const nodes: Node[] = members.map((m) => {
    const spouses = spousesOf.get(m.id) ?? []
    const active = spouses.length > 1 ? activeSpouseOf(m.id) : undefined
    return {
      id: m.id,
      type: "person",
      position: pos.get(m.id) ?? { x: 0, y: 0 },
      data: {
        member: m,
        isSelf: m.id === selfId,
        spouseCount: spouses.length,
        spouseIndex: active ? Math.max(0, spouses.indexOf(active)) : 0,
      },
      draggable: false,
    }
  })

  const edges: Edge[] = []

  // Straight horizontal line between the spouses of each displayed couple.
  for (const u of units) {
    if (u.members.length !== 2) continue
    const rel = spouseRels.find(
      (r) =>
        (r.spouse1Id === u.members[0] && r.spouse2Id === u.members[1]) ||
        (r.spouse1Id === u.members[1] && r.spouse2Id === u.members[0])
    )
    if (!rel) continue
    edges.push({
      id: rel.id,
      source: u.members[0],
      sourceHandle: "spouse-right",
      target: u.members[1],
      targetHandle: "spouse-left",
      type: "straight",
      style: LINE,
    })
  }

  // A junction sits at the centre of each family's spouse line; children
  // hang from it on straight (right-angled) connectors.
  for (const u of units) {
    const kids = childrenOfUnit.get(u)
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
