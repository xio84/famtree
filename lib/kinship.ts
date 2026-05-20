import type { MemberData, RelationshipData, Gender } from "@/types"

const ORDINAL = ["", "First", "Second", "Third", "Fourth", "Fifth", "Sixth"]
const ordinal = (n: number) => ORDINAL[n] ?? `${n}th`

/** "" | "Great-" | "Great-Great-" … */
const greats = (n: number) => "Great-".repeat(Math.max(0, n))

const byGender = (g: Gender, male: string, female: string, neutral: string) =>
  g === "MALE" ? male : g === "FEMALE" ? female : neutral

/**
 * Describes how `targetId` is related to `selfId` from self's point of view,
 * e.g. "Your Aunt" or "Your Second Cousin Once Removed". Returns null when the
 * two are unrelated by blood or marriage, or are the same person.
 */
export function kinshipLabel(
  selfId: string,
  targetId: string,
  members: MemberData[],
  relationships: RelationshipData[]
): string | null {
  if (!selfId || selfId === targetId) return null
  const target = members.find((m) => m.id === targetId)
  if (!target || !members.some((m) => m.id === selfId)) return null
  const g = target.gender

  // Direct spouse.
  const married = relationships.some(
    (r) =>
      r.type === "SPOUSE" &&
      ((r.spouse1Id === selfId && r.spouse2Id === targetId) ||
        (r.spouse2Id === selfId && r.spouse1Id === targetId))
  )
  if (married) return `Your ${byGender(g, "Husband", "Wife", "Spouse")}`

  const parentsOf = (id: string) =>
    relationships
      .filter((r) => r.type === "PARENT_CHILD" && r.childId === id)
      .map((r) => r.parentId)
      .filter((p): p is string => !!p)

  // ancestorId -> fewest generations above the start node (start itself = 0)
  const ancestry = (start: string) => {
    const dist = new Map<string, number>([[start, 0]])
    let frontier = [start]
    let gen = 0
    while (frontier.length) {
      gen++
      const next: string[] = []
      for (const id of frontier) {
        for (const p of parentsOf(id)) {
          if (!dist.has(p)) {
            dist.set(p, gen)
            next.push(p)
          }
        }
      }
      frontier = next
    }
    return dist
  }

  const selfUp = ancestry(selfId)
  const targetUp = ancestry(targetId)

  // Closest common ancestor (smallest combined generational distance).
  let best: { up: number; down: number } | null = null
  for (const [id, up] of selfUp) {
    const down = targetUp.get(id)
    if (down === undefined) continue
    if (!best || up + down < best.up + best.down) best = { up, down }
  }
  if (!best) return null
  const { up, down } = best // up: self→ancestor, down: target→ancestor

  // Target is a descendant of self.
  if (up === 0) {
    if (down === 1) return `Your ${byGender(g, "Son", "Daughter", "Child")}`
    return `Your ${greats(down - 2)}Grand${byGender(g, "son", "daughter", "child")}`
  }
  // Target is an ancestor of self.
  if (down === 0) {
    if (up === 1) return `Your ${byGender(g, "Father", "Mother", "Parent")}`
    return `Your ${greats(up - 2)}Grand${byGender(g, "father", "mother", "parent")}`
  }
  // Siblings.
  if (up === 1 && down === 1) return `Your ${byGender(g, "Brother", "Sister", "Sibling")}`

  // Aunt/uncle ↔ niece/nephew axis — one side is a direct sibling line.
  if (Math.min(up, down) === 1) {
    const level = Math.max(up, down) // 2 = aunt/niece, 3 = grand-, …
    const prefix = level === 2 ? "" : greats(level - 3) + "Grand-"
    if (down === 1) return `Your ${prefix}${byGender(g, "Uncle", "Aunt", "Aunt/Uncle")}`
    return `Your ${prefix}${byGender(g, "Nephew", "Niece", "Niece/Nephew")}`
  }

  // Cousins.
  const degree = Math.min(up, down) - 1
  const removed = Math.abs(up - down)
  let label = degree === 1 ? "Cousin" : `${ordinal(degree)} Cousin`
  if (removed === 1) label += " Once Removed"
  else if (removed === 2) label += " Twice Removed"
  else if (removed > 2) label += ` ${removed}× Removed`
  return `Your ${label}`
}
