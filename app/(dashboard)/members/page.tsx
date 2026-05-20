import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserTrees } from "@/lib/db"
import { MembersClient } from "@/components/members/MembersClient"

export default async function MembersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trees = await getUserTrees(session.user.id)
  return <MembersClient initialTrees={trees} />
}
