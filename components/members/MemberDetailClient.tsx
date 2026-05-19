"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { MemberForm } from "./MemberForm"
import type { MemberFormValues } from "@/types"
import { useRouter } from "next/navigation"

interface MemberDetailClientProps {
  member: {
    id: string
    name: string
    gender: string
    birthDate: Date | null
    deathDate: Date | null
    photoUrl: string | null
    notes: string | null
  }
}

export function MemberDetailClient({ member }: MemberDetailClientProps) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  async function handleSubmit(values: MemberFormValues) {
    await api.members.update(member.id, values)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Person</h1>
        {saved && <span className="text-sm text-green-600 ml-auto">Saved</span>}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <MemberForm
          defaultValues={{
            name: member.name,
            gender: member.gender as MemberFormValues["gender"],
            birthDate: member.birthDate ? member.birthDate.toISOString().split("T")[0] : "",
            deathDate: member.deathDate ? member.deathDate.toISOString().split("T")[0] : "",
            notes: member.notes ?? "",
            photoUrl: member.photoUrl ?? "",
          }}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
