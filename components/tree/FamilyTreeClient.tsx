"use client"

import { useCallback, useState } from "react"
import type { Connection } from "@xyflow/react"
import { useTree } from "@/hooks/useTree"
import { api } from "@/lib/api"
import { RelationshipType } from "@/app/generated/prisma/enums"
import type { MemberData, RelationSelection, RelationshipData } from "@/types"
import { FamilyTree } from "./FamilyTree"
import { MemberForm } from "@/components/members/MemberForm"
import { MemberCard } from "@/components/members/MemberCard"

interface FamilyTreeClientProps {
  initialTrees: { id: string; name: string }[]
}

export function FamilyTreeClient({ initialTrees }: FamilyTreeClientProps) {
  const [trees, setTrees] = useState(initialTrees)
  const [selectedTreeId, setSelectedTreeId] = useState(initialTrees[0]?.id ?? "")
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [newTreeName, setNewTreeName] = useState("")
  const [creatingTree, setCreatingTree] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [focusTick, setFocusTick] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [selfId, setSelfId] = useState<string | null>(null)
  const [selfTreeId, setSelfTreeId] = useState<string | null>(null)

  // "Who am I" is a personal pointer — kept per tree in localStorage.
  // Reload it whenever the active tree changes (render-time state sync).
  if (selfTreeId !== selectedTreeId) {
    setSelfTreeId(selectedTreeId)
    setSelfId(
      typeof window === "undefined"
        ? null
        : localStorage.getItem(`famtree:self:${selectedTreeId}`)
    )
  }

  const chooseSelf = useCallback(
    (id: string) => {
      setSelfId(id)
      localStorage.setItem(`famtree:self:${selectedTreeId}`, id)
    },
    [selectedTreeId]
  )

  const {
    nodes,
    edges,
    members,
    relationships,
    addMember,
    updateMember,
    removeMember,
    addRelationship,
    removeRelationship,
    isLoading,
  } = useTree(selectedTreeId, selfId)

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const searchResults = trimmedQuery
    ? members.filter((m) => m.name.toLowerCase().includes(trimmedQuery)).slice(0, 20)
    : []

  function focusMember(id: string) {
    setSelectedMemberId(id)
    setEditMode(false)
    setFocusTick((t) => t + 1)
    setSearchQuery("")
    setPanelOpen(false) // reveal the tree on mobile
  }

  function handleNodeClick(id: string) {
    setSelectedMemberId(id)
    setEditMode(false)
    setPanelOpen(true) // show the details panel on mobile
  }

  /** Resolve the father / mother / spouse currently stored for a member. */
  const currentRelations = useCallback(
    (memberId: string) => {
      const parents = relationships
        .filter((r) => r.type === "PARENT_CHILD" && r.childId === memberId)
        .map((rel) => ({ rel, member: members.find((m) => m.id === rel.parentId) }))
        .filter((p): p is { rel: RelationshipData; member: MemberData } => !!p.member)

      let father = parents.find((p) => p.member.gender === "MALE")
      let mother = parents.find((p) => p.member.gender === "FEMALE")
      const rest = parents.filter((p) => p !== father && p !== mother)
      if (!father) father = rest.shift()
      if (!mother) mother = rest.shift()

      const spouseRel = relationships.find(
        (r) =>
          r.type === "SPOUSE" && (r.spouse1Id === memberId || r.spouse2Id === memberId)
      )
      const spouseId = spouseRel
        ? spouseRel.spouse1Id === memberId
          ? spouseRel.spouse2Id
          : spouseRel.spouse1Id
        : null

      return {
        fatherId: father?.member.id ?? "",
        fatherRelId: father?.rel.id,
        motherId: mother?.member.id ?? "",
        motherRelId: mother?.rel.id,
        spouseId: spouseId ?? "",
        spouseRelId: spouseRel?.id,
      }
    },
    [members, relationships]
  )

  /** Diff the picked family links against what is stored and sync the DB. */
  const applyRelations = useCallback(
    async (memberId: string, next: RelationSelection) => {
      const cur = currentRelations(memberId)
      if (next.fatherId !== cur.fatherId) {
        if (cur.fatherRelId) await removeRelationship(cur.fatherRelId)
        if (next.fatherId)
          await addRelationship({
            type: RelationshipType.PARENT_CHILD,
            parentId: next.fatherId,
            childId: memberId,
          })
      }
      if (next.motherId !== cur.motherId) {
        if (cur.motherRelId) await removeRelationship(cur.motherRelId)
        if (next.motherId)
          await addRelationship({
            type: RelationshipType.PARENT_CHILD,
            parentId: next.motherId,
            childId: memberId,
          })
      }
      if (next.spouseId !== cur.spouseId) {
        if (cur.spouseRelId) await removeRelationship(cur.spouseRelId)
        if (next.spouseId)
          await addRelationship({
            type: RelationshipType.SPOUSE,
            spouse1Id: memberId,
            spouse2Id: next.spouseId,
          })
      }
    },
    [currentRelations, addRelationship, removeRelationship]
  )

  const handleConnect = useCallback(
    async (c: Connection) => {
      if (!c.source || !c.target || c.source === c.target) return
      const src = c.sourceHandle ?? ""
      const tgt = c.targetHandle ?? ""
      const srcIsSpouse = src.startsWith("spouse")
      const tgtIsSpouse = tgt.startsWith("spouse")
      if (srcIsSpouse !== tgtIsSpouse) return // mismatched handle types
      if (srcIsSpouse) {
        await addRelationship({
          type: RelationshipType.SPOUSE,
          spouse1Id: c.source,
          spouse2Id: c.target,
        })
      } else {
        await addRelationship({
          type: RelationshipType.PARENT_CHILD,
          parentId: c.source,
          childId: c.target,
        })
      }
    },
    [addRelationship]
  )

  async function handleCreateTree(e: React.FormEvent) {
    e.preventDefault()
    const name = newTreeName.trim()
    if (!name) return
    setCreatingTree(true)
    try {
      const tree = (await api.trees.create(name)) as { id: string; name: string }
      setTrees((prev) => [...prev, { id: tree.id, name: tree.name }])
      setSelectedTreeId(tree.id)
      setNewTreeName("")
    } finally {
      setCreatingTree(false)
    }
  }

  if (trees.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <form
          onSubmit={handleCreateTree}
          className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col gap-4"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create your first tree</h2>
            <p className="text-sm text-gray-500 mt-1">Give it a name to get started.</p>
          </div>
          <input
            autoFocus
            required
            value={newTreeName}
            onChange={(e) => setNewTreeName(e.target.value)}
            placeholder="e.g. Smith Family"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creatingTree}
            className="rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {creatingTree ? "Creating…" : "Create tree"}
          </button>
        </form>
      </div>
    )
  }

  const relationOptionsFor = (excludeId?: string) =>
    members
      .filter((m) => m.id !== excludeId)
      .map((m) => ({ id: m.id, name: m.name }))

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {/* Mobile panel toggle */}
      <button
        onClick={() => setPanelOpen(true)}
        className="md:hidden absolute top-3 left-3 z-20 rounded-lg bg-white shadow border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
      >
        ☰ Panel
      </button>

      {/* Mobile backdrop */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-30"
        />
      )}

      {/* Sidebar — a slide-in drawer on mobile, static on desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 border-r border-gray-200 bg-white flex flex-col transition-transform md:translate-x-0 ${
          panelOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Family panel</span>
          <button
            onClick={() => setPanelOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tree</label>
          <select
            value={selectedTreeId}
            onChange={(e) => {
              setSelectedTreeId(e.target.value)
              setSelectedMemberId(null)
              setEditMode(false)
            }}
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {trees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 border-b border-gray-100">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Find</label>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name…"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {trimmedQuery && (
            <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-white">
              {searchResults.length === 0 ? (
                <li className="px-3 py-2 text-xs text-gray-400">No matches</li>
              ) : (
                searchResults.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => focusMember(m.id)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      {m.name}
                      {m.birthDate && (
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(m.birthDate).getFullYear()}
                        </span>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {selectedMember ? (
            editMode ? (
              <div className="flex flex-col gap-3">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  Edit person
                </span>
                <MemberForm
                  defaultValues={{
                    name: selectedMember.name,
                    gender: selectedMember.gender,
                    birthDate: selectedMember.birthDate
                      ? new Date(selectedMember.birthDate).toISOString().split("T")[0]
                      : "",
                    deathDate: selectedMember.deathDate
                      ? new Date(selectedMember.deathDate).toISOString().split("T")[0]
                      : "",
                    notes: selectedMember.notes ?? "",
                    photoUrl: selectedMember.photoUrl ?? "",
                  }}
                  relationOptions={relationOptionsFor(selectedMember.id)}
                  relationDefaults={currentRelations(selectedMember.id)}
                  onSubmit={async (values, relations) => {
                    await updateMember(selectedMember.id, values)
                    await applyRelations(selectedMember.id, relations)
                    setEditMode(false)
                  }}
                  onCancel={() => setEditMode(false)}
                />
              </div>
            ) : (
              <MemberCard
                member={selectedMember}
                isSelf={selfId === selectedMember.id}
                onClose={() => setSelectedMemberId(null)}
                onEdit={() => setEditMode(true)}
                onDelete={() => {
                  removeMember(selectedMember.id)
                  setSelectedMemberId(null)
                }}
                onSetSelf={() => chooseSelf(selectedMember.id)}
              />
            )
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">Click a person to see details</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 transition"
          >
            + Add Person
          </button>
        </div>
      </aside>

      {/* Tree canvas */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
        ) : (
          <FamilyTree
            nodes={nodes}
            edges={edges}
            focusNodeId={selectedMemberId}
            focusToken={focusTick}
            onNodeClick={handleNodeClick}
            onConnect={handleConnect}
          />
        )}
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Add Person</h2>
            <MemberForm
              relationOptions={relationOptionsFor()}
              onSubmit={async (values, relations) => {
                const member = await addMember(values)
                await applyRelations(member.id, relations)
                setShowAddMember(false)
              }}
              onCancel={() => setShowAddMember(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
