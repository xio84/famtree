"use client"

import type { MemberData } from "@/types"
import Link from "next/link"

interface MemberCardProps {
  member: MemberData
  onClose?: () => void
  onDelete?: () => void
}

export function MemberCard({ member, onClose, onDelete }: MemberCardProps) {
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
      <p className="font-semibold text-gray-900 text-center">{member.name}</p>
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
        <Link
          href={`/members/${member.id}`}
          className="flex-1 text-center text-xs rounded-lg border border-gray-200 py-1.5 hover:bg-gray-50 transition text-gray-700"
        >
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 text-xs rounded-lg border border-red-200 py-1.5 hover:bg-red-50 transition text-red-600"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
