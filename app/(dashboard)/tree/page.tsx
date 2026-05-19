import { auth } from "@/lib/auth"
import { getUserTrees } from "@/lib/db"
import { FamilyTreeClient } from "@/components/tree/FamilyTreeClient"

export default async function TreePage() {
  const session = await auth()
  const trees = await getUserTrees(session!.user!.id!)
  return <FamilyTreeClient initialTrees={trees} />
}
