"use client"

import type { MemberData } from "@/types"

interface MemberCardProps {
  member: MemberData
  isSelf?: boolean
  onClose?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSetSelf?: () => void
}

export function MemberCard({
  member,
  isSelf,
  onClose,
  onEdit,
  onDelete,
  onSetSelf,
}: MemberCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Person</span>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        )}
      </div>
      {member.photoUrl && (
        <img src={member.photoUrl} alt={member.name} className="w-20 h-20 rounded-full object-cover mx-auto" />
      )}
      <p className="font-semibold text-gray-900 text-center">
        {member.name}
        {isSelf && (
          <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white align-middle">
            You
          </span>
        )}
      </p>
      {member.birthDate && (
        <p className="text-xs text-gray-500 text-center">
          Born {new Date(member.birthDate).toLocaleDateString()}
        </p>
      )}
      {member.deathDate && (
        <p className="text-xs text-gray-500 text-center">
          Died {new Date(member.deathDate).toLocaleDateString()}
        </p>
      )}
      {member.notes && <p className="text-sm text-gray-600 border-t border-gray-100 pt-2">{member.notes}</p>}
      <div className="flex gap-2 mt-2">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 text-center text-xs rounded-lg border border-gray-200 py-1.5 hover:bg-gray-50 transition text-gray-700"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 text-xs rounded-lg border border-red-200 py-1.5 hover:bg-red-50 transition text-red-600"
          >
            Remove
          </button>
        )}
      </div>
      {onSetSelf && (
        <button
          onClick={onSetSelf}
          disabled={isSelf}
          className="text-xs rounded-lg border border-amber-300 py-1.5 hover:bg-amber-50 transition text-amber-700 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          {isSelf ? "This is you" : "This is me"}
        </button>
      )}
    </div>
  )
}
