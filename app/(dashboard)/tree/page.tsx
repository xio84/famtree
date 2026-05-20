import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getUserTrees } from "@/lib/db"
import { FamilyTreeClient } from "@/components/tree/FamilyTreeClient"

export default async function TreePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const trees = await getUserTrees(session.user.id)
  return <FamilyTreeClient initialTrees={trees} />
}
