"use client"

import { useState } from "react"
import { useMembers } from "@/hooks/useMembers"
import { MemberForm } from "./MemberForm"
import Link from "next/link"

interface MembersClientProps {
  initialTrees: { id: string; name: string }[]
}

export function MembersClient({ initialTrees }: MembersClientProps) {
  const [selectedTreeId, setSelectedTreeId] = useState(initialTrees[0]?.id ?? "")
  const [showAdd, setShowAdd] = useState(false)
  const { members, addMember, removeMember, isLoading } = useMembers(selectedTreeId)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <select
            value={selectedTreeId}
            onChange={(e) => setSelectedTreeId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {initialTrees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 transition"
        >
          + Add Person
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">No members yet. Add the first person.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 px-5 py-4 hover:shadow-sm transition"
            >
              {m.photoUrl ? (
                <img src={m.photoUrl} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold shrink-0">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.name}</p>
                {m.birthDate && (
                  <p className="text-xs text-gray-400">{new Date(m.birthDate).getFullYear()}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/members/${m.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </Link>
                <button
                  onClick={() => removeMember(m.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Add Person</h2>
            <MemberForm
              onSubmit={async (values) => {
                await addMember(values)
                setShowAdd(false)
              }}
              onCancel={() => setShowAdd(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
