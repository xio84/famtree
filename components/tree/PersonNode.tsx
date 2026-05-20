"use client"

import { useContext } from "react"
import { Handle, Position } from "@xyflow/react"
import type { MemberData } from "@/types"
import { CycleSpouseContext } from "./treeContext"

interface PersonNodeProps {
  data: {
    member: MemberData
    isSelf?: boolean
    /** Total number of spouses; a switcher is shown when greater than 1. */
    spouseCount?: number
    /** Index of the currently displayed spouse within that list. */
    spouseIndex?: number
  }
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
  const { member, isSelf } = data
  const cycleSpouse = useContext(CycleSpouseContext)
  const styles = STYLES_BY_GENDER[member.gender] ?? STYLES_BY_GENDER.UNKNOWN
  const border = selected ? styles.borderSelected : `${styles.border} ${styles.borderHover}`
  const spouseCount = data.spouseCount ?? 0

  return (
    <div
      className={`${styles.bg} relative rounded-xl shadow border-2 ${border} px-4 py-3 flex flex-col items-center justify-center gap-1 w-36 h-28 cursor-pointer transition ${
        isSelf ? "ring-2 ring-amber-400 ring-offset-2" : ""
      }`}
    >
      {isSelf && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          You
        </span>
      )}
      {spouseCount > 1 && (
        <div className="nodrag absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-white/90 border border-gray-300 px-1 py-0.5 shadow-sm">
          <button
            onClick={(e) => {
              e.stopPropagation()
              cycleSpouse(member.id, -1)
            }}
            className="text-gray-600 hover:text-gray-900 text-[11px] leading-none"
            aria-label="Previous spouse"
          >
            ‹
          </button>
          <span className="text-[8px] text-gray-500 tabular-nums" title="Displayed spouse">
            {(data.spouseIndex ?? 0) + 1}/{spouseCount}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              cycleSpouse(member.id, 1)
            }}
            className="text-gray-600 hover:text-gray-900 text-[11px] leading-none"
            aria-label="Next spouse"
          >
            ›
          </button>
        </div>
      )}
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
      <span className="text-xs font-semibold text-gray-900 text-center leading-tight truncate w-full">
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
