"use client"

import { useState } from "react"
import type { MemberFormValues } from "@/types"
import { Gender } from "@/app/generated/prisma/enums"
import { PhotoUpload } from "./PhotoUpload"

interface MemberFormProps {
  defaultValues?: Partial<MemberFormValues>
  onSubmit: (values: MemberFormValues) => Promise<void>
  onCancel?: () => void
}

export function MemberForm({ defaultValues, onSubmit, onCancel }: MemberFormProps) {
  const [values, setValues] = useState<MemberFormValues>({
    name: defaultValues?.name ?? "",
    gender: defaultValues?.gender ?? Gender.UNKNOWN,
    birthDate: defaultValues?.birthDate ?? "",
    deathDate: defaultValues?.deathDate ?? "",
    notes: defaultValues?.notes ?? "",
    photoUrl: defaultValues?.photoUrl ?? "",
  })
  const [loading, setLoading] = useState(false)

  function set<K extends keyof MemberFormValues>(key: K, value: MemberFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const clean: MemberFormValues = {
        name: values.name,
        gender: values.gender,
        birthDate: values.birthDate || undefined,
        deathDate: values.deathDate || undefined,
        notes: values.notes || undefined,
        photoUrl: values.photoUrl || undefined,
      }
      await onSubmit(clean)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PhotoUpload currentUrl={values.photoUrl} onUpload={(url) => set("photoUrl", url)} />

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
        <input
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="First Last"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
        <select
          value={values.gender}
          onChange={(e) => set("gender", e.target.value as Gender)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={Gender.UNKNOWN}>Unknown</option>
          <option value={Gender.MALE}>Male</option>
          <option value={Gender.FEMALE}>Female</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Birth date</label>
          <input
            type="date"
            value={values.birthDate ?? ""}
            onChange={(e) => set("birthDate", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Death date</label>
          <input
            type="date"
            value={values.deathDate ?? ""}
            onChange={(e) => set("deathDate", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          rows={3}
          value={values.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Any additional notes…"
        />
      </div>

      <div className="flex gap-3 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 text-white text-sm font-medium py-2 hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}
