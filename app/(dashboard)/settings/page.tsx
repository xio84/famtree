import { auth } from "@/lib/auth"
import { listAllowedEmails } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"
import { AllowedEmailsClient } from "@/components/settings/AllowedEmailsClient"

export default async function SettingsPage() {
  const session = await auth()
  const isAdmin = isAdminEmail(session?.user?.email)
  const allowed = isAdmin ? await listAllowedEmails() : []

  return (
    <div className="max-w-lg mx-auto px-6 py-10 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm text-gray-500 mb-1">Signed in as</p>
        <p className="font-medium text-gray-900">{session?.user?.email}</p>
        {isAdmin && (
          <p className="text-xs text-blue-600 mt-1">Admin</p>
        )}
      </div>

      {isAdmin && (
        <AllowedEmailsClient
          initial={allowed.map((e) => ({
            id: e.id,
            email: e.email,
            addedAt: e.addedAt.toISOString(),
          }))}
        />
      )}
    </div>
  )
}
