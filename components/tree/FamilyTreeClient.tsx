"use client"

import { useCallback, useState } from "react"
import type { Connection } from "@xyflow/react"
import { useTree } from "@/hooks/useTree"
import { api } from "@/lib/api"
import { RelationshipType } from "@/app/generated/prisma/enums"
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
  const [newTreeName, setNewTreeName] = useState("")
  const [creatingTree, setCreatingTree] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [focusTick, setFocusTick] = useState(0)

  const {
    nodes,
    edges,
    members,
    addMember,
    removeMember,
    addRelationship,
    updateMemberPosition,
    isLoading,
  } = useTree(selectedTreeId)

  const selectedMember = members.find((m) => m.id === selectedMemberId)

  const trimmedQuery = searchQuery.trim().toLowerCase()
  const searchResults = trimmedQuery
    ? members
        .filter((m) => m.name.toLowerCase().includes(trimmedQuery))
        .slice(0, 20)
    : []

  function focusMember(id: string) {
    setSelectedMemberId(id)
    setFocusTick((t) => t + 1)
    setSearchQuery("")
  }

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

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Tree</label>
          <select
            value={selectedTreeId}
            onChange={(e) => setSelectedTreeId(e.target.value)}
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
            <MemberCard
              member={selectedMember}
              onClose={() => setSelectedMemberId(null)}
              onDelete={() => {
                removeMember(selectedMember.id)
                setSelectedMemberId(null)
              }}
            />
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
            onNodeClick={setSelectedMemberId}
            onConnect={handleConnect}
            onNodeDragStop={updateMemberPosition}
          />
        )}
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Add Person</h2>
            <MemberForm
              onSubmit={async (values) => {
                await addMember(values)
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
