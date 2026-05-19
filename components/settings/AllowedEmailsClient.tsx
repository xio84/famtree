"use client"

import { useState } from "react"

interface AllowedEmail {
  id: string
  email: string
  addedAt: string | Date
}

interface Props {
  initial: AllowedEmail[]
}

export function AllowedEmailsClient({ initial }: Props) {
  const [emails, setEmails] = useState<AllowedEmail[]>(initial)
  const [newEmail, setNewEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function addEmail(e: React.FormEvent) {
    e.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!email) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/allowed-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(
          typeof body.error === "string"
            ? body.error
            : `Request failed: ${res.status}`
        )
        return
      }
      const created = (await res.json()) as AllowedEmail
      setEmails((prev) => [...prev, created])
      setNewEmail("")
    } finally {
      setBusy(false)
    }
  }

  async function removeEmail(id: string) {
    const res = await fetch(`/api/admin/allowed-emails/${id}`, { method: "DELETE" })
    if (!res.ok) return
    setEmails((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Allowed users</h2>
      <p className="text-sm text-gray-500 mb-4">
        Only emails on this list (plus admins) can sign in with Google.
      </p>

      <form onSubmit={addEmail} className="flex gap-2 mb-4">
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="person@example.com"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700 disabled:opacity-60 transition"
        >
          Add
        </button>
      </form>

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

      {emails.length === 0 ? (
        <p className="text-sm text-gray-400">No allowed emails yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {emails.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
            >
              <span className="text-sm text-gray-800">{e.email}</span>
              <button
                onClick={() => removeEmail(e.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
