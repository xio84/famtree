"use client"

import { api } from "@/lib/api"
import { useState } from "react"

interface PhotoUploadProps {
  currentUrl?: string | null
  onUpload: (url: string) => void
}

export function PhotoUpload({ currentUrl, onUpload }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await api.upload.photo(file)
      onUpload(url)
    } catch {
      alert("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {currentUrl ? (
        <img src={currentUrl} alt="Photo" className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 text-3xl">
          ?
        </div>
      )}
      <label className="cursor-pointer text-xs text-blue-600 hover:underline">
        {uploading ? "Uploading…" : "Upload photo"}
        <input type="file" accept="image/*" onChange={handleChange} className="sr-only" disabled={uploading} />
      </label>
    </div>
  )
}
