"use client"

import { Handle, Position } from "@xyflow/react"
import type { MemberData } from "@/types"

interface PersonNodeProps {
  data: { member: MemberData }
  selected: boolean
}

const STYLES_BY_GENDER = {
  MALE: {
    bg: "bg-blue-100",
    border: "border-blue-300",
    borderSelected: "border-blue-600",
    borderHover: "hover:border-blue-400",
    initialBg: "bg-blue-200 text-blue-700",
  },
  FEMALE: {
    bg: "bg-pink-100",
    border: "border-pink-300",
    borderSelected: "border-pink-600",
    borderHover: "hover:border-pink-400",
    initialBg: "bg-pink-200 text-pink-700",
  },
  UNKNOWN: {
    bg: "bg-white",
    border: "border-gray-200",
    borderSelected: "border-blue-500",
    borderHover: "hover:border-blue-300",
    initialBg: "bg-gray-100 text-gray-400",
  },
} as const

export function PersonNode({ data, selected }: PersonNodeProps) {
  const { member } = data
  const styles = STYLES_BY_GENDER[member.gender] ?? STYLES_BY_GENDER.UNKNOWN
  const border = selected ? styles.borderSelected : `${styles.border} ${styles.borderHover}`

  return (
    <div
      className={`${styles.bg} rounded-xl shadow border-2 ${border} px-4 py-3 flex flex-col items-center gap-1 w-36 cursor-pointer transition`}
    >
      <Handle id="parent-top" type="target" position={Position.Top} className="!bg-gray-400" />
      <Handle id="spouse-left" type="source" position={Position.Left} className="!bg-pink-400" />
      <Handle id="spouse-right" type="source" position={Position.Right} className="!bg-pink-400" />
      {member.photoUrl ? (
        <img src={member.photoUrl} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-full ${styles.initialBg} flex items-center justify-center text-xl font-bold`}>
          {member.name[0]?.toUpperCase()}
        </div>
      )}
      <span className="text-xs font-semibold text-gray-900 text-center leading-tight truncate w-full text-center">
        {member.name}
      </span>
      {member.birthDate && (
        <span className="text-[10px] text-gray-500">
          {new Date(member.birthDate).getFullYear()}
          {member.deathDate ? `–${new Date(member.deathDate).getFullYear()}` : ""}
        </span>
      )}
      <Handle id="parent-bottom" type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  )
}
