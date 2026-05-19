import { auth } from "@/lib/auth"
import { getUserTrees } from "@/lib/db"
import { MembersClient } from "@/components/members/MembersClient"

export default async function MembersPage() {
  const session = await auth()
  const trees = await getUserTrees(session!.user!.id!)
  return <MembersClient initialTrees={trees} />
}
