import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { signOut } from "@/lib/auth"
import Link from "next/link"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link href="/tree" className="font-semibold text-gray-900 hover:text-blue-600 transition">
            Tree
          </Link>
          <Link href="/members" className="text-gray-600 hover:text-blue-600 transition text-sm">
            Members
          </Link>
          <Link href="/settings" className="text-gray-600 hover:text-blue-600 transition text-sm">
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.name}</span>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button type="submit" className="text-sm text-gray-500 hover:text-red-500 transition">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
